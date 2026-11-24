import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { analyzeUrl } from "../src/lib/services/url/analyze";
import { inspectPageFixture } from "../src/lib/services/url/controlled-scan";
import { assessMessage } from "../src/lib/services/verification";
import { combinedRiskScore } from "../src/lib/services/hybrid-analysis";
import { developmentUrls, heldOutUrls } from "../src/test/fixtures/url-evaluation";
import { independentUrls } from "../src/test/fixtures/url-phase1b-independent";
import { parse } from "tldts";

const finalRun = process.argv.includes("--final");
const freeze = z.object({ frozenAt: z.string(), files: z.record(z.string()) }).parse(JSON.parse(readFileSync(`docs/evaluation/phase1b-resume-${finalRun ? "final-freeze" : "freeze"}.json`, "utf8")));
for (const [file, hash] of Object.entries(freeze.files)) if (createHash("sha256").update(readFileSync(file)).digest("hex") !== hash) throw new Error(`Frozen file changed: ${file}`);
const row = z.object({ id: z.string(), url: z.string(), label: z.enum(["legitimate", "suspicious"]), category: z.string() });
const publicData = z.object({ rows: z.array(row.extend({ group: z.string() })) }).parse(JSON.parse(readFileSync(`docs/evaluation/phase1b-resume-${finalRun ? "final-public" : "public"}.json`, "utf8")));
const controlled = z.object({ urls: z.array(row), pages: z.array(row.extend({ html: z.string() })), redirects: z.array(row.extend({ hops: z.array(z.object({ url: z.string(), resolvedIps: z.array(z.string()) })) })) }).parse(JSON.parse(readFileSync("docs/evaluation/phase1b-resume-controlled.json", "utf8")));
const oldPublic = z.object({ rows: z.array(row) }).parse(JSON.parse(readFileSync("docs/evaluation/phase1b-public.json", "utf8")));
const raw = (url: string) => url.replace(/^hxxps:/, "https:").replace(/^hxxp:/, "http:");
const canonical = (url: string) => { try { return new URL(raw(url)).href; } catch { return raw(url); } };
const group = (url: string) => { try { const host = new URL(raw(url)).hostname; return parse(host, { allowPrivateDomains: true }).domain ?? host; } catch { return raw(url); } };
const seen = [...developmentUrls, ...heldOutUrls, ...independentUrls, ...oldPublic.rows];
if (finalRun) seen.push(...z.object({ rows: z.array(row) }).parse(JSON.parse(readFileSync("docs/evaluation/phase1b-resume-public.json", "utf8"))).rows);
const seenDomains = new Set(seen.map(r => group(r.url)));
const oldUrls = new Set(seen.map(r => canonical(r.url)));
if (publicData.rows.length !== 1000 || publicData.rows.some(r => seenDomains.has(group(r.url))) || new Set(publicData.rows.map(r => group(r.url))).size !== 1000) throw new Error("External holdout domain leakage");
const allControlled = [...controlled.urls, ...controlled.pages, ...controlled.redirects];
if (allControlled.some(r => oldUrls.has(canonical(r.url))) || new Set(allControlled.map(r => canonical(r.url))).size !== allControlled.length) throw new Error("Controlled URL overlap");

function evaluate(rows: readonly z.infer<typeof row>[], score: (r: z.infer<typeof row>) => number) {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  const errors = [];
  for (const r of rows) {
    const value = score(r), positive = value >= 50, expected = r.label === "suspicious";
    if (expected) positive ? tp++ : fn++; else positive ? fp++ : tn++;
    if (positive !== expected) errors.push({ id: r.id, category: r.category, url: raw(r.url).replace(/^https:/, "hxxps:").replace(/^http:/, "hxxp:"), expected: r.label, score: value });
  }
  const div = (a: number, b: number) => b ? a / b : 0;
  const precision = div(tp, tp + fp), recall = div(tp, tp + fn);
  return { size: rows.length, tp, tn, fp, fn, precision: tp + fp ? precision : null, recall, accuracy: div(tp + tn, rows.length), f1: div(2 * precision * recall, precision + recall), falsePositiveRate: div(fp, fp + tn), errors };
}
const urlScore = (r: z.infer<typeof row>) => analyzeUrl(raw(r.url)).riskScore;
const fallback = (r: z.infer<typeof row>) => combinedRiskScore(assessMessage({ channel: "website", sender: "", url: raw(r.url), body: "" }, { organizations: [], blocklist: [] }), { status: "unavailable", reason: "service" });
const pageScores = new Map(controlled.pages.map(r => [r.id, inspectPageFixture(r.url, r.html).suspicious ? 65 : 0]));
// Supplied redirect chains are OFFLINE evidence, never observations of a live destination.
const redirectScores = new Map(controlled.redirects.map(r => [r.id, Math.max(...r.hops.map(h => analyzeUrl(h.url).riskScore))]));
const results = {
  frozenAt: freeze.frozenAt, evaluatedAt: new Date().toISOString(),
  methodology: finalRun ? "Fresh final 1000-row external holdout after correcting a preserved demo regression (short brand substring); exclude every prior external domain. One final prediction pass, no target visits or final-set tuning. The 80 reviewer cases are NOW SEEN development evidence, not a second independent controlled benchmark. All first-pass artifacts retained. Model not invoked." : "New 1000-row external domain-disjoint holdout and 80 independently reviewer-labeled controlled cases. No target URL visited; all failures retained. Static HTML and supplied chains measured separately, never pooled with real-world URL accuracy. No final-set tuning. Model not invoked in this evaluation.",
  public: evaluate(publicData.rows, urlScore), hybridFallbackPublic: evaluate(publicData.rows, fallback),
  controlledUrls: evaluate(controlled.urls, urlScore), hybridFallbackControlled: evaluate(controlled.urls, fallback),
  offlinePages: evaluate(controlled.pages, r => pageScores.get(r.id) ?? 0), offlineRedirects: evaluate(controlled.redirects, r => redirectScores.get(r.id) ?? 0),
  seenOriginal: evaluate(heldOutUrls.map(r => ({ ...r, category: "seen" })), urlScore),
  seenReviewer: evaluate(independentUrls.filter(r => !new Set([...developmentUrls, ...heldOutUrls].map(r => canonical(r.url))).has(canonical(r.url))), urlScore),
  categories: Object.fromEntries([...new Set(controlled.urls.map(r => r.category))].map(category => [category, evaluate(controlled.urls.filter(r => r.category === category), urlScore)])),
  publicCategories: Object.fromEntries([...new Set(publicData.rows.map(r => r.category))].map(category => [category, evaluate(publicData.rows.filter(r => r.category === category), urlScore)])),
};
writeFileSync(`docs/evaluation/phase1b-resume-${finalRun ? "final-results" : "results"}.json`, JSON.stringify(results, null, 2) + "\n");
for (const key of ["public", "hybridFallbackPublic", "controlledUrls", "hybridFallbackControlled", "offlinePages", "offlineRedirects", "seenOriginal", "seenReviewer"] as const) { const { errors, ...metrics } = results[key]; console.log(key, JSON.stringify(metrics), "errors", errors.length); }