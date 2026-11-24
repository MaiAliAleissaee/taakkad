import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { classifyUrlMl } from "../src/lib/services/url/ml";
import { assessMessage } from "../src/lib/services/verification";
import { combinedRiskScore } from "../src/lib/services/hybrid-analysis";
import { analyzeUrl } from "../src/lib/services/url/analyze";
import { urlDomainGroup } from "../src/lib/services/url/ml-features";

const path="docs/evaluation/phase1c-results.json";
if (Bun.file(path).size > 0) throw new Error("Final result exists: preserve it, do not reevaluate or tune against it");
const hash=(f:string)=>createHash('sha256').update(readFileSync(f)).digest('hex');
const files=['src/lib/services/url/ml-features.ts','src/lib/services/url/ml-model.json','src/lib/services/url/ml.ts','src/lib/services/verification.ts','src/lib/services/hybrid-analysis.ts','src/lib/services/url/analyze.ts','scripts/evaluate-phase1c.ts','docs/evaluation/phase1c-data.json'];
const freeze={frozenAt:new Date().toISOString(),files:Object.fromEntries(files.map(f=>[f,hash(f)]))};
writeFileSync('docs/evaluation/phase1c-freeze.json',JSON.stringify(freeze,null,2)+'\n');
interface Row {group:string;url:string;label:number;features:number[]}
const data:{splits:Record<string,Row[]>}=JSON.parse(readFileSync('docs/evaluation/phase1c-data.json','utf8'));
const rows=data.splits['test']; if (!rows || rows.length!==4000) throw new Error('Final test count');
const seen=new Set([...(data.splits['train']??[]),...(data.splits['validation']??[])].map(r=>r.group));
if(rows.some(r=>seen.has(r.group))||new Set(rows.map(r=>r.group)).size!==4000) throw new Error('Domain leakage');
const raw=(s:string)=>s.replace(/^hxxps:/,'https:').replace(/^hxxp:/,'http:');
function evaluate(rs:Row[], predict:(u:string)=>boolean) {
 let tp=0,tn=0,fp=0,fn=0;const errors=[];
 for (const r of rs) {const positive=predict(raw(r.url)), expected=r.label===0; if(expected) positive?tp++:fn++;else positive?fp++:tn++;if(positive!==expected) errors.push({url:r.url,group:r.group,label:r.label,positive});}
 const div=(a:number,b:number)=>b?a/b:0;
 return {n:rs.length,tp,tn,fp,fn,precision:tp+fp?div(tp,tp+fp):null,recall:div(tp,tp+fn),f1:div(2*tp,2*tp+fp+fn),accuracy:div(tp+tn,rs.length),falsePositiveRate:div(fp,fp+tn),errors};
}
const ml=(u:string)=>classifyUrlMl(u)?.flagged??false;
const baseline=(u:string)=>analyzeUrl(u).riskScore>=50;
const combined=(u:string)=>combinedRiskScore(assessMessage({channel:'website',sender:'',url:u,body:''},{organizations:[],blocklist:[]}),{status:'unavailable',reason:'service'})>=50;
const predictions=rows.map(r=>({url:r.url,group:r.group,label:r.label,ml:classifyUrlMl(raw(r.url)),combined:combined(raw(r.url))}));
const result={evaluatedAt:new Date().toISOString(),freeze,method:'One fresh 4000-domain historical test after validation selection. Combined engine=actual assessment + AI-unavailable maximum; no paid inference, registry, RDAP, or DNS used. Source-balanced, not deployment prevalence.',
 baseline:evaluate(rows,baseline),ml:evaluate(rows,ml),combined:evaluate(rows,combined),
 httpsOnly:{ml:evaluate(rows.filter(r=>r.features[22]===1),ml),combined:evaluate(rows.filter(r=>r.features[22]===1),combined)},
 stress:'Known legitimate HTTP and non-www variants of the final legitimate URLs: label-preserving synthetic perturbation, NOT a second independent holdout.',
 legitimateHttp:evaluate(rows.filter(r=>r.label===1).map(r=>({...r,url:r.url.replace(/^hxxps:/,'hxxp:')})),ml),
 legitimateNoWww:evaluate(rows.filter(r=>r.label===1).map(r=>({...r,url:r.url.replace('://www.', '://')})),ml),predictions};
// Sanity-check stored grouping and freeze integrity after the final pass.
if(rows.some(r=>urlDomainGroup(r.url)!==r.group)||files.some(f=>hash(f)!==freeze.files[f])) throw new Error('Freeze/group mismatch');
writeFileSync(path,JSON.stringify(result,null,2)+'\n');
for(const k of ['baseline','ml','combined','httpsOnly','legitimateHttp','legitimateNoWww'] as const) {const value=result[k];console.log(k,JSON.stringify(value, (key,v)=>key==='errors'?undefined:v));}