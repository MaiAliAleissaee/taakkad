# Final polish test report

## Phase 3 evidence and actionability — 24 November 2026

**22 targeted tests passed** (13 evidence rules, four server authorization/readback tests, five existing intelligence authorization tests). **One final regression: 321 tests / 29 files passed.** Rollback-only database contract test executed successfully: private grants/RLS, existing active Analyst fixture and Officer cross-denial, revoked-session rejection, six-file limit and mandatory approval; no rows/counters persisted. The server/readback unit tests are mocked, not signed-in end-to-end proof.

Actual isolated browser export checks passed using explicitly fictional, non-persisted fixtures: JSON 6,315 bytes with an attachment/hash manifest, downloaded PNG 68 bytes with valid signature, bilingual print report with SHA-256 and a 71,033-byte PDF. Desktop/mobile screenshots inspected; no mobile overflow or page errors. This verifies export helpers, not a genuine staff upload/readback or Safari/iOS save dialog. Original staff verification remains unavailable; no roles/passwords were changed or session checks bypassed. Production dependency audit `{}`; fresh quick security scan has only the existing informational public-registry finding. Deep code scan and publication status are reported separately. No ML retraining, AI calls, metadata calls or benchmark reruns.

## Phase 2 proactive intelligence — 24 November 2026

**20 targeted tests and one final regression of 302 tests / 27 files passed.** Rollback-only database checks passed for private grants, active-session/Analyst access, Officer/non-active-session denial and 30th allowed / 31st denied metadata commands. Free live helpers observed UAE PASS DNS/ASN without a fabricated `.ae` registration date; `example.com` RDAP supplied its reliable 1995 registration; a generated UAE PASS candidate had no observed DNS/RDAP record. Production dependency audit returned `{}`; backend scan had no critical/warnings and retained the existing informational public projection finding. The managed preview compiled successfully; ML artifact unchanged.

**Not verified:** genuine authenticated analyst UI save/readback and full bilingual/mobile analyst view. Temporary test sessions do not satisfy existing `auth.sessions` revocation checks; the dashboard failed before the new tab loaded. An isolated visual harness did not complete and is not counted as passed. No credential/role bypass or permanent test record occurred. Publication/live outcome is recorded in [the Phase 2 report](docs/PHASE_2_REPORT.md) and `docs/evaluation/phase2-evidence.json`; Phase 3 not started. Earlier “Phase 2 not started” entries below are historical.

## Phase 1C publication blocker resolved — 24 November 2026

Six scoped security package updates (source-map-js 1.2.2, js-yaml 4.3.2, Seroval 1.6.11, Zod 4.6.7, Nanoid 3.3.18, Vite 8.1.6); two offline `z.record` API signatures updated, no evaluation executed. **One final regression: 282 tests / 25 files passed**; targeted compatibility 56 + 38 tests passed. New tests cover the actual constrained-collection, YAML-merge, source-map and serializer security fixes. Both production audits passed (`bun audit --production`: `{}`, scanner: no vulnerabilities in 59 production packages). Quick backend scan retained one informational public-projection finding; no critical/warnings and no finding suppression. Unrelated development-only advisories remain documented.

Managed publication was requested after checks and **actual deployed inference verified** at https://taakkad.lovable.app/trust in English desktop and Arabic mobile: learned positive warning/65, benign control/20 with no ML warning, unchanged Unverified Channel, AI/metadata off, no target fetch or input persistence, reload clearing, no page exceptions/overflow and signed-out `/security` and `/officer` redirected to `/auth`. Screenshots inspected. Production serving/execution is verified; a standalone managed production-build log is unavailable, so no manual build result is claimed. The initial verification script had a quote syntax error before navigating; correcting the script yielded the successful live check, with no repeat paid call or benchmark.

The trained artifact is byte-identical to `7aa31e0`; no retraining, new accuracy measurements, credential/role/record changes or paid inference. Fix commit `b93dce2`; final documentation commit supplied in delivery. Earlier publication-withheld notes below are historical and superseded. Complete dependency paths/advisory IDs/remaining development tooling mitigations: `docs/PHASE_1C_SECURITY_REPORT.md` and `docs/evaluation/phase1c-security-live.json`. Phase 2 has not started.

## Phase 1C measured results — 24 November 2026

