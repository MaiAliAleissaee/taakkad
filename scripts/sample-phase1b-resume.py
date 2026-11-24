"""New prediction-independent external holdout, excluding every prior domain.
Only URL and source label are read; no suspicious website is visited.
"""
import csv
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile

source = pathlib.Path(sys.argv[1])
final = "--final" in sys.argv
seed = "taakkad-phase1b-resume-independent-2026-11-24-" + ("final-v2" if final else "v1")
with source.open(encoding="utf-8-sig", newline="") as stream:
    rows = [(r["URL"], r["label"]) for r in csv.DictReader(stream)]
with tempfile.TemporaryDirectory() as tmp:
    names = pathlib.Path(tmp) / "urls.json"
    names.write_text(json.dumps([r[0] for r in rows]))
    code = '''import {parse} from "tldts";
import {developmentUrls,heldOutUrls} from "./src/test/fixtures/url-evaluation";
import {independentUrls} from "./src/test/fixtures/url-phase1b-independent";
const prior=JSON.parse(await Bun.file("docs/evaluation/phase1b-public.json").text()).rows;
const extra=process.argv[2]==="final"?JSON.parse(await Bun.file("docs/evaluation/phase1b-resume-public.json").text()).rows:[];
const urls=JSON.parse(await Bun.file(process.argv[1]).text());
const domain=u=>{try{const h=new URL(u.replace(/^hxxps:/,"https:").replace(/^hxxp:/,"http:")).hostname;return parse(h,{allowPrivateDomains:true}).domain??h}catch{return u}};
console.log(JSON.stringify({domains:urls.map(domain),exclude:[...developmentUrls,...heldOutUrls,...independentUrls,...prior,...extra].map(r=>domain(r.url))}));'''
    mapping = json.loads(subprocess.check_output(["bun", "-e", code, str(names), "final" if final else "first"], text=True))
excluded = set(mapping["exclude"])
groups = {}
for (url, label), domain in zip(rows, mapping["domains"]):
    if domain in excluded:
        continue
    digest = hashlib.sha256((seed + "|" + url).encode()).hexdigest()
    # One source row per domain across both labels, before balanced selection.
    if domain not in groups or digest < groups[domain][0]:
        groups[domain] = (digest, url, label, domain)
selected = []
for label in ["0", "1"]:
    selected.extend(sorted(r for r in groups.values() if r[2] == label)[:500])
selected.sort()
assert len(selected) == 1000 and len({r[3] for r in selected}) == 1000
result = {"source": "https://archive.ics.uci.edu/static/public/967/data.csv", "dataset": "PhiUSIIL UCI 967 (2024)", "license": "CC BY 4.0", "citation": "https://doi.org/10.1016/j.cose.2023.103545", "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(), "sourceRows": len(rows), "seed": seed, "method": "New 1000-row domain-disjoint sample; exclude all original/reviewer/previous-public domains, select one lowest seeded SHA256 row per domain before balanced source-label selection; no predictions or derived features used. Historical labels not revalidated.", "rows": [{"id": f"resume-public-{i+1:04}", "url": url.replace("https://", "hxxps://", 1).replace("http://", "hxxp://", 1), "label": "legitimate" if label == "1" else "suspicious", "category": "public-legitimate" if label == "1" else "public-phishing", "group": domain} for i, (_, url, label, domain) in enumerate(selected)]}
pathlib.Path("docs/evaluation/phase1b-resume-" + ("final-public" if final else "public") + ".json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print("Saved 1,000 new externally labeled domain-disjoint rows; no listed URLs visited.")