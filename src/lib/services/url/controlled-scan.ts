import { parse, type DefaultTreeAdapterTypes } from "parse5";
import ipaddr from "ipaddr.js";
import { analyzeUrl, isBlockedHost } from "./analyze";
import { officialReferences, isDomainBoundary } from "./official-references";

/** Offline controlled fixtures only. No network access, JavaScript execution or live verification claim. */
export function inspectPageFixture(url: string, html: string) {
  if (html.length > 131072) throw new Error("Fixture oversized");
  const page = analyzeUrl(url);
  if (!page.valid) throw new Error("Invalid fixture URL");
  const tree = parse(html, { scriptingEnabled: false });
  const elements: DefaultTreeAdapterTypes.Element[] = [];
  function walk(node: DefaultTreeAdapterTypes.Node) {
    if ("tagName" in node) { if (["script", "style", "template"].includes(node.tagName)) return; elements.push(node); }
    if ("childNodes" in node) for (const child of node.childNodes) walk(child);
  }
  walk(tree);
  const attribute = (node: DefaultTreeAdapterTypes.Element, name: string) => node.attrs.find(a => a.name === name)?.value ?? "";
  function text(node: DefaultTreeAdapterTypes.Node): string {
    if ("value" in node && node.nodeName === "#text") return node.value;
    return "childNodes" in node ? node.childNodes.map(text).join(" ") : "";
  }
  const title = elements.filter(e => e.tagName === "title").map(text).join(" ").toLowerCase().replace(/[\s-]+/g, "");
  const titleMismatch = officialReferences.some(ref => ref.aliases.some(alias => title.includes(alias)) && !isDomainBoundary(page.host, ref.domain));
  const credentialForms = elements.filter(e => e.tagName === "form" && e.childNodes.some(function hasPassword(node): boolean {
    return ("tagName" in node && node.tagName === "input" && (attribute(node, "type").toLowerCase() === "password" || /^(?:otp|password|cardnumber)$/i.test(attribute(node, "name")))) || ("childNodes" in node && node.childNodes.some(hasPassword));
  }));
  const externalCredentialForm = credentialForms.some(form => {
    try { const action = new URL(attribute(form, "action") || url, url); const target = analyzeUrl(action.href); return !target.valid || target.domain !== page.domain || action.protocol !== "https:"; } catch { return true; }
  });
  return { scope: "controlled_fixture_only" as const, titleMismatch, externalCredentialForm, credentialFormCount: credentialForms.length, suspicious: externalCredentialForm || (titleMismatch && credentialForms.length > 0) };
}

/** Differential indicators, never confirmed cloaking: legitimate variants can differ. */
export function comparePageFixtures(url: string, first: string, second: string) {
  const a = inspectPageFixture(url, first), b = inspectPageFixture(url, second);
  return { scope: "controlled_fixture_only" as const, partialCloakingIndicator: a.suspicious !== b.suspicious || a.credentialFormCount !== b.credentialFormCount, confirmedCloaking: false as const };
}

export interface ControlledHop { url: string; resolvedIps: string[] }
/** A policy harness, not a transport. Fresh validated IPs MUST be bound to each actual connection by a future scanner. */
export function inspectRedirectFixture(hops: ControlledHop[]) {
  if (!hops.length || hops.length > 6) return { scope: "controlled_fixture_only" as const, blocked: true, suspicious: false, crossDomain: false };
  const results = hops.map(h => analyzeUrl(h.url));
  const blocked = hops.some((hop, i) => {
    const result = results[i];
    return !result?.networkEligible || !hop.resolvedIps.length || hop.resolvedIps.length > 8 || hop.resolvedIps.some(ip => !ipaddr.isValid(ip) || isBlockedHost(ip));
  });
  const first = results[0];
  return { scope: "controlled_fixture_only" as const, blocked, crossDomain: results.some(r => r.domain !== first?.domain), suspicious: results.some(r => r.classification === "suspicious") };
}