Fresh corrected final set: **4000 domains**, balanced historical PhiUSIIL labels, disjoint from 16000 training and 4000 validation domains and all previous experiments (including rejected Phase 1C). Final URLs are unaugmented; synthetic formatting variants exist only in training/validation. Selection: three local models, augmented-validation FPR <=5% then best F1, no final-set tuning. Frozen hashes and every prediction/error are in `docs/evaluation/phase1c-*`.

| Engine | TP/TN/FP/FN | Precision | Recall | F1 | Accuracy | FPR |
|---|---|---:|---:|---:|---:|---:|
| Existing URL rules on new test | 2/2000/0/1998 | 100% | 0.10% | 0.20% | 50.05% | 0% |
| Corrected local ML | 1182/1914/86/818 | 93.22% | 59.10% | 72.34% | 77.40% | 4.30% |
| Actual combined local/AI-unavailable engine | 1182/1914/86/818 | 93.22% | 59.10% | 72.34% | 77.40% | 4.30% |

Original rejected model: 99.775% original-test accuracy but **100% FPR** for legitimate HTTP variants and **99.25% FPR** for legitimate non-www variants. Do not pool or claim that biased result as delivered quality. Revised model: 4.10% FPR on each legitimate perturbation set; original HTTPS-only recall 93.49%, HTTP phishing recall 34.76%. These same-source and synthetic probes do not establish live UAE/production performance. All rejected evidence is retained; one bounded correction only, followed by an entirely new final test.

Targeted tests passed (62 first-phase checks; six revised export checks). **One final regression suite: 277 tests / 24 files PASS**, including eight ML tests; development harness build OK. Assertions verify sklearn/JavaScript parity, bounded finite features, reserved/unsafe abstention, no verification promotion, preserved technical evidence, no ML network requests, artifact-data hash and excluded/disjoint domains. Live English desktop and Arabic mobile checks passed: actual learned warning/65, unverified registry state, AI/metadata off, no target request/input persistence, reload clearing, signed-out staff denials and no browser errors/overflow. No paid AI call or Phase 1B scanner test was repeated.

**Publication NOT ATTEMPTED:** quick database scan has only one existing informational public-projection finding, but dependency check reports pre-existing high source-map-js/js-yaml/Zod and moderate Seroval advisories. Dependencies remain unchanged; publication is withheld until compatibility-tested remediation and fresh checks. Current Phase 1C published verification is therefore **NOT VERIFIED**. Full evidence, advisory fixes and diagnosis/reproduction/limits: `docs/PHASE_1C_REPORT.md`.

### Final post-publication evidence
**269 tests across 23 files passed**, plus **seven Python scanner safety tests**; harness build OK. After owner approval, actual published checks passed: new refund rule High/74, real MX/NS/ASN records, English AI High/74 and Arabic AI Low/20. Published Arabic 390×844 no overflow, reload cleared result, signed-out protected paths redirected to `/auth`, no runtime exceptions. Two preview + two published actual AI calls are not a benchmark. Pre-publication FAIL observations are historical, superseded by current deployment PASS; detection accuracy targets remain FAIL.

## Resumed Phase 1B verification — 24 November 2026

Current evidence supersedes earlier current-state claims; historical artifacts below remain unchanged. Final new external holdout: 1,000 distinct registrable-domain groups, 500 source-positive/500 source-negative, disjoint from original/reviewer/previous two external samples. Source PhiUSIIL UCI 967, Prasad & Chandra (2024), CC BY 4.0; only URL/label used, no sites visited. Final TP/TN/FP/FN **0/500/0/500**, accuracy **50%**, precision **undefined**, recall/F1 **0%**, FPR **0%**; baseline `21eb114` identical on the same sample. Targets fail. Every case/error is retained.

Independent first-pass reviewer cases: 60 URL examples **19/29/1/11**, 80% accuracy / 95% precision / 63.33% recall / 76% F1 / 3.33% FPR; 12 offline HTML examples **3/6/0/3**, 75% accuracy / 100% precision / 50% recall / 66.67% F1 / 0% FPR; eight supplied redirect chains **3/4/0/1**, 87.5% accuracy / 100% precision / 75% recall / 85.71% F1 / 0% FPR. No pooling with external evidence. Preserved-demo testing then found the new `du` substring alias misclassified fictional DunePay. The general short-alias compound rule was corrected, without changing the preserved test or data. Reviewer cases became **seen**; final replay URL counts **18/29/1/12**, 78.33% accuracy. First-pass datasets/results/freeze retained; second fresh external sample frozen before final predictions. No improvement inferred from reusing heldouts.

