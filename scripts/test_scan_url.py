"""Deterministic scanner safety tests: no target network connections."""
import importlib.util
import pathlib
import unittest
from unittest.mock import patch, MagicMock

spec = importlib.util.spec_from_file_location("scanner", pathlib.Path(__file__).with_name("scan-url.py"))
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)


class ScanSafetyTests(unittest.TestCase):
    hosts = {"shortener.com", "bank.com", "collector.com"}

    def response(self, status=200, location=None, body=b"<title>Bank</title>"):
        return {"status": status, "location": location, "body": body, "contentType": "text/html", "tls": {"verified": True}}

    def test_public_ip_boundaries(self):
        for ip in ["127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "::ffff:127.0.0.1", "224.0.0.1", "192.0.2.1"]:
            with self.subTest(ip=ip), self.assertRaises(ValueError):
                scanner.public_ip(ip)
        self.assertEqual(scanner.public_ip("8.8.8.8"), "8.8.8.8")

    def test_private_answer_at_second_hop_never_connects(self):
        transport = MagicMock(return_value=self.response(302, "https://collector.com/"))
        with self.assertRaises(ValueError):
            scanner.scan("https://shortener.com/a", self.hosts, lambda host, port: ["8.8.8.8"] if host == "shortener.com" else ["10.0.0.1"], transport)
        self.assertEqual(transport.call_count, 1)

    def test_authorized_redirect_and_final_content(self):
        transport = MagicMock(side_effect=[self.response(302, "https://bank.com/login"), self.response()])
        result = scanner.scan("https://shortener.com/a", self.hosts, lambda host, port: ["8.8.8.8"], transport)
        self.assertEqual(result["finalUrl"], "https://bank.com/login")
        self.assertEqual(len(result["hops"]), 2)
        self.assertFalse(result["scriptsExecuted"])

    def test_loop_and_hop_limits(self):
        with self.assertRaises(ValueError):
            scanner.scan("https://bank.com/a", self.hosts, lambda host, port: ["8.8.8.8"], lambda *args: self.response(302, "/a"))
        transport = MagicMock(side_effect=[self.response(302, "/" + str(i)) for i in range(6)])
        with self.assertRaises(ValueError):
            scanner.scan("https://bank.com/start", self.hosts, lambda host, port: ["8.8.8.8"], transport)
        self.assertEqual(transport.call_count, 6)

    def test_no_sensitive_input_or_unauthorized_egress(self):
        for url in ["https://bank.com/?token=secret", "https://name:password@bank.com/", "https://bank.com/#secret", "http://127.0.0.1/", "https://other.com/", "ftp://bank.com/", "https://bank.com:8080/", "https://bank.com/\n"]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                scanner.validate_url(url, self.hosts)

    def test_downgrade_size_and_missing_location(self):
        for response in [self.response(302, "http://bank.com/"), self.response(body=b"x" * 131073), self.response(302), self.response(403)]:
            with self.subTest(status=response["status"]), self.assertRaises(ValueError):
                scanner.scan("https://bank.com/", self.hosts, lambda host, port: ["8.8.8.8"], lambda *args: response)

    def test_connection_pins_ip_and_verifies_sni(self):
        sock = MagicMock()
        sock.getpeername.return_value = ("8.8.8.8", 443)
        context = MagicMock()
        with patch.object(scanner.socket, "create_connection", return_value=sock) as connect, patch.object(scanner.ssl, "create_default_context", return_value=context):
            connection = scanner.PinnedConnection("bank.com", 443, "8.8.8.8", True, 5)
            connection.connect()
            connect.assert_called_once_with(("8.8.8.8", 443), 5)
            context.wrap_socket.assert_called_once_with(sock, server_hostname="bank.com")


if __name__ == "__main__":
    unittest.main()