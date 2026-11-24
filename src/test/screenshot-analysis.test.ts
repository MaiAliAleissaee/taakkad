import { describe,it,expect } from "vitest";
import { validateRaster,validateDimensions,MAX_IMAGE_BYTES,extractedIndicators,combineScreenshot,assessScreenshot,extractionIncomplete } from "@/lib/screenshot/model";
import { privateCheckCandidates } from "@/lib/services/private-check";
import { assessMessage } from "@/lib/services/verification";
import { createSeedState } from "./fixtures/security-seed";

const manual = {channel:"sms" as const,sender:"",body:"",url:""};
const review = {text:"",qr:"",sender:"",url:""};
const png = (w:number,h:number) => {const b=new Uint8Array(33);b.set([137,80,78,71,13,10,26,10]);b.set([73,72,68,82],12);const v=new DataView(b.buffer);v.setUint32(16,w);v.setUint32(20,h);return b;};
describe("local screenshot validation",()=>{
  it("accepts genuine PNG header/dimensions",()=>expect(validateRaster(png(900,700),"image/png")).toEqual({width:900,height:700}));
  it("rejects disguised SVG and mismatching declared types",()=>{expect(()=>validateRaster(new TextEncoder().encode('<svg onload="fetch(1)"/>'),"image/png")).toThrow("type");expect(()=>validateRaster(png(900,700),"image/jpeg")).toThrow("type");});
  it("rejects unsupported formats",()=>expect(()=>validateRaster(png(900,700),"image/gif")).toThrow("type"));
  it("rejects empty or oversized files",()=>{expect(()=>validateRaster(new Uint8Array(),"image/png")).toThrow("size");expect(()=>validateRaster(new Uint8Array(MAX_IMAGE_BYTES+1),"image/png")).toThrow("size");});
  it("bounds dimensions before browser decoding",()=>{expect(()=>validateRaster(png(9000,100),"image/png")).toThrow("dimensions");expect(()=>validateDimensions(4001,4000)).toThrow("dimensions");expect(()=>validateDimensions(0,100)).toThrow("dimensions");expect(()=>validateDimensions(4000,4000)).not.toThrow();});
  it("recognizes JPEG dimensions",()=>{const b=new Uint8Array([255,216,255,192,0,8,8,2,88,3,32,0,255,217]);expect(validateRaster(b,"image/jpeg")).toEqual({width:800,height:600});});
  it("recognizes WebP dimensions",()=>{const b=new Uint8Array(30);b.set(new TextEncoder().encode("RIFF"));b.set(new TextEncoder().encode("WEBPVP8X"),8);b[24]=99;b[27]=49;expect(validateRaster(b,"image/webp")).toEqual({width:100,height:50});});
});
describe("screenshot review and extraction",()=>{
  it("extracts Arabic/English/mixed contacts without OTP/ID inference",()=>{const e=extractedIndicators("UAE PASS طرش الكود الحين https://uaepass-demo.example ٠٥٠٠٠٠٠٠٠٠ help@demo.example OTP 123456");expect(e.urls).toEqual(["https://uaepass-demo.example"]);expect(e.phones).toEqual(["+971500000000"]);expect(e.emails).toEqual(["help@demo.example"]);expect(e.organizations[0]?.en).toBe("UAE PASS / identity");});
  it("supports screenshot only without manual fields",()=>{const e=combineScreenshot(manual,{...review,text:"Delivery fee: https://parcel-demo.example"});expect(e.input?.sender).toBe("");expect(e.input?.url).toBe("https://parcel-demo.example");expect(e.input?.body).toContain("Delivery fee");});
  it("decodes QR content as data, including unsafe schemes without executing them",()=>{expect(combineScreenshot(manual,{...review,qr:"https://qr-demo.example"}).input?.url).toBe("https://qr-demo.example");expect(extractedIndicators("javascript:alert(1)").urls).toEqual([]);expect(combineScreenshot(manual,{...review,qr:"javascript:alert(1)"}).input?.body).toBe("javascript:alert(1)");});
  it("deduplicates equivalent URLs and phone formats",()=>{const e=combineScreenshot({...manual,sender:"0500000000",url:"https://demo.example/"},{...review,sender:"+971500000000",url:"https://demo.example",text:"https://demo.example"});expect(e.conflicts).toEqual([]);expect(e.urls).toHaveLength(1);expect(new Set(privateCheckCandidates(e.input ?? manual)).size).toBe(privateCheckCandidates(e.input ?? manual).length);});
  it("keeps conflicting link/sender values for checking",()=>{const e=combineScreenshot({...manual,sender:"0500000000",url:"https://first.example"},{...review,sender:"0520000000",url:"https://second.example",text:"https://second.example"});expect(e.conflicts).toEqual(["url","sender"]);expect(e.urls).toEqual(["https://first.example","https://second.example"]);});
  it("flags empty, low-confidence, cropped and partial text",()=>{const data={text:"",confidence:90,qr:[],uncertainWords:[],incomplete:false};expect(extractionIncomplete(data)).toBe(true);expect(extractionIncomplete({...data,text:"hello",confidence:20})).toBe(true);expect(extractionIncomplete({...data,text:"https://"})).toBe(true);expect(extractionIncomplete({...data,text:"hello",incomplete:true})).toBe(true);expect(extractionIncomplete({...data,text:"message",confidence:90})).toBe(false);});
  it("flags bounded/truncated combined text",()=>expect(combineScreenshot({...manual,body:"x".repeat(9000)},{...review,text:"y".repeat(2000)}).truncated).toBe(true));
  it("never assumes mentioned contact values are the message sender",()=>expect(combineScreenshot(manual,{...review,text:"Contact help@demo.example +971500000000"}).input?.sender).toBe(""));
});
describe("existing detection policy integration",()=>{
  const demoOrganizations = createSeedState().organizations;
  const ctx={organizations:demoOrganizations,blocklist:[]};
  it("unreadable extraction never becomes verified",()=>{const input={...manual,body:"unreadable"};expect(assessScreenshot(input,[],ctx,true,false).state).toBe("unverified");});
  it("unreadable evidence cannot turn an approved sender into screenshot verification",()=>{const org=demoOrganizations.find(o=>o.channels.some(c=>c.type==="sms"));const sender=org?.channels.find(c=>c.type==="sms")?.value;expect(sender).toBeTruthy();if(!sender)throw new Error("missing fixture sender");const input={...manual,sender};expect(assessScreenshot(input,[],ctx,true,false).state).toBe("unverified");});
  it("preserves rules/ML outcomes for readable manual-equivalent input",()=>{const input={...manual,body:"طرشلي الكود الحين UAE PASS",url:"https://uaepass-login.example"};expect(assessScreenshot(input,[input.url],ctx,false,false)).toEqual(assessMessage(input,ctx));});
  it("checks every extracted URL, not only the benign first URL",()=>{const input={...manual,url:"https://benign-demo.example",body:"links"};const e=assessScreenshot(input,[input.url,"http://192.168.1.1/pay"],ctx,false,false);expect(e.state).toBe("suspicious");expect(e.reasons.some(r=>r.code==="url_technical")).toBe(true);});
  it("retains suspicious evidence even when OCR is uncertain",()=>expect(assessScreenshot({...manual,url:"http://192.168.1.1/pay",body:""},[],ctx,true,true).state).toBe("suspicious"));
});