Scanner checks: actual `https://httpbin.org/redirect/2` → relative redirect → `/get`, three fresh validated/pinned TLSv1.3 connections; `example.org` successful TLSv1.3 and non-executing HTML analysis. `www.du.ae` HTTPS downgrade correctly blocked, not fabricated as resolved. Seven Python safety tests cover private/mapped/multicast IPs, fresh second-hop denial, authorized resolution, hop/loop limits, sensitive/unauthorized URL rejection, size/status/downgrade denial and literal-IP TLS/SNI pinning. App regression coverage includes form base/override exfiltration, malformed IDN, financial-return contexts, short-name boundary controls, MX/NS/CAA and evaluation leakage.

Actual preview: refund lure → High/74; `du.ae` → Low/20, actual MX/NS and ASN 15802/prefix `94.206.160.0/19`. English/Arabic screenshots inspected, 390×844 no horizontal overflow, reload clears private results, signed-out `/security` and `/officer` → `/auth`, no runtime exceptions. Two genuine AI calls: English credential threat Critical/90, Arabic information Low/20. No report, user, password, role, schema or existing record change. Metadata reservations and two AI reservations are ordinary existing usage.

Published application genuinely checked: `https://taakkad.lovable.app/trust` still returns Low/20 for the new refund lure and has no `chk-rdap`; **FAIL — current Phase 1B not deployed**. Owner publication approval requested; no publishing/settings change made. Read-only staff audit: HAM123 Officer+Public Visitor, HAM1234 Analyst+Public Visitor, both confirmed/password-configured with prior 23 November sign-ins. No owner password login or positive authenticated dashboard check in this turn; mappings and unit tests are not password evidence.

Full counts, categories/errors, reproduction, technical blockers and final automated totals appear in `docs/PHASE_1B_REPORT.md`. Full 500-case AI hybrid evaluation, arbitrary public scanner/shortener deployment, live JS/cloaking and `.ae` registration metadata remain incomplete. Phase 2 has not started.

## Phase 1B — 24 November 2026 (current evidence)

### Frozen-engine measurements
Baseline replay from `d58af97` reproduced the original 48-example result exactly. That dataset is **now seen**, not independent. The new final engine was frozen before predictions, including a pre-evaluation redirect-policy fixture correction; no rules, thresholds or labels were tuned after final results. Original `docs/url-evaluation-results.json` and fixture files remain unchanged.

| Set / engine | N | TP | TN | FP | FN | Precision | Recall | F1 | FPR | Accuracy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Old 48 / Phase 1 baseline | 48 | 21 | 23 | 1 | 3 | 95.45% | 87.50% | 91.30% | 4.17% | 91.67% |
| Old 48 / Phase 1B, **seen** | 48 | 24 | 24 | 0 | 0 | 100% | 100% | 100% | 0% | 100% |
| New controlled / Phase 1 baseline | 39 | 8 | 18 | 1 | 12 | 88.89% | 40% | 55.17% | 5.26% | 66.67% |
| New controlled / Phase 1B deterministic | 39 | 16 | 17 | 2 | 4 | 88.89% | 80% | 84.21% | 10.53% | 84.62% |
| External public / Phase 1 baseline | 1000 | 0 | 500 | 0 | 500 | N/A (no positives) | 0% | 0% | 0% | 50% |
| External public / Phase 1B deterministic | 1000 | 5 | 500 | 0 | 495 | 100% | 1% | 1.98% | 0% | 50.50% |
| External public / hybrid fallback | 1000 | 5 | 500 | 0 | 495 | 100% | 1% | 1.98% | 0% | 50.50% |
| New controlled / hybrid fallback | 39 | 16 | 17 | 2 | 4 | 88.89% | 80% | 84.21% | 10.53% | 84.62% |
| Actual AI+rules UI spot checks | 4 | 2 | 2 | 0 | 0 | 100% | 100% | 100% | 0% | 100% |

**Targets NOT achieved.** N=4 AI observations are functional evidence, not a general AI accuracy claim. All category confusion matrices and 495 external / six controlled errors are retained in `docs/evaluation/phase1b-results.json`. Source dataset is historical PhiUSIIL/UCI 967, Prasad & Chandra, CC BY 4.0, 235,795 rows; only original URL/label used, never derived page features. Fixed seeded/domain-grouped selection created 500 positive/500 negative rows, independent of predictions. One of 40 reviewer URLs overlapped the old dataset and was retained as seen before evaluation. Cases/labels were not edited to improve scores; invalid Punycode remains a scored miss. Historical labels, unverified illustrative legitimate paths and reviewer scenario labels are limitations, not real-time website verdicts.

