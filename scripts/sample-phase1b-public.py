"""Offline, prediction-independent PhiUSIIL sample. Run from project root with CSV path.
No dataset URL is visited. UCI 967, Prasad & Chandra (2024), CC BY 4.0.
"""
import csv
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile

source = pathlib.Path(sys.argv[1])
seed = "taakkad-phase1b-final-2026-11-24"
with source.open(encoding="utf-8-sig", newline="") as stream:
    rows = [(r["URL"], r["label"]) for r in csv.DictReader(stream)]
with tempfile.TemporaryDirectory() as tmp:
    names = pathlib.Path(tmp) / "urls.json"
    names.write_text(json.dumps([r[0] for r in rows]))
    code = '''import { parse } from "tldts";
import { developmentUrls, heldOutUrls } from "./src/test/fixtures/url-evaluation";
const urls = JSON.parse(await Bun.file(process.argv[1]).text());
const domain = u => { try {return parse(new URL(u).hostname,{allowPrivateDomains:true}).domain ?? new URL(u).hostname} catch {return u} };
console.log(JSON.stringify({domains:urls.map(domain),exclude:[...developmentUrls,...heldOutUrls].map(r=>domain(r.url))}));'''
    mapping = json.loads(subprocess.check_output(["bun", "-e", code, str(names)], text=True))
excluded = set(mapping["exclude"])
groups = {}
for (url, label), domain in zip(rows, mapping["domains"]):
    if domain in excluded:
        continue  # Predefined development-domain exclusion, never based on prediction.
    digest = hashlib.sha256((seed + "|" + url).encode()).hexdigest()
    key = (domain, label)
    if key not in groups or digest < groups[key][0]:
        groups[key] = (digest, url, label, domain)
selected = []
for label in ["0", "1"]:
    selected.extend(sorted((r for r in groups.values() if r[2] == label))[:500])
selected.sort()
assert len(selected) == 1000 and len({r[1] for r in selected}) == 1000
result = {
    "source": "https://archive.ics.uci.edu/static/public/967/data.csv",
    "dataset": "PhiUSIIL Phishing URL (Website), UCI 967 (2024)",
    "creators": "Arvind Prasad and Shalini Chandra",
    "license": "CC BY 4.0",
    "citation": "https://doi.org/10.1016/j.cose.2023.103545",
    "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "sourceRows": len(rows), "seed": seed,
    "method": "One lowest seeded SHA-256 URL per registrable-domain/source-label group; take lowest 500 of each source label. Exclude original development/seen domains before selection; no predictions, page features, or title labels used. Label 1=legitimate, 0=phishing. Historical source labels are not revalidated.",
    "rows": [{"id": f"public-{i+1:04}", "url": url.replace("https://", "hxxps://", 1).replace("http://", "hxxp://", 1), "label": "legitimate" if label == "1" else "suspicious", "category": "public-legitimate" if label == "1" else "public-phishing", "group": domain} for i, (_, url, label, domain) in enumerate(selected)]
}
destination = pathlib.Path("docs/evaluation/phase1b-public.json")
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print("Saved 1,000 defanged rows; no listed URLs visited.")