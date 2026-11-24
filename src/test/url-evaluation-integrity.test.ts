import { describe, expect, it } from "vitest";
import { parse } from "tldts";
import publicData from "../../docs/evaluation/phase1b-public.json";
import { independentUrls } from "./fixtures/url-phase1b-independent";
import { developmentUrls, heldOutUrls } from "./fixtures/url-evaluation";
const raw = (s: string) => s.replace(/^hxxps:/,"https:").replace(/^hxxp:/,"http:");
const canonical = (s: string) => { try { return new URL(raw(s)).href; } catch { return s; } };
describe("Frozen evaluation integrity", () => {
  it("retains 1,000 externally labeled examples, balanced without prediction-based removal", () => { expect(publicData.rows).toHaveLength(1000);expect(publicData.rows.filter(r=>r.label==="suspicious")).toHaveLength(500);expect(publicData.rows.filter(r=>r.label==="legitimate")).toHaveLength(500); });
  it("has no public duplicate URL or original development registrable-domain overlap", () => {
    const group = (url: string) => { const host = new URL(raw(url)).hostname; return parse(host,{allowPrivateDomains:true}).domain ?? host; };
    const old = new Set([...developmentUrls,...heldOutUrls].map(r=>group(r.url)));
    expect(new Set(publicData.rows.map(r=>canonical(r.url))).size).toBe(1000);
    expect(publicData.rows.filter(r=>old.has(group(r.url)))).toHaveLength(0);
  });
  it("retains all 40 reviewer cases and separately identifies the one seen overlap",()=>{ const old = new Set([...developmentUrls,...heldOutUrls].map(r=>canonical(r.url)));expect(independentUrls).toHaveLength(40);expect(independentUrls.filter(r=>old.has(canonical(r.url))).map(r=>r.id)).toEqual(["independent-1"]); });
  it("preserves the original dataset counts and never bundles public fraud URLs in the application",()=>{expect(developmentUrls).toHaveLength(16);expect(heldOutUrls).toHaveLength(48);expect(publicData.rows.every(r=>/^hxxps?:/.test(r.url))).toBe(true);});
});