### Causes and remaining failures
- Old false positive: bare editorial brand token treated as impersonation. Old misses: compound `support` not a sensitive suffix; credential-collection context unrecognized; IP + login observations individually below threshold. General rules now address these; all four old mistakes are resolved on the **seen** set.
- New false positives: the full-reference substring check can mistake `du.ae` for `u.ae`; `salik.gov.ae` is absent from the confirmed reference library but resembles Salik. The reviewer's latter legitimacy label is not independently live-certified. Both are retained, not relabeled or patched against final data.
- New misses: malformed Punycode; MOHRE refund/bank-context without a configured sensitive key; telecom rewards; airline refund context. Most external phishing URLs lack any configured UAE brand/syntax evidence; unknown domains can be malicious via page content or compromised sites, which URL strings alone do not reveal. Missing reference/age never becomes automatic fraud.

### Actual live checks and protections
- Preview English: compound service lure, legitimate brand archive, official-domain nested encoded lure, real UAE PASS hostname DNS/RDAP omission all exercised. Google DNS returned `213.42.56.87` and CNAME `selfcare.gslb.uaepass.ae`; RIPE returned ASN **204206**, prefix **213.42.56.0/24**. No hosting ownership or DNS pinning was inferred. Actual string-valued RIPE ASNs prompted a schema-contract fix and matching regression before final verification.
- Four real AI calls completed: two Low informational controls (English/Arabic), two Critical credential/payment threats (English/Arabic). No replay/new subscription/credential. Separate inference results are in `docs/evaluation/phase1b-live-hybrid.json`.
- Arabic/English result screenshots inspected, including DNS/ASN; mobile 390×844 no horizontal overflow. Reload removed private result. No page exceptions in successful public runs. A language-specific screenshot locator initially failed after inference; rerun corrected the locator and **did not repeat** AI calls.
- Controlled HTML parser never executes scripts; title/form mismatch, same-domain legitimate login, editorial mentions, variants as **partial not confirmed cloaking**, redirect hop/public-IP checks and oversized content tested. These are offline fixtures, not live expansion or cloaking detection.
- Published `https://taakkad.lovable.app/trust` was genuinely loaded and checked: compound lure remained **Unverified / Low / 20**, no `chk-rdap` option. **FAIL: Phase 1B is not published**, not a missing live site. No publication/settings change was made.
- Signed-out `/security` and `/officer` redirected to `/auth`. Read-only staff check found both confirmed, password-configured, and with recent prior sign-in timestamps; HAM123 Officer only, HAM1234 Analyst only (plus public visitor). No credentials/roles/users changed. Positive owner password login and authenticated dashboard walkthrough **NOT VERIFIED**; tests/mappings are not a substitute.

### Regression and blockers
Final automated count/status is recorded in `docs/PHASE_1B_REPORT.md`. Existing AI privacy/fallback, organization policies, authentication, role separation, reports, alerts and graph tests are included. New coverage checks nested/base64 URLs, every controlled-hop public IP, non-IP rejection, private DNS, provider redirects/size bounds, real-shaped string ASNs and dataset leakage. An early evaluation integrity assertion conflated all IP/no-PSL hosts as `null`; corrected it to the sampler's domain-or-host grouping without altering a single row/label or prediction.

Verified destination/shortener expansion and live cloaking remain unavailable: no established third-party DNS-pinned HTTP transport or approved isolated scanning environment. `.ae` registration/TLS remain unavailable; DoH/RIS metadata does work. 500 full model calls need an approved multi-day plan within the existing 200/day ceiling. Independent targets remain unmet; no Phase 2, production readiness or guaranteed 30/30 is claimed. Owner passwords, legacy OTP and separately authorized Supervisor publication remain prior blockers.

## Phase 1 URL detection accuracy — 24 November 2026
Current results below supersede historical counts retained later in this report.

