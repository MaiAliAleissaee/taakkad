import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { analyzeUrl } from "../src/lib/services/url/analyze";
import { assessMessage } from "../src/lib/services/verification";
import { combinedRiskScore } from "../src/lib/services/hybrid-analysis";
import { evaluateUrls } from "../src/lib/services/url/evaluation";
import { developmentUrls, heldOutUrls } from "../src/test/fixtures/url-evaluation";
import { independentUrls, uncertaintyControls } from "../src/test/fixtures/url-phase1b-independent";
import { z } from "zod";

const frozen = z.object({ frozenAt: z.string(), files: z.record(z.string(), z.string()) }).passthrough().parse(JSON.parse(readFileSync("docs/evaluation/phase1b-engine-freeze.json","utf8")));
for(const [file, hash] of Object.entries(frozen.files)) if(createHash("sha256").update(readFileSync(file)).digest("hex") !== hash) throw new Error(`Engine changed after freeze: ${file}`);
const schema = z.object({ rows: z.array(z.object({ id:z.string(),url:z.string(),label:z.enum(["legitimate","suspicious"]),category:z.string(),group:z.string() })) }).passthrough();
const dataset = schema.parse(JSON.parse(readFileSync("docs/evaluation/phase1b-public.json","utf8")));
const publicRows = dataset.rows.map(r=>({...r,url:r.url.replace(/^hxxps:/,"https:").replace(/^hxxp:/,"http:")}));
const canonical = (url:string) => { try { return new URL(url).href; } catch { return url.trim(); } };
const old = new Set([...developmentUrls,...heldOutUrls].map(r=>canonical(r.url)));
// Preserve reviewer duplicates, but classify them as seen before any prediction.
const seenReviewerRows = independentUrls.filter(r=>old.has(canonical(r.url)));
const finalSynthetic = independentUrls.filter(r=>!old.has(canonical(r.url)));
const all = [...publicRows,...finalSynthetic];
const current = all.map(r=>canonical(r.url));
if (current.length !== new Set(current).size || current.some(url=>old.has(url))) throw new Error("Evaluation duplicate/development leakage");

function fallbackScore(url:string) { return combinedRiskScore(assessMessage({channel:"website",sender:"",url,body:""},{organizations:[],blocklist:[]}), {status:"unavailable",reason:"service"}); }
function evaluate(rows: typeof all, score: (url:string)=>number) {
  let tp=0,tn=0,fp=0,fn=0;
  const errors=[];
  for(const r of rows){const value=score(r.url); const p=value>=50; const expected=r.label==="suspicious"; if(expected){p?tp++:fn++;}else{p?fp++:tn++;}if(p!==expected)errors.push({id:r.id,url:r.url.replace(/^https:/,"hxxps:").replace(/^http:/,"hxxp:"),category:r.category,expected:r.label,score:value});}
  const div=(a:number,b:number)=>b?a/b:0;const precision=div(tp,tp+fp),recall=div(tp,tp+fn);
  return {size:rows.length,tp,tn,fp,fn,precision,recall,f1:div(2*precision*recall,precision+recall),falsePositiveRate:div(fp,fp+tn),accuracy:div(tp+tn,rows.length),errors};
}
const output = {
  frozenAt:frozen.frozenAt, evaluatedAt:new Date().toISOString(),
  methodology:"Final prediction pass after engine freeze; historical public URL-only labels, 40 reviewer-controlled cases (one original-set overlap retained as seen, 39 final). No target URLs visited. Deterministic and hybrid-fallback engines scored separately. AI/full live hybrid metrics require a separate smaller functional run, not inferred from these counts. Public data never supplies page-feature columns to detection.",
  seenReviewerDuplicates:evaluate(seenReviewerRows,url=>analyzeUrl(url).riskScore),
  seenOriginalAfter:evaluateUrls(heldOutUrls),
  synthetic:evaluate(finalSynthetic,url=>analyzeUrl(url).riskScore),
  public:evaluate(publicRows,url=>analyzeUrl(url).riskScore),
  hybridFallbackPublic:evaluate(publicRows,fallbackScore),
  hybridFallbackSynthetic:evaluate(finalSynthetic,fallbackScore),
  categories:Object.fromEntries([...new Set(all.map(r=>r.category))].map(category=>[category,evaluate(all.filter(r=>r.category===category),url=>analyzeUrl(url).riskScore)])),
  uncertaintyControls:uncertaintyControls.map(url=>({url,classification:analyzeUrl(url).classification})),
};
writeFileSync("docs/evaluation/phase1b-results.json",JSON.stringify(output,null,2)+"\n");
for(const key of ["seenOriginalAfter","synthetic","public","hybridFallbackPublic","hybridFallbackSynthetic"] as const) {const {errors,...metrics}=output[key];console.log(key,JSON.stringify(metrics),"errors",errors.length);}