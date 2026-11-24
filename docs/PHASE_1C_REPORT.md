# Phase 1C — credit-efficient supervised URL detection

Date: 24 November 2026. Scope: lightweight URL-only ML, not Phase 2. Existing authentication, staff credentials, permissions, database, integrations, stored records and visual design remain unchanged.

## Diagnosis and bounded model selection

Phase 1B's 0/500 phishing recall was not an inference-service failure: it had no supervised URL model. Its conservative rules required configured UAE-brand, syntax or sensitive-action evidence. Unknown historical phishing domains often lacked those signals; no generic domain absence/HTTPS/registration observation was converted into fraud. The new baseline confirms the gap on **different** final examples: 2/2000 detected (0.10% recall), not an apples-to-apples replay of the old 1000 rows.

The first supervised experiment achieved 99.775% on a fresh 4000-domain historical test, but was **rejected**: changing known legitimate URLs to HTTP falsely flagged 100%; removing `www` falsely flagged 99.25%. All training/validation legitimate examples were HTTPS, and the dataset's hostname/URL formatting carried collection artifacts. HTTPS-only test accuracy was still 99.68%, demonstrating that filtering by scheme alone would not solve the shortcut. Neither that model nor its headline score is the shipped result.

One bounded correction was made: generate both HTTP/HTTPS and www/non-www variants **for both labels**, in training and validation only. These are synthetic formatting-invariance training assumptions, not independently observed redirects or live site labels. All **24000 domains** from the rejected experiment were excluded before creating an entirely new experiment. No second correction followed its final test. First experiment files, results, source code and artifact are retained in `docs/evaluation/phase1c-rejected/`; rejected freeze paths refer to their original pre-archive locations.

Three compact models were compared, twice only (original and one bias-corrected experiment): standardized logistic regression; decision tree depth 5/minimum leaf 40; gradient boosting with 40 trees, depth 3, minimum leaf 30, learning rate 0.1. Training is local Python/scikit-learn **1.9.1**; there are no paid services or AI Gateway calls in this phase. Final selection maximizes validation F1 among thresholds with FPR <=5%, preferring feasible candidates; threshold grid 0.1..0.95 in increments of 0.025. No test threshold selection, final-set retraining or test-label adjustment occurred.

### Corrected augmented-validation results

16000 validation variants from 4000 independent domains; variants are correlated and **not** 16000 independent examples.

| Model | Threshold | Precision | Recall | F1 | Accuracy | FPR |
|---|---:|---:|---:|---:|---:|---:|
| Logistic regression | 0.55 | 93.96% | 57.60% | 71.42% | 76.95% | 3.70% |
| Decision tree | 0.50 | 94.19% | 58.00% | 71.79% | 77.21% | 3.58% |
| **Selected gradient boosting** | **0.575** | **94.03%** | **59.09%** | **72.57%** | **77.67%** | **3.75%** |

## Source, features and leakage safeguards