### Automated and reproducible checks
- **211 tests across 19 files passed** (`bunx vitest run`); current harness **build OK**. New coverage: 41 URL detection/evaluation tests + 16 RDAP tests + eight combined-score tests. Existing registry, simulated approval, reporting, roles, AI redaction/grounding/fallback and investigation regressions passed.
- URL cases cover public/private suffixes (`co.uk`, `github.io`), exact domain boundaries, Punycode/homoglyphs, shorteners, userinfo, encoded authority, malformed/non-HTTP input and blocked IP/local/reserved destinations. Official sensitive paths and unknown domains alone are not suspicious verdicts.
- RDAP tests cover bounded schema/dates, fixed hosts, no credentials/referrer, rejected redirects, unsupported suffixes, timeout/service failures, malformed records and oversized bodies.
- Reproduce with `bun scripts/evaluate-urls.ts`. Committed output: `docs/url-evaluation-results.json`; labelled/provenance-annotated inputs: `src/test/fixtures/url-evaluation.ts`. Positive = local deterministic URL classification `suspicious` (score ≥ 50); caution is negative. **AI, registry and RDAP are excluded from benchmark accuracy.**

| Synthetic split | N | TP | TN | FP | FN | Precision | Recall | F1 | False-positive rate | Accuracy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Development | 16 | 8 | 8 | 0 | 0 | 100% | 100% | 100% | 0% | 100% |
| Held-out | 48 | 21 | 23 | 1 | 3 | 95.45% | 87.50% | 91.30% | 4.17% | 91.67% |

Each split has balanced labels and disjoint URLs. Development is a small sanity check, not production evidence. Held-out mistakes were not used to tune thresholds. False positive: legitimate `tamm-archive.example/history` (held-24). Misses: suspicious `uaepasssupport.example/account` (held-28), `credential-collector.example/verify` (held-47), `192.0.2.10/login` (held-48). No fixture destination was fetched. Errors remain disclosed rather than patched against the same held-out data.

### Actual preview and live-service observations
- Desktop: `adcb.com.attacker.example` displayed suspicious indicators and correct registrable domain; official `www.adcb.com/login/payment` did not become suspicious simply for path keywords. Official references remained distinct from registry approval.
- Arabic mobile 390×844: UAE PASS lure displayed RTL warnings, risk and unverified redirects with no horizontal overflow. English/Arabic evidence screenshots were inspected.
- Actual UI RDAP for `adcb.com`: registration **2003-06-25**, age **8,552 days** on check date, registrar/statuses. The bounded helper returned live `.net` (`verisign.net`) and `.org` (`ietf.org`) records as well. Unsupported `.ae` displayed unavailable honestly. Age alone did not raise risk.
- Rate limiting exercised through the UI with an isolated documentation-address localhost header: first **20** domain lookups allowed, **21st** unavailable. Unsupported `.ae` avoided repeated external calls. Global 1,000/hour protection uses the existing atomic command; a 1,001-request global load test was **not performed**.
- Two real opt-in Gateway calls: English synthetic UAE PASS credential lure → **Critical**; Arabic benign bank contact information → **Low**. Actual bilingual findings/grounded indicators were inspected; these are not part of accuracy metrics.
- Reload cleared the visit-private result. Overview, Organization Portal, Alerts and sign-in loaded with Taakkad metadata; signed-out `/security` and `/officer` redirected to `/auth`. Successful public URL/AI runs reported no browser errors.
- Early import/syntax and language-selector failures were corrected before passing runs. The initial rate script's globally applied test header interfered with external calls; scoping it to localhost fixed the test without application changes.

### Limitations and preserved boundaries
- Redirect expansion/final destination, scripts/page content, cloaking, DNS/hosting and email authentication remain **unverified**. No general URL crawler exists. RDAP supports only `.com`, `.net`, `.org` and is not ownership/security verification.
- Compound service names, generic credential links and contextual IP lures remain known misses; a brand-archive fixture is a false positive. References and homoglyph rules are limited. An unlisted domain is not automatically malicious; low risk does not certify safety. Scores are ordinal, not calibrated probabilities.
- No independent real-world labels, confidence interval, historical improvement baseline, published-deployment walkthrough, broad cloaking claims or production certification are supplied. Reported accuracy describes this synthetic split only.
- Staff password sign-in and authenticated officer/analyst walkthroughs were **not repeated**; existing role/workflow regressions passed. Accounts, roles, auth, database schema, application records and UI colors/layout remain unchanged. Only ordinary rate reservations resulted from live lookup/AI checks.
- Owner credential checks, legacy OTP completion and independent Supervisor publication remain prior blockers; this phase does not remove them.

