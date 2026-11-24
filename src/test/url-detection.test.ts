import { describe, it, expect } from "vitest";
import { analyzeUrl, isBlockedHost } from "@/lib/services/url/analyze";
import { splitHost } from "@/lib/services/lookalike";
import { assessMessage } from "@/lib/services/verification";
import { combinedRiskScore } from "@/lib/services/hybrid-analysis";
import { developmentUrls, heldOutUrls } from "./fixtures/url-evaluation";
import { evaluateUrls } from "@/lib/services/url/evaluation";

describe("URL technical policy", () => {
  it.each(["adcb.com", "tamm.abudhabi", "uaepass.ae", "moi.gov.ae", "dubaipolice.gov.ae", "rta.ae", "emiratesnbd.com", "bankfab.com", "dib.ae"])("does not flag sensitive words on official %s", domain => {
    const r = analyzeUrl(`https://${domain}/login/payment/verification/account`);
    expect(r.officialDomain).toBe(domain); expect(r.classification).toBe("low");
  });
  it("does not confer registry verification from an official reference", () => {
    expect(assessMessage({ channel: "website", sender: "https://adcb.com/login", url: "https://adcb.com/login", body: "" }, { organizations: [], blocklist: [] }).state).toBe("unverified");
  });
  it("requires an exact domain boundary", () => {
    const r = analyzeUrl("https://adcb.com.attacker.example/login");
    expect(r.officialDomain).toBeNull(); expect(r.classification).toBe("suspicious"); expect(r.host).toBe("adcb.com.attacker.example");
  });
  it("uses maintained public/private suffix data", () => {
    expect(splitHost("login.bank.co.uk")).toEqual({ core: "bank", suffix: "co.uk", registrable: "bank.co.uk" });
    expect(analyzeUrl("https://shop.github.io/login").domain).toBe("shop.github.io");
  });
  it.each(["https://еmiratesnbd.example/login", "https://bаnkfab.example/pay"])("detects Unicode brand homoglyphs %s", url => {
    const r = analyzeUrl(url); expect(r.host).toContain("xn--"); expect(r.signals.some(s => s.code === "homoglyph")).toBe(true); expect(r.classification).toBe("suspicious");
    expect(analyzeUrl(`https://${r.host}/login`).classification).toBe("suspicious");
  });
  it("does not flag Unicode alone", () => expect(analyzeUrl("https://مثال.example/catalog").classification).not.toBe("suspicious"));
  it("detects bank typosquatting", () => expect(analyzeUrl("https://emiratesnbdd.example/login").classification).toBe("suspicious"));
  it("detects government and traffic-fine lures", () => expect(analyzeUrl("https://traffic-fines.example/pay").classification).toBe("suspicious"));
  it("does not label an absent registry domain as fraud", () => expect(assessMessage({ channel: "website", sender: "shop.example", url: "https://shop.example/payment", body: "" }, { organizations: [], blocklist: [] }).state).toBe("unverified"));
  it("identifies username deception without returning passwords", () => {
    const r = analyzeUrl("https://adcb.com:private-password@collector.example/login"); expect(r.host).toBe("collector.example"); expect(r.signals.some(s => s.code === "userinfo")).toBe(true); expect(JSON.stringify(r)).not.toContain("private-password");
  });
  it.each(["http://127.0.0.1", "http://2130706433", "http://0x7f000001", "http://[::1]", "http://[::ffff:127.0.0.1]", "http://169.254.169.254", "http://10.1.1.1", "http://192.0.2.1", "http://localhost", "http://metadata.google.internal", "http://name.local"])("blocks network access to %s", url => expect(analyzeUrl(url).networkEligible).toBe(false));
  it("recognizes public IPs without fetching them", () => { expect(isBlockedHost("8.8.8.8")).toBe(false); expect(analyzeUrl("https://8.8.8.8/login").networkEligible).toBe(false); });
  it("reports shorteners as hidden, not automatically fraudulent", () => { const r = analyzeUrl("https://bit.ly/anything"); expect(r.signals.some(s => s.code === "shortener")).toBe(true); expect(r.classification).not.toBe("suspicious"); });
  it.each(["javascript:alert(1)", "file:///etc/passwd", "https://%zz.example", "https://example.com/%q0", "https://example.com\n"]) ("rejects malformed/protocol URL %s", url => { const r = analyzeUrl(url); expect(r.valid).toBe(false); expect(r.networkEligible).toBe(false); });
  it("observes encoded path and redirect parameters without claiming expansion", () => {
    const r = analyzeUrl("https://adcb.com/login?next=https%3A%2F%2Fcollector.example%2Fpay"); expect(r.signals.some(s => s.code === "redirect_parameter")).toBe(true); expect(r.officialDomain).toBe("adcb.com");
    expect(analyzeUrl("https://shop.example/%256cogin").signals.some(s => s.code === "encoded_path")).toBe(true);
  });
  it("keeps numeric hybrid scores bounded and preserves deterministic fallback", () => {
    const assessment = assessMessage({ channel: "website", sender: "", url: "https://uaepass-login.example/otp", body: "" }, { organizations: [], blocklist: [] });
    expect(assessment.state).toBe("suspicious"); expect(combinedRiskScore(assessment, { status: "unavailable", reason: "service" })).toBe(assessment.riskScore);
    expect(combinedRiskScore(assessment,null,true)).toBeGreaterThanOrEqual(65); expect(assessment.riskScore).toBeLessThanOrEqual(100);
  });
  it("keeps development and held-out URL examples disjoint", () => {
    const dev = new Set(developmentUrls.map(r=>r.url)); expect(heldOutUrls.filter(r=>dev.has(r.url))).toEqual([]); expect(heldOutUrls).toHaveLength(48);
  });
  it("calculates confusion metrics from actual labels", () => {
    expect(evaluateUrls([{id:"a",url:"https://uaepass-login.example/otp",label:"suspicious"},{id:"b",url:"https://adcb.com/login",label:"legitimate"},{id:"c",url:"https://adcb-help.example/login",label:"legitimate"},{id:"d",url:"https://unknown.example",label:"suspicious"}])).toMatchObject({ tp:1,tn:1,fp:1,fn:1,precision:0.5,recall:0.5,f1:0.5,falsePositiveRate:0.5,accuracy:0.5 });
  });
});
