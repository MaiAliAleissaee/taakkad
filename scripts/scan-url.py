"""Explicit operator-only, non-executing scanner; not an application endpoint.

Use only on authorized hosts: python3 scripts/scan-url.py URL --allow-host HOST.
Each redirect host must be explicitly authorized. No cookies, queries, fragments,
credentials, scripts, forms, proxy settings or browser state are transmitted.
Requires an isolated Python environment; never import into the Worker app.
"""
import argparse
import hashlib
import http.client
import ipaddress
import json
import socket
import signal
import ssl
import time
from urllib.parse import urljoin, urlsplit

MAX_BODY = 131072
MAX_HOPS = 6
TIMEOUT = 5
MAX_SECONDS = 20


def public_ip(value):
    address = ipaddress.ip_address(value)
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        address = address.ipv4_mapped
    if not address.is_global or address.is_multicast:
        raise ValueError("Non-public destination blocked")
    return str(address)


def validate_url(value, allowed_hosts):
    if len(value) > 2000 or any(ord(c) <= 32 or ord(c) == 127 for c in value) or "\\" in value:
        raise ValueError("Malformed URL blocked")
    parsed = urlsplit(value)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("Only HTTP(S) is supported")
    if parsed.username is not None or parsed.password is not None or parsed.query or parsed.fragment:
        raise ValueError("Credential, query and fragment URLs are not scanned")
    host = parsed.hostname.encode("idna").decode("ascii").lower().rstrip(".")
    if host not in allowed_hosts:
        raise ValueError("Destination host is outside the explicit operator authorization")
    if parsed.port not in (None, 80 if parsed.scheme == "http" else 443):
        raise ValueError("Nonstandard port blocked")
    if host == "metadata.google.internal" or host.endswith((".localhost", ".local", ".internal", ".example", ".test", ".invalid", ".onion")) or "." not in host:
        raise ValueError("Special-use hostname blocked")
    try:
        ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        raise ValueError("IP-literal URL blocked")
    return parsed, host


def resolve_public(host, port):
    # The OS resolver has its own timeout. Deploy with an OS DNS deadline and
    # process wall-clock limit; the HTTP deadline alone does not cap getaddrinfo.
    values = sorted({item[4][0] for item in socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)})
    if not values or len(values) > 8:
        raise ValueError("Missing or excessive DNS answers")
    return [public_ip(value) for value in values]


class PinnedConnection(http.client.HTTPConnection):
    def __init__(self, host, port, pinned_ip, secure, timeout):
        super().__init__(host, port=port, timeout=timeout)
        self.pinned_ip, self.secure = pinned_ip, secure

    def connect(self):
        # No second hostname resolution: connect only to the validated literal.
        connection = socket.create_connection((self.pinned_ip, self.port), self.timeout)
        try:
            if public_ip(connection.getpeername()[0]) != self.pinned_ip:
                raise ValueError("Connected address does not match pinned DNS answer")
            if self.secure:
                connection = ssl.create_default_context().wrap_socket(connection, server_hostname=self.host)
            self.sock = connection
        except Exception:
            connection.close()
            raise


def fetch_hop(parsed, host, addresses, timeout):
    connection = PinnedConnection(host, parsed.port or (443 if parsed.scheme == "https" else 80), addresses[0], parsed.scheme == "https", timeout)
    try:
        connection.request("GET", parsed.path or "/", headers={"Host": host, "User-Agent": "Taakkad-Authorized-Static-Inspection/1.0", "Accept": "text/html", "Accept-Encoding": "identity", "Connection": "close"})
        tls = None
        if connection.sock is not None and parsed.scheme == "https":
            cert = connection.sock.getpeercert()
            tls = {"verified": True, "protocol": connection.sock.version(), "notBefore": cert.get("notBefore"), "notAfter": cert.get("notAfter")}
        response = connection.getresponse()
        status = response.status
        location = response.getheader("Location")
        content_type = response.getheader("Content-Type", "")
        if response.getheader("Content-Encoding", "identity").lower() not in ("", "identity"):
            raise ValueError("Compressed content is unsupported")
        if status in (301, 302, 303, 307, 308):
            body = b""  # Do not consume irrelevant redirect bodies.
        else:
            body = response.read(MAX_BODY + 1)
            if len(body) > MAX_BODY:
                raise ValueError("Response size limit exceeded")
        return {"status": status, "location": location, "contentType": content_type, "body": body, "tls": tls}
    finally:
        connection.close()


def scan(url, allowed_hosts, resolver=resolve_public, transport=fetch_hop):
    started = time.monotonic()
    hops, seen = [], set()
    current = url
    for _ in range(MAX_HOPS):
        if time.monotonic() - started >= MAX_SECONDS:
            raise ValueError("Overall scan deadline exceeded")
        parsed, host = validate_url(current, allowed_hosts)
        canonical = parsed.geturl()
        if canonical in seen:
            raise ValueError("Redirect loop blocked")
        seen.add(canonical)
        addresses = resolver(host, parsed.port or (443 if parsed.scheme == "https" else 80))
        if not addresses or len(addresses) > 8:
            raise ValueError("Missing or excessive DNS answers")
        addresses = [public_ip(address) for address in addresses]
        result = transport(parsed, host, addresses, min(TIMEOUT, MAX_SECONDS - (time.monotonic() - started)))
        hops.append({"url": canonical, "resolvedIps": addresses, "status": result["status"], "tls": result["tls"]})
        if result["status"] in (301, 302, 303, 307, 308):
            if not result["location"]:
                raise ValueError("Redirect has no location")
            next_url = urljoin(canonical, result["location"])
            next_parsed, _ = validate_url(next_url, allowed_hosts)
            if parsed.scheme == "https" and next_parsed.scheme != "https":
                raise ValueError("HTTPS downgrade blocked")
            current = next_url
            continue
        if not 200 <= result["status"] < 300:
            raise ValueError("Destination did not return successful content")
        body = result["body"]
        if len(body) > MAX_BODY:
            raise ValueError("Response size limit exceeded")
        html = body.decode("utf-8", errors="replace") if result["contentType"].lower().startswith("text/html") else None
        return {"scope": "operator_authorized_static_scan", "hops": hops, "finalUrl": canonical, "html": html, "bodySha256": hashlib.sha256(body).hexdigest(), "scriptsExecuted": False, "confirmedCloaking": False}
    raise ValueError("Redirect hop limit exceeded")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url")
    parser.add_argument("--allow-host", action="append", required=True)
    args = parser.parse_args()
    def deadline(signum, frame):
        raise TimeoutError("Overall scan deadline exceeded")
    # POSIX hard deadline includes DNS, TLS and slow-drip reads. Windows needs
    # an equivalent external process limit; do not run this CLI without one.
    if not hasattr(signal, "SIGALRM"):
        parser.error("This scanner requires a POSIX process deadline")
    signal.signal(signal.SIGALRM, deadline)
    signal.alarm(MAX_SECONDS)
    # Do not log input or remote HTML on failure.
    try:
        print(json.dumps(scan(args.url, {h.encode("idna").decode("ascii").lower() for h in args.allow_host}), ensure_ascii=False))
    except Exception as error:
        print(json.dumps({"status": "unavailable", "errorType": type(error).__name__, "reason": str(error) if isinstance(error, ValueError) else "Authorized scan transport unavailable"}))
        raise SystemExit(1)
    finally:
        signal.alarm(0)