## Demo approval and tracking refinement — 22 November 2026
- **PASS:** 146 automated tests across 17 files; preview build OK. Shared validation accepts valid HTTP(S) websites and emails without requiring `.example`; unsafe schemes/embedded website credentials remain rejected.
- **PASS:** Two new clearly fictional submissions (Approval Validation 20261122 D/E, `.test`/`.example`) received five-digit references. HAM123 authorized officer review, approval confirmation, private audit readback, repeat approval and public registry appearance were exercised. Each application retains exactly one simulated public entry; neither has a trusted projection.
- **PASS:** An already-open public page refreshed the approved registry following tracking without a page reload. Name and all five channels appeared with Demo Approved / اعتماد تجريبي, a disclaimer and searchable channel values; rejected/corrections-required validation applications remained excluded.
- **PASS:** Tracking showed pending, under-review, approved, rejected and corrections-required states with the submitted reference and real status-update timestamps. Arabic/English approved messages, registry search/badges, approved registry link and mobile Arabic at 390×844 passed; no browser exceptions or horizontal overflow in the successful runs.
- **PASS:** Anonymous application reads returned no rows; raw tracking mappings and direct tracking RPC access were denied. Public tracking returned only reference/status/date, never private notes/documents. Demo organizations/channels remain pending internally and excluded from trusted checks; existing channel/AI/privacy regressions passed without inference.
- **Preserved:** Staff accounts/passwords/roles, AI, all existing records, legacy workflows, original colors and unrelated pages. Two additional clearly named fictional validation submissions were retained; no records deleted.
- **Test limitations:** The shared local-preview visitor budget was already exhausted by earlier tests; the limiter correctly denied it. Continued browser tests used isolated documentation-address headers for separate visitor budgets without changing/resetting the limiter. An initial rapid review hit a revision conflict; officer action buttons now wait until review-start finishes, and the fresh registration-to-approval rerun passed.
- **NOT VERIFIED:** Owner username/password login (authorized minted HAM123 session used instead), production publication and multi-connection concurrent load. No AI inference used.

## Organization demo simplification — 22 November 2026
- **PASS:** 142 automated tests across 17 files; current harness build OK.
- **PASS:** Arabic and English registration has exactly six fields; three live fictional submissions received distinct random five-digit numbers, pending status and five pending channels with the website host extracted automatically.
- **PASS:** Status-only tracking read back Pending Review, Under Review, Approved (Simulated), Rejected and Corrections Required. No private notes, documents, edit button, OTP or secret is exposed by this new flow.
- **PASS:** Authenticated HAM123 officer session opened real submitted records, recorded review start and approved/rejected/requested corrections. Approval and rejection confirmation dialogs were exercised; private notes and decision audit read back. This used an approved minted session, NOT username/password verification.
- **PASS:** Approved fictional submission appeared in the separate simulated registry; rejected/correction submissions did not. Its internal organization/channel statuses remain pending, and no genuinely trusted public projection was created.
- **PASS:** Signed-out direct application reads returned no rows; tracking mappings, direct database review and protected review server calls were denied. Signed-out staff pages redirected to login; Officer -> Security access was denied.
- **PASS:** Existing custom tracking limiter blocked repeated requests by the 21st request. Limit is 20/address/hour with an additional shared 1000/hour ceiling. This is custom protection, not a standard platform limiter; five-digit numbers are not secrets and disclose general status only.
- **PASS:** Mobile Arabic form at 390×844 showed all six fields without page overflow. Arabic officer summary, status and English confirmation/registry were inspected. Browser checks reported no page exceptions.
- **Preserved:** Existing application records, legacy capability logic, trusted registry/check semantics, AI, Security Dashboard, staff credentials/role separation and colors. Three clearly named fictional validation submissions were retained rather than deleting any records.
- **NOT VERIFIED:** Owner password sign-in, simultaneous multi-connection registration load and production publication. No AI inference was consumed. Initial browser scripts encountered selector/stale-preview assertions; corrected reruns passed the same checks.

**Date:** 22 November 2026. **Scope:** existing preview and Cloud; no owner passwords, usernames or roles changed. This is hackathon validation, not production certification.

