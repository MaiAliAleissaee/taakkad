import { describe, it, expect, vi } from "vitest";
import { lookupRdap } from "@/lib/services/url/rdap.server";
import { uncheckedRedirects } from "@/lib/services/url/intelligence";
const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/rdap+json" } });
const data = { objectClassName:"domain", ldhName:"adcb.com", events:[{eventAction:"registration",eventDate:"2026-11-01T00:00:00Z"}], entities:[{roles:["registrar"],vcardArray:["vcard",[["fn",{},"text","Example Registrar"]]]}],status:["active"] };
describe("bounded live RDAP boundary", () => {
  it("uses a fixed provider, domain-only path and derives age from a real-shaped record", async()=>{
    const request=vi.fn<typeof fetch>().mockResolvedValue(json(data));
    const r=await lookupRdap("adcb.com",request,Date.parse("2026-11-24T00:00:00Z"));
    expect(r).toMatchObject({status:"available",ageDays:23,registrar:"Example Registrar",registeredAt:"2026-11-01T00:00:00.000Z"});
    expect(request).toHaveBeenCalledWith("https://rdap.verisign.com/com/v1/domain/adcb.com",expect.objectContaining({redirect:"manual",credentials:"omit",referrerPolicy:"no-referrer"}));
  });
  it.each(["localhost", "127.0.0.1", "169.254.169.254", "adcb.com/secret", "adcb.com@127.0.0.1", "site.example", "child.adcb.com"])("never requests invalid or reserved %s",async domain=>{const request=vi.fn<typeof fetch>(); expect(await lookupRdap(domain,request)).toMatchObject({status:"unavailable",reason:"blocked"});expect(request).not.toHaveBeenCalled();});
  it("returns unsupported for UAE suffix without inventing age",async()=>{const request=vi.fn<typeof fetch>();expect(await lookupRdap("uaepass.ae",request)).toEqual({status:"unavailable",reason:"unsupported"});expect(request).not.toHaveBeenCalled();});
  it("never follows a redirect to metadata or arbitrary destinations",async()=>{const request=vi.fn<typeof fetch>().mockResolvedValue(new Response(null,{status:302,headers:{Location:"http://169.254.169.254/latest/meta-data/"}}));expect(await lookupRdap("adcb.com",request)).toMatchObject({status:"unavailable"});expect(request).toHaveBeenCalledTimes(1);});
  it.each([[429,"limited"],[404,"not_found"]] as const)("handles HTTP %s",async(code,reason)=>{expect(await lookupRdap("adcb.com",vi.fn<typeof fetch>().mockResolvedValue(new Response(null,{status:code})))).toEqual({status:"unavailable",reason});});
  it("does not fabricate missing/redacted registration or registrar",async()=>{expect(await lookupRdap("adcb.com",vi.fn<typeof fetch>().mockResolvedValue(json({objectClassName:"domain",ldhName:"adcb.com"})))).toMatchObject({status:"available",ageDays:null,registeredAt:null,registrar:null});});
  it("rejects a mismatched record and oversized stream",async()=>{
    expect(await lookupRdap("adcb.com",vi.fn<typeof fetch>().mockResolvedValue(json({...data,ldhName:"other.com"})))).toMatchObject({status:"unavailable"});
    expect(await lookupRdap("adcb.com",vi.fn<typeof fetch>().mockResolvedValue(json({padding:"x".repeat(140000)})))).toMatchObject({status:"unavailable"});
  });
  it("times out and returns unavailable",async()=>{
    vi.useFakeTimers(); const request=vi.fn<typeof fetch>().mockImplementation(async(_input,init)=>new Promise((_resolve,reject)=>{init?.signal?.addEventListener("abort",()=>reject(new Error("timeout")));}));
    const result=lookupRdap("adcb.com",request);await vi.advanceTimersByTimeAsync(5000);expect(await result).toEqual({status:"unavailable",reason:"timeout"});vi.useRealTimers();
  });
  it("does not claim any redirect hops were checked",()=>expect(uncheckedRedirects).toEqual({status:"unverified",reason:"safe_expansion_unavailable",checkedHops:0}));
});
