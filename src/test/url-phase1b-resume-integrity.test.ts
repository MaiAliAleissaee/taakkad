import { describe, expect, it } from "vitest";
import { parse } from "tldts";
import original from "../../docs/evaluation/phase1b-public.json";
import first from "../../docs/evaluation/phase1b-resume-public.json";
import final from "../../docs/evaluation/phase1b-resume-final-public.json";
import controlled from "../../docs/evaluation/phase1b-resume-controlled.json";
import { developmentUrls, heldOutUrls } from "./fixtures/url-evaluation";
import { independentUrls } from "./fixtures/url-phase1b-independent";
const raw = (s: string) => s.replace(/^hxxps:/, "https:").replace(/^hxxp:/, "http:");
const canonical = (s: string) => { try { return new URL(raw(s)).href; } catch { return s; } };
const group = (s: string) => { try { const host = new URL(raw(s)).hostname; return parse(host, { allowPrivateDomains: true }).domain ?? host; } catch { return raw(s); } };

describe("Resumed Phase 1B independent evaluation integrity", () => {
  it("retains a final 1000-case externally labeled balanced sample", () => {
    expect(final.rows).toHaveLength(1000);
    expect(final.rows.filter(r => r.label === "suspicious")).toHaveLength(500);
    expect(final.rows.filter(r => r.label === "legitimate")).toHaveLength(500);
  });
  it("excludes every prior external/development/reviewer domain before predictions", () => {
    const previous = new Set([...original.rows, ...first.rows, ...developmentUrls, ...heldOutUrls, ...independentUrls].map(r => group(r.url)));
    expect(final.rows.filter(r => previous.has(group(r.url)))).toHaveLength(0);
    expect(new Set(final.rows.map(r => group(r.url))).size).toBe(1000);
  });
  it("retains all 80 independent controlled scenarios and every intended label", () => {
    expect(controlled.urls).toHaveLength(60);
    expect(controlled.pages).toHaveLength(12);
    expect(controlled.redirects).toHaveLength(8);
    expect(controlled.urls.filter(r => r.label === "legitimate")).toHaveLength(30);
    expect(controlled.pages.filter(r => r.label === "suspicious")).toHaveLength(6);
    expect(controlled.redirects.filter(r => r.label === "suspicious")).toHaveLength(4);
  });
  it("has no controlled URL duplicate or original evaluation overlap", () => {
    const all = [...controlled.urls, ...controlled.pages, ...controlled.redirects];
    const seen = new Set([...developmentUrls, ...heldOutUrls, ...independentUrls].map(r => canonical(r.url)));
    expect(new Set(all.map(r => canonical(r.url))).size).toBe(80);
    expect(all.filter(r => seen.has(canonical(r.url)))).toHaveLength(0);
  });
  it("keeps external fraud URLs defanged and original evidence intact", () => {
    expect(final.rows.every(r => /^hxxps?:/.test(r.url))).toBe(true);
    expect(first.rows).toHaveLength(1000);
    expect(original.rows).toHaveLength(1000);
    expect(final.sourceSha256).toBe("a236549cd369cd80bd478ff8e1779cbf44c58d5c3f79f7a51a1adbed7d06d1c6");
  });
});