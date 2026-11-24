import { parse } from "tldts";

/** No domain identity lists, page features, dataset columns, network or persistence. */
export const urlFeatureNames = [
  "length", "host_length", "path_length", "query_length", "fragment_length",
  "host_labels", "path_segments", "query_parameters", "digits", "digit_ratio",
  "host_digits", "host_digit_ratio", "hyphens", "host_hyphens", "dots", "slashes",
  "at_signs", "percent_signs", "equals", "ampersands", "underscores", "tildes",
  "https", "ip_host", "userinfo", "port", "punycode", "subdomain_length",
  "domain_label_length", "suffix_length", "host_entropy", "path_entropy",
  "longest_host_token", "longest_path_token", "sensitive_tokens", "non_ascii",
] as const;
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
const entropy = (s: string) => {
  if (!s.length) return 0;
  const counts = new Map<string, number>();
  for (const c of s) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.values()].reduce((v, n) => v - (n / s.length) * Math.log2(n / s.length), 0);
};
const longest = (s: string) => Math.max(0, ...s.split(/[^a-z0-9]/i).map(t => t.length));
export function urlFeatures(raw: string): number[] | null {
  const value = raw.trim();
  if (!value || value.length > 2000 || /[\u0000-\u0020\u007f]/.test(value) || /%(?![\da-f]{2})/i.test(value)) return null;
  let u: URL;
  try { u = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`); } catch { return null; }
  if (!["http:", "https:"].includes(u.protocol)) return null;
  const host = u.hostname.toLowerCase().replace(/\.$/, ""), path = u.pathname;
  const p = parse(host, { allowPrivateDomains: true });
  const digits = count(value, /\d/g), hd = count(host, /\d/g);
  return [value.length, host.length, path.length, u.search.length, u.hash.length,
    host.split(".").length, path.split("/").filter(Boolean).length, [...u.searchParams].length,
    digits, digits / value.length, hd, hd / Math.max(1, host.length),
    count(value, /-/g), count(host, /-/g), count(value, /\./g), count(value, /\//g),
    count(value, /@/g), count(value, /%/g), count(value, /=/g), count(value, /&/g),
    count(value, /_/g), count(value, /~/g), Number(u.protocol === "https:"), Number(p.isIp),
    Number(Boolean(u.username || u.password)), Number(Boolean(u.port)), Number(host.includes("xn--")),
    (p.subdomain ?? "").length, (p.domainWithoutSuffix ?? "").length, (p.publicSuffix ?? "").length,
    entropy(host), entropy(path), longest(host), longest(path),
    count(value.toLowerCase(), /login|signin|verify|password|account|secure|update|bank|payment|auth/g),
    count(value, /[^\x00-\x7f]/g)];
}
export function urlDomainGroup(raw: string): string {
  try { const h = new URL(raw.replace(/^hxxps:/, "https:").replace(/^hxxp:/, "http:")).hostname.toLowerCase().replace(/\.$/, ""); return parse(h, { allowPrivateDomains: true }).domain ?? h; }
  catch { return raw; }
}