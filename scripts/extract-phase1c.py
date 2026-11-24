"""Extract only public URL/label; never retain the source's page-derived features."""
import csv
import hashlib
import json
import sys
from pathlib import Path
source = Path(sys.argv[1])
if hashlib.sha256(source.read_bytes()).hexdigest() != 'a236549cd369cd80bd478ff8e1779cbf44c58d5c3f79f7a51a1adbed7d06d1c6':
    raise SystemExit('Unexpected UCI source hash; stop instead of silently changing evaluation data')
with source.open(encoding='utf-8-sig', newline='') as f:
    rows = [dict(url=r['URL'], label=int(r['label'])) for r in csv.DictReader(f)]
Path('/tmp/phase1c-source.json').write_text(json.dumps(rows))
print('Extracted only URL and historical label:', len(rows))