## PASS
- **134 automated tests / 16 files**: original 127 plus seven presentation/data-integrity checks. All passed after updating the new Arabic-default assertion and resolving an optional-field type mismatch.
- Current harness reports **build OK**. All content routes have individual titles/descriptions, Open Graph type and Twitter card metadata; no placeholder project titles.
- Permanent numbering: private grants, `1/2026` onward, removal/reordering stability, different-ID collision prevention and 2027 year handling passed rolled-back database integration checks. Transaction serialization is implemented; a multi-connection load test was not performed.
- Atomic AI budget boundaries: fifth request accepted, sixth denied, rolling expiry accepted, daily request 200 accepted, 201 denied; private counter access and type-aware IP matching verified in rolled-back integration tests. No inference consumed by these tests.
- **Four actual model calls** through the UI: Arabic banking impersonation, English delivery pressure, benign/unknown-sender meeting announcement and explicit fictional shared IP. Real bilingual explanations and genuine extracted values displayed. Benign example displayed Low without claiming safety/authentication. Explicit IP extraction correlated with restricted existing reports and was explicitly reported/read back in the dashboard.
- Existing redaction, grounding, hybrid risk and unavailable-service fallback regression tests passed. No private submitted real-world content or credentials used.
- Actual password setup and username/password login were exercised **only for a disposable tester**, not HAM123/HAM1234. A minted session alone could not meet the live-session policy; tests were rerun using actual tester password authentication without weakening that policy.
- Analyst tester: four primary sections, report numbers, saved note, graph/shared-IP click, documentation-address explanation, ten domain groups and Analytics. Analyst -> Officer denied before private content; return button worked.
- Officer tester: Organization Portal login -> Officer Dashboard; public fictional registration/receipt, invalid tracking secret denial, authorized document download, correction request note, independent organization approval and separate single-channel approval. Public Trust Portal verified the approved channel and did not verify its pending sibling.
- Officer -> Security denied; return button worked. Officer logout returned to staff login and subsequent protected navigation redirected there. Both tester roles used public services.
- Public pages navigated without browser exceptions; approved bank sender check passed. Arabic/English analysis and direction switching worked. Responsive widths checked at 1111x754 and 390x844. Confirmed narrow-header and organization-card overflow were corrected; final checks recorded separately below.
- Final Cloud inventory: ten reports, ten domain samples, ten applications and ten managed bulletins; three previously published warnings and seven added drafts. Additions are fictional and idempotent; no new warning was published.
- Isolated validation application/projection/credentials and tester workspace/alias/grants/roles removed; disposable Auth user is cleaned up by the test-session lifecycle. Original records and HAM123/HAM1234 preserved.

## NOT VERIFIED / limitations
- **HAM123 and HAM1234 actual password login:** owner-only passwords were not available, requested or reset. Their current role mappings were read and confirmed; tester success is not owner-account login verification.
- **Applicant inbox delivery and full email-code retrieval/editing:** no received code available. Public registration and invalid-secret protection passed; complete positive OTP flow is not claimed.
- **New alert draft -> independent Supervisor approval -> publication in this pass:** existing policy/tests audited, but no authorized real Supervisor account was supplied and no owner role was added. Existing published samples remain viewable. Neither demo username can publish by design.
- Live service outage fallback was not induced; fallback was verified with the existing mocked-service regression test.
- No published deployment, external monitoring, geolocation, takedown, real institutional certification, throughput measurement or production security audit performed.
- Complete private AI explanations are not retained in reports; staff see shared content/indicators and a deterministic report assessment, not an archived model response.

## Resolved during checks
Inherited anonymous/authenticated table grants were detected on the new numbering ledger. RLS had no public policy, but explicit grants were revoked and private-access assertions then passed. An early rate-test fixture used identical timestamps; it was corrected to distinct real-request timestamps and the existing limits passed. A logout selector used an incorrect label; successful Officer logout was subsequently verified with the actual label.

## Final responsive and cleanup checks
Final public-page run: Overview, Organizations, Trust, Alerts and staff login had no horizontal overflow at 390x844; desktop checks at 1111x754 also passed. Both protected URLs redirected signed-out visitors to login. Ten example cards and the approved bank sender result remained available; no browser exceptions were reported. Final regression run again passed all 134 tests. The two newly added seeded application channels have submission timestamps for normal officer review.

## Readiness
**Hackathon preview: conditional PASS.** Owner credential checks, complete OTP tracking and Supervisor publication demonstration remain unverified. **Production readiness: NOT CLAIMED.** Source and documentation are suitable for repository handoff; publishing requires the owner's separate action.
