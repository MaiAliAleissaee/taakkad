import { describe, expect, it, vi } from "vitest";
import { analyzeUrl } from "@/lib/services/url/analyze";
import { lookupDns } from "@/lib/services/url/dns.server";
import { inspectPageFixture, comparePageFixtures, inspectRedirectFixture } from "@/lib/services/url/controlled-scan";
const response = (data: unknown) => new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
describe("Phase 1B general URL evidence", () => {
  it.each(["https://uaepasssupport.example/account", "https://secureuaepass.example/login", "https://credential-harvest.example/verify", "https://192.0.2.10/login"]) ("detects compound or contextual %s", url => expect(analyzeUrl(url).classification).toBe("suspicious"));
  it.each(["https://tamm-archive.example/history", "https://shop.example/payment", "https://library.example/account", "https://adcb-news.example/blog"]) ("does not turn mere mentions/unknown login into fraud %s", url => expect(analyzeUrl(url).classification).not.toBe("suspicious"));
  it.each(["https://adcb.com/next?target=https%253A%252F%252Fuaepass-secure.example%252Fotp", "https://adcb.com/next?to=//uaepass-secure.example/otp", "https://adcb.com/r?u=aHR0cHM6Ly91YWVwYXNzLWxvZ2luLmV4YW1wbGUv"]) ("does not allow official outer domains to conceal nested suspicion %s", url => expect(analyzeUrl(url).signals.some(s => s.code === "nested_suspicion")).toBe(true));
  it("keeps legitimate cross-domain OAuth redirects as observations", () => expect(analyzeUrl("https://login.microsoftonline.com/auth?redirect_uri=https%3A%2F%2Fportal.office.com%2F").classification).not.toBe("suspicious"));
  it("detects misleading account-action brand path", () => expect(analyzeUrl("https://collector.example/https://www.adcb.com/login").classification).toBe("suspicious"));
  it("keeps deep nested analysis bounded", () => { let url = "https://uaepass-login.example/otp"; for(let i=0;i<20;i++) url = `https://relay.example/?next=${encodeURIComponent(url)}`; expect(analyzeUrl(url).riskScore).toBeLessThanOrEqual(100); });
});
describe("DNS fixed-origin and privacy boundaries", () => {
  it("gets actual requested subdomain records and public ASN metadata only", async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async input => String(input).includes("stat.ripe.net") ? response({status:"ok",data:{asns:["15169"],prefix:"8.8.8.0/24"}}) : response({Status:0,AD:true,Answer:[{name:"login.adcb.com.",type:1,data:"8.8.8.8"}]}));
    expect(await lookupDns("login.adcb.com",request)).toMatchObject({status:"available",domain:"login.adcb.com",addresses:["8.8.8.8"],network:{asns:[15169]}});
    expect(request).toHaveBeenCalledTimes(3);
    for(const [url,options] of request.mock.calls) { expect(["dns.google","stat.ripe.net"]).toContain(new URL(String(url)).hostname); expect(options).toMatchObject({redirect:"manual",credentials:"omit",referrerPolicy:"no-referrer"}); }
  });
  it.each(["localhost","site.example","127.0.0.1","adcb.com/private?secret=value","adcb.com@127.0.0.1"]) ("blocks inappropriate DNS input %s", async domain => { const request=vi.fn<typeof fetch>();expect(await lookupDns(domain,request)).toMatchObject({status:"unavailable",reason:"blocked"});expect(request).not.toHaveBeenCalled(); });
  it("never enriches a private DNS answer or connects to it", async () => { const request=vi.fn<typeof fetch>().mockImplementation(async()=>response({Status:0,Answer:[{name:"adcb.com.",type:1,data:"10.0.0.1"}]}));expect(await lookupDns("adcb.com",request)).toMatchObject({status:"available",nonPublicAnswers:true,network:null});expect(request).toHaveBeenCalledTimes(2); });
  it("rejects DNS provider redirects", async () => {const request=vi.fn<typeof fetch>().mockResolvedValue(new Response(null,{status:302,headers:{Location:"http://169.254.169.254"}}));expect(await lookupDns("adcb.com",request)).toMatchObject({status:"unavailable"});expect(request).toHaveBeenCalledTimes(2);});
  it("does not invent NXDOMAIN or oversized records", async()=>{ expect(await lookupDns("adcb.com",vi.fn<typeof fetch>().mockImplementation(async()=>response({Status:3})))).toMatchObject({reason:"no_records"});expect(await lookupDns("adcb.com",vi.fn<typeof fetch>().mockImplementation(async()=>response({padding:"x".repeat(70000)})))).toMatchObject({status:"unavailable"}); });
});
describe("Controlled non-executing page and redirect fixtures", () => {
  const lure = '<title>UAE PASS Secure</title><form action="https://collector.example/send"><input type="password"></form><script>throw new Error("must not run")</script>';
  it("detects title/domain mismatch with credential collection without executing scripts", () => expect(inspectPageFixture("https://lure.example/login",lure)).toMatchObject({scope:"controlled_fixture_only",titleMismatch:true,externalCredentialForm:true,suspicious:true}));
  it("does not reject legitimate same-domain bank login",()=>expect(inspectPageFixture("https://adcb.com/login",'<title>ADCB</title><form action="/auth"><input type="password"></form>')).toMatchObject({suspicious:false}));
  it("does not treat a news mention alone as impersonation",()=>expect(inspectPageFixture("https://news.example/story",'<title>UAE PASS scam warning</title>')).toMatchObject({suspicious:false}));
  it("flags variants only as partial, never confirmed cloaking",()=>expect(comparePageFixtures("https://lure.example/login","<title>Welcome</title>",lure)).toEqual({scope:"controlled_fixture_only",partialCloakingIndicator:true,confirmedCloaking:false}));
  it("rejects oversized HTML",()=>expect(()=>inspectPageFixture("https://adcb.com", "x".repeat(131073))).toThrow());
  it.each(["127.0.0.1","::1","169.254.169.254","10.0.0.1","::ffff:127.0.0.1"]) ("blocks private/rebinding evidence at every hop %s", ip => expect(inspectRedirectFixture([{url:"https://bit.ly/a",resolvedIps:["8.8.8.8"]},{url:"https://redirector.com/",resolvedIps:[ip]}]).blocked).toBe(true));
  it("identifies controlled cross-domain suspicious chain without claiming live expansion",()=>expect(inspectRedirectFixture([{url:"https://bit.ly/a",resolvedIps:["8.8.8.8"]},{url:"https://uaepass-login.com/otp",resolvedIps:["1.1.1.1"]}])).toMatchObject({scope:"controlled_fixture_only",blocked:false,crossDomain:true,suspicious:true}));
  it("rejects excessive redirects",()=>expect(inspectRedirectFixture(Array.from({length:7},()=>({url:"https://adcb.com",resolvedIps:["8.8.8.8"]}))).blocked).toBe(true));
  it("never accepts a hostname in place of a validated IP",()=>expect(inspectRedirectFixture([{url:"https://adcb.com",resolvedIps:["dead.beef"]}]).blocked).toBe(true));
});