- Public source: [PhiUSIIL / UCI 967](https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset), Prasad & Chandra (2024), [paper](https://doi.org/10.1016/j.cose.2023.103545), CC BY 4.0.
- Original CSV: 235795 rows, SHA256 `a236549cd369cd80bd478ff8e1779cbf44c58d5c3f79f7a51a1adbed7d06d1c6`. Only original URL/label are extracted. Source 0=phishing, 1=legitimate; supervised target is inverted to 1=phishing. No page-derived columns, source indices, domain identities or reputational labels enter features.
- **36 URL-only numeric features:** bounded URL/host/path/query/fragment lengths, counts/ratios of digits and punctuation, labels/segments/parameters, scheme, IP/userinfo/port/IDN indicators, subdomain/registrable-label/suffix lengths, character entropy, longest tokens and generic sensitive-token count. Existing `tldts` handles public/private suffix grouping; existing Punycode fix remains untouched.
- Deterministic seed `taakkad-phase1c-2026-11-24-v2-format-invariance`. Choose one lexicographically smallest valid URL per registrable domain before label-balanced hash ranking. Domain-level grouping prevents same-domain leakage; private suffix tenants group separately. No prediction-based sampling.
- Corrected experiment: **16000 training domains / 4000 validation domains / 4000 fresh final-test domains**, half each label in every original split. 64000 training variants and 16000 validation variants; **final external test uses original URL strings only**.
- Exclude all original fixtures, previous Phase 1B external samples, reviewer controls and all rejected Phase 1C domains. Eight malformed/over-limit candidate rows were excluded by the predefined URL parser before selection, not after errors were seen. Evaluation files retain defanged URLs; no listed website was visited.
- `phase1c-data.json` fixes all split rows, groups, labels, features, seed/source hash and exclusions. Model stores the data hash; `phase1c-freeze.json` fixes engine/data hashes before final inference. All 4000 final predictions and all errors are retained in `phase1c-results.json`. No test predictions were consulted during model/threshold selection.

## Actual fresh final-test results

Positive means possible phishing warning, not verified criminal conduct. These are historical, balanced, **same-source** URL-only results, not prospective UAE accuracy or a full semantic-AI benchmark.

| Engine | N | TP | TN | FP | FN | Precision | Recall | F1 | Accuracy | FPR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Existing rules, new final URLs | 4000 | 2 | 2000 | 0 | 1998 | 100% | 0.10% | 0.20% | 50.05% | 0% |
| **Corrected local ML** | **4000** | **1182** | **1914** | **86** | **818** | **93.22%** | **59.10%** | **72.34%** | **77.40%** | **4.30%** |
| **Actual combined local pipeline** | **4000** | **1182** | **1914** | **86** | **818** | **93.22%** | **59.10%** | **72.34%** | **77.40%** | **4.30%** |

Combined means the actual `assessMessage` registry/rule/ML assessment followed by existing `combinedRiskScore` with explicit AI-unavailable outcome and no registry/blocklist matches. It is **not** 4000 paid semantic-model calls. The two baseline detections were already ML-positive, so combining did not add positives on this set. Formula remains a bounded maximum, never lowering existing evidence.

HTTPS-only subgroup (2829 original examples): TP/TN/FP/FN 775/1914/86/54; precision 90.01%, recall 93.49%, F1 91.72%, accuracy 95.05%, FPR 4.30%. By subtraction, HTTP phishing recall is only 407/1171 = **34.76%**. This nonuniform performance is a substantial remaining limitation, not omitted from the headline.

Final legitimate-format stress probes (2000 known legitimate URLs each, label-preserving **synthetic** perturbations, not a new independent set): HTTP variants FP=82/FPR **4.10%**, non-www variants FP=82/FPR **4.10%**. This removes the first model's catastrophic formatting shortcut, but does not prove real HTTP/non-www safety. No post-test tuning was done.

## Actual app integration and safeguards

- Offline training exports a **23223-byte JSON artifact** with 40 small trees; production does not import Python, scikit-learn, datasets or native libraries. `ml.ts` executes bounded pure JavaScript tree traversal and sigmoid in the existing browser/SSR-compatible pipeline. Inference is actual learned-model computation, not replayed examples or rules masquerading as ML.
- Invalid/over-limit, unsupported scheme and private/local/reserved/special-use hosts abstain. No URL, text or result is sent to the classifier's training source or any new service. No storage, shared cache, cookies, accounts or network requests are added by ML.
- A threshold-positive learned prediction raises **ordinal risk to at least 65** and adds a bilingual, explicitly uncalibrated statistical warning. Low model outputs add zero and cannot lower existing technical/blocklist/semantic risk. The raw model score is not presented as a calibrated fraud probability.
- ML alone does **not** change registry state, grant channel verification, assert confirmed evidence, alter roles or change offender/case attribution. Existing deterministic strong evidence can still set suspicious state. Simulated organizations remain simulated, never trusted by ML. Layout, colors and interactions are unchanged; only result labels clarify the new local model.
- Existing opt-in semantic AI, privacy/redaction, quotas, domain-only metadata, separate operator scanner, reporting, alerts and staff authorization remain intact. This phase made **zero paid inference calls** and no data/credential/permission changes. Phase 1B scanning tasks were not repeated.

## Testing, security and publication

Targeted checks: 62 tests on original integration, URL detection and first export; six revised-model tests passed before final evaluation. Final suite ran **once: 277 tests across 24 files passed** (including eight ML tests). These cover sklearn/JavaScript parity, 36 finite features, abstention, no verification promotion, no lowering technical evidence, no classifier network requests, artifact-data hash binding and disjoint/excluded domains. Latest development harness build **OK**; no manual repeated builds.

Real browser flows passed in English at 1091x754 and Arabic at 390x844: an original validation URL produced the learned warning and ordinal 65, remained Unverified Channel, made no target-site request, kept AI/metadata unchecked, did not persist the input and cleared the result on reload. Both signed-out staff routes redirected to `/auth`, no browser exceptions or horizontal overflow. Screenshots inspected; no owner/password sign-in or restricted-record mutation performed. Evidence is retained in `docs/evaluation/phase1c-verification.json`. Existing sticky navigation appears across long element screenshots; no redesign was made.

**Publication WITHHELD — security condition not met.** Quick database/public-surface check completed 09:05:22 UTC with no critical/warning findings and one existing informational public-organization-projection finding left untouched. However, the independent production-dependency check found existing high and moderate advisories below. No attempt to publish was made; Phase 1C is verified in the preview only, not the published application. No paid inference, schema, account, dependency, credential or setting changed. This is not a fresh deep code audit or security certification; connector-specific analysis was unavailable because no connector was configured.

| Installed dependency | Severity | Advisory scope / reported fixed version |
|---|---|---|
| source-map-js 1.2.1 via Tailwind tooling | High | Indexed source-map offsets can cause event-loop denial of service; 1.2.2 |
| js-yaml 4.3.0 via framework/tooling | High | Quadratic `!!omap` CPU and empty-merge CPU exhaustion; 4.3.2 covers both reported fixes |
| Zod 3.25.76 | High | Oversized constrained collections can exhaust memory; scanner reports 4.6.6 |
| Seroval 1.6.8 via TanStack packages | Moderate | Typed-array constructor code injection and RegExp-source script injection; 1.6.11 covers both |

These advisories were already present in the unchanged lockfile; this phase adds no runtime dependency. Actual exploitation/reachability was not established or dismissed. Zod's reported fix crosses a major version, and framework transitive upgrades need compatibility work beyond the scoped URL-model change. Per the requested stop condition, no blind upgrades, finding suppression or extra regression cycles were attempted. Available next step: a separately scoped dependency-remediation change, followed by fresh regression/security checks, then publication. No repository visibility or deployment setting was changed.

## Limits and reproducibility

- **818 misses and 86 false positives remain.** Model quality is improved versus conservative URL rules on the new same-source split, but is far from maximum/production accuracy. Never use it to automatically block users, certify websites or establish crimes.
- Historical source labels were not live-revalidated; balancing differs from real phishing prevalence. High precision at 50% prevalence will not transfer automatically to ordinary browsing. Registry/URL/string features cannot establish page behavior, compromise, cloaking or genuine organization ownership.
- www/scheme augmentation is an explicit weak-supervision assumption. Actual www/non-www hosts and HTTP/HTTPS sites can differ. Source/path biases remain; no independent different-source or prospective UAE benchmark was available in this scoped experiment. No confidence calibration, semantic-model benchmark or throughput/load certification is claimed.
- Staff owner-password login and legacy OTP remain prior unverified capabilities; no accounts were created or reset. Unsupported Phase 1B public scanning and live cloaking prerequisites remain unchanged.

Reproduce offline using original source and pinned `scikit-learn==1.9.1` (no project production dependency):

```sh
curl -L https://archive.ics.uci.edu/static/public/967/data.csv -o /tmp/phase1b-public.csv
python3 scripts/extract-phase1c.py /tmp/phase1b-public.csv
bun scripts/prepare-phase1c.ts
python3 scripts/train-phase1c.py
bunx vitest run src/test/url-ml.test.ts
bun scripts/evaluate-phase1c.ts
```

The evaluator deliberately refuses to overwrite retained final results. For an independent replay, use a disposable source copy and remove its generated `phase1c-results.json` only there. The preserved rejected data must remain available for v2 exclusions; do not delete or relabel original evidence. Production inference needs only the shared feature code/model artifact, not these offline tools or the raw source CSV. Full updated regression is run once; routine model development uses targeted tests.

## Changed files and delivery

Application: `src/lib/services/url/ml-features.ts`, `ml.ts`, `ml-model.json`, `url/AGENTS.md`, `src/lib/services/verification.ts`, `src/components/trust/message-checker.tsx`, `url-findings.tsx`.

Offline/tests: `scripts/extract-phase1c.py`, `prepare-phase1c.ts`, `train-phase1c.py`, `evaluate-phase1c.ts`, `src/test/url-ml.test.ts`; `docs/evaluation/phase1c-{data,training,parity,freeze,results}.json` and preserved `phase1c-rejected/*`.

Documentation: this report, README, architecture, AI implementation report, test report and roadmap. Exact commit ID is supplied in the final delivery because a commit cannot include its own resulting hash. Local branch is `main`; GitHub `master` synchronization is not assumed or changed. Publish only after the one final regression run, build evidence and security check pass.