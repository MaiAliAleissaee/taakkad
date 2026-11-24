import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { classifyUrlMl } from "../lib/services/url/ml";
import { urlFeatures, urlFeatureNames, urlDomainGroup } from "../lib/services/url/ml-features";
import { assessMessage } from "../lib/services/verification";
import parity from "../../docs/evaluation/phase1c-parity.json";
import data from "../../docs/evaluation/phase1c-data.json";
import previous from "../../docs/evaluation/phase1b-resume-final-public.json";
import model from "../lib/services/url/ml-model.json";
const raw = (u: string) => u.replace(/^hxxps:/,"https:").replace(/^hxxp:/,"http:");
describe("Local supervised URL classifier", () => {
  it("matches exported sklearn validation predictions within numerical tolerance", () => {
    for (const r of parity) { const p = classifyUrlMl(raw(r.url)); expect(p).not.toBeNull(); expect(p?.score).toBeCloseTo(r.score, 6); }
  });
  it("extracts exactly 36 finite URL-only features", () => {
    const f=urlFeatures("https://www.example.com/login?q=x"); expect(f).toHaveLength(36); expect(f?.length).toBe(urlFeatureNames.length); expect(f?.every(Number.isFinite)).toBe(true);
  });
  it("rejects unsafe, reserved, unsupported and over-limit URLs", () => {
    for (const u of ["javascript:alert(1)","http://127.0.0.1/", "http://localhost/", "https://private.example/", "https://a.com/"+"a".repeat(2001)]) expect(classifyUrlMl(u)).toBeNull();
  });
  it("does not grant registry verification or claim confirmed evidence", () => {
    const r=parity[0]; if (!r) throw new Error("Missing validation fixture");
    const a=assessMessage({channel:"website",sender:"",url:raw(r.url),body:""},{organizations:[],blocklist:[]});
    expect(classifyUrlMl(raw(r.url))?.flagged).toBe(true); expect(a.riskScore).toBeGreaterThanOrEqual(65); expect(a.state).not.toBe("verified");
    expect(a.reasons.filter(r=>r.params['en']?.toString().includes("supervised")).every(r=>r.evidence===false)).toBe(true);
  });
  it("never lowers existing technical risk", () => {
    const a=assessMessage({channel:"website",sender:"",url:"https://adcb.com.attacker.example/login",body:""},{organizations:[],blocklist:[]}); expect(a.state).toBe("suspicious"); expect(a.riskScore).toBeGreaterThanOrEqual(60);
  });
  it("keeps training, validation and final test domains disjoint", () => {
    expect(data.splits.train).toHaveLength(16000); expect(data.splits.validation).toHaveLength(4000); expect(data.splits.test).toHaveLength(4000);
    const all=[...data.splits.train,...data.splits.validation,...data.splits.test]; expect(new Set(all.map(r=>r.group)).size).toBe(24000);
    const seen=new Set(previous.rows.map(r=>urlDomainGroup(r.url))); expect(all.filter(r=>seen.has(r.group))).toHaveLength(0);
  });
  it("excludes every rejected experiment domain and binds the artifact to frozen data", () => {
    const rejected: {splits:Record<string,{group:string}[]>}=JSON.parse(readFileSync('docs/evaluation/phase1c-rejected/phase1c-data.json','utf8'));
    const seen=new Set(Object.values(rejected.splits).flat().map(r=>r.group));
    const all=[...data.splits.train,...data.splits.validation,...data.splits.test]; expect(all.filter(r=>seen.has(r.group))).toHaveLength(0);
    expect(model.dataSha256).toBe(createHash('sha256').update(readFileSync('docs/evaluation/phase1c-data.json')).digest('hex'));
  });
  it("runs learned inference without any network request", () => {
    const network=vi.spyOn(globalThis,'fetch');
    try { const r=parity[0]; if(!r) throw new Error('Missing validation fixture'); expect(classifyUrlMl(raw(r.url))).not.toBeNull(); expect(network).not.toHaveBeenCalled(); }
    finally { network.mockRestore(); }
  });
});