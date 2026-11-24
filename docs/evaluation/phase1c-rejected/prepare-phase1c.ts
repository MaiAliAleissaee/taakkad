import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { urlFeatures, urlDomainGroup, urlFeatureNames } from "../src/lib/services/url/ml-features";
import { developmentUrls, heldOutUrls } from "../src/test/fixtures/url-evaluation";
import { independentUrls } from "../src/test/fixtures/url-phase1b-independent";

const rows: {url: string; label: number}[] = JSON.parse(readFileSync("/tmp/phase1c-source.json", "utf8"));
const excluded = new Set([...developmentUrls, ...heldOutUrls, ...independentUrls].map(r => urlDomainGroup(r.url)));
for (const file of ["phase1b-public", "phase1b-resume-public", "phase1b-resume-final-public"]) {
  const previous = JSON.parse(readFileSync(`docs/evaluation/${file}.json`, "utf8"));
  for (const r of previous.rows) excluded.add(urlDomainGroup(r.url));
}
const controls = JSON.parse(readFileSync("docs/evaluation/phase1b-resume-controlled.json", "utf8"));
for (const r of [...controls.urls, ...controls.pages, ...controls.redirects]) excluded.add(urlDomainGroup(r.url));
const seed = "taakkad-phase1c-2026-11-24-v1";
const groups = new Map<string, {url: string; label: number; group: string; hash: string; features: number[]}>();
let invalid = 0;
for (const r of rows) {
  const group = urlDomainGroup(r.url);
  if (excluded.has(group)) continue;
  const features = urlFeatures(r.url);
  if (!features) { invalid++; continue; }
  const hash = createHash("sha256").update(seed + "|" + group).digest("hex");
  // One row per registrable domain, selected without using predictions.
  const prior = groups.get(group);
  if (!prior || r.url < prior.url) groups.set(group, {...r, group, hash, features});
}
const splits: Record<string, typeof groups extends Map<string, infer V> ? V[] : never> = {train: [], validation: [], test: []};
for (const label of [0, 1]) {
  const available = [...groups.values()].filter(r => r.label === label).sort((a,b) => a.hash.localeCompare(b.hash));
  if (available.length < 12000) throw new Error("Insufficient independent domains");
  splits['test']?.push(...available.slice(0, 2000));
  splits['validation']?.push(...available.slice(2000, 4000));
  splits['train']?.push(...available.slice(4000, 12000));
}
const manifest = {seed, source: "PhiUSIIL UCI 967", sourceSha256: createHash("sha256").update(readFileSync("/tmp/phase1b-public.csv")).digest("hex"), features: urlFeatureNames, excludedDomains: excluded.size, invalidRowsExcluded: invalid,
  method: "Balanced domain-disjoint 16000/4000/4000 partitions, all prior evaluated domains excluded. Source label 0=phishing,1=legitimate inverted to supervised target 1=phishing. Test sealed before training; labels historically assigned, no websites visited.",
  splits: Object.fromEntries(Object.entries(splits).map(([key, rs]) => [key, rs.map(r => ({group:r.group, url:r.url.replace(/^https:/,'hxxps:').replace(/^http:/,'hxxp:'), label:r.label, features:r.features}))]))};
writeFileSync("docs/evaluation/phase1c-data.json", JSON.stringify(manifest) + "\n");
console.log(JSON.stringify({counts:Object.fromEntries(Object.entries(splits).map(([k,v])=>[k,v.length])),invalid,excluded:excluded.size}));