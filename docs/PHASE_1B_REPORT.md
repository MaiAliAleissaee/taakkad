# Taakkad — Phase 1B completion report

## Resumed Phase 1B final audit — 24 November 2026

**Overall PARTIAL. Detection-accuracy targets FAIL. Published updated engine FAIL/pending owner approval. Phase 2 NOT started.** This section supersedes current-state claims in the retained earlier report below. The Punycode named import and matching Vite entry remain preserved.

### Requirement audit and implemented changes

| Original requirement | Already implemented | Resumed outcome |
|---|---|---|
| Preserve workflows/security/data | Bilingual three portals, private checks, staff roles, original design | Preserved; no credentials/users/roles/schema/private records changed |
| Investigate errors/general URL rules | Compound/nested/base64/IP/context rules | Whole-DNS-label references, short-alias boundary guard, refund/reward context, invalid IDN fail-safe; no test URL allowlist |
| Safe redirects / shorteners | Detection + offline policy only | Real **operator-only IP-pinned CLI** with per-hop authorization; public visitor scanner still unavailable |
| Page impersonation / cloaking | Non-executing offline title/form fixtures | Base/button credential action checks and actual static-capture analysis; differential partial indicators only, no confirmed/live browser cloaking |
| `.ae`/DNS/hosting/TLS | Actual DoH A/AAAA/CNAME and RIPE; limited RDAP | Actual MX/NS/CAA added; operator TLS certificates verified; `.ae` registration unavailable, no hosting ownership claims |
| Official references | Sourced bank/government identity references | First-party `du.ae` source fetched and added; complete label/token boundaries, no generic `.gov.ae` allowlist |
| Hybrid | Real optional grounded/redacted AI + fallback | Preserved model/settings/quotas; separate fallback evaluation + two fresh real bilingual checks |
| Independent 500+ evaluation | Prior 1,000 historical + 39 controlled | Two new 1,000-row external samples plus 80 independent reviewer scenarios; final external set domain-disjoint from every prior set |
| Full regression/deployment | Earlier 251 tests and published old-engine failure | Full suite rerun; published old engine independently reconfirmed; publication approval pending |
| Documentation/report | Phase 1/1B artifacts | README, architecture, AI/test reports and this complete audit updated; original master note preserved |

### Exact measurements (positive = ordinal score ≥50, not fraud probability)

| Dataset / engine | N | TP | TN | FP | FN | Accuracy | Precision | Recall | F1 | FPR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Original Phase 1 baseline, now seen | 48 | 21 | 23 | 1 | 3 | 91.67% | 95.45% | 87.50% | 91.30% | 4.17% |
| Original final replay, now seen | 48 | 24 | 24 | 0 | 0 | 100% | 100% | 100% | 100% | 0% |
| Prior 39 controlled, earlier Phase 1B | 39 | 16 | 17 | 2 | 4 | 84.62% | 88.89% | 80% | 84.21% | 10.53% |
| Prior 39 final replay, now seen | 39 | 17 | 18 | 1 | 3 | 89.74% | 94.44% | 85% | 89.47% | 5.26% |
| New independent controlled URLs, baseline `21eb114` | 60 | 18 | 29 | 1 | 12 | 78.33% | 94.74% | 60% | 73.47% | 3.33% |
| New independent controlled URLs, first pass | 60 | 19 | 29 | 1 | 11 | 80% | 95% | 63.33% | 76% | 3.33% |
| Same controlled URLs, final replay **seen** | 60 | 18 | 29 | 1 | 12 | 78.33% | 94.74% | 60% | 73.47% | 3.33% |
| Independent offline HTML, first pass/final replay | 12 | 3 | 6 | 0 | 3 | 75% | 100% | 50% | 66.67% | 0% |
| Independent supplied chains, first pass/final replay | 8 | 3 | 4 | 0 | 1 | 87.50% | 100% | 75% | 85.71% | 0% |
| New external first pass, baseline/current | 1000 | 3 | 500 | 0 | 497 | 50.30% | 100% | 0.60% | 1.19% | 0% |
| **Fresh final external**, baseline/current | **1000** | **0** | **500** | **0** | **500** | **50%** | **Undefined** | **0%** | **0%** | **0%** |

Confusion ordering is TP/TN/FP/FN. Undefined precision means **zero predicted positives**, not perfect precision. Zero FPR combined with 500 misses is not success. Deterministic and explicitly AI-unavailable hybrid fallback were separately run and returned identical URL-only counts. Offline HTML/chain samples are separate controlled capabilities, never pooled into external or full-AI accuracy. Two fresh full-AI functional checks yielded **1/1/0/0**, N=2; not a benchmark or guarantee. Targets 98% accuracy/recall/F1, 99% precision and <1% FPR are **NOT achieved**.

### Dataset provenance, independence and retained failures

- Source: [PhiUSIIL UCI 967](https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset), Prasad & Chandra (2024), [DOI](https://doi.org/10.1016/j.cose.2023.103545), CC BY 4.0. Source SHA-256 `a236549cd369cd80bd478ff8e1779cbf44c58d5c3f79f7a51a1adbed7d06d1c6`, 235,795 rows. Only URL/source label supplied; derived features/title/content unavailable to engine. All listed URLs defanged, none visited.
- First sample: 1,000 new balanced source-labeled rows, one seeded lowest-hash row per domain, excluding all original/prior-reviewer/prior-public domains before selection. The final sample uses a different fixed seed and also excludes every first-sample domain; 1,000 additional distinct groups, 500 positive/500 negative. Historical source labels are not independently revalidated current website verdicts. This is a fresh split of the **same external corpus**, not a new research source or representative UAE deployment study.
- Independent reviewer `sub_pt91cv47` did not inspect detection code, predictions or old errors; supplied 60 URLs (30/30), 12 HTML (6/6), eight redirect chains (4/4). Diverse categories: UAE official banks/government/login/payment, Unicode, compound names, typos, nested/encoded URLs, userinfo/path/query lures, ordinary commerce/forum and editorial negatives. Labels describe intended controlled semantics. The reviewer calls `salik.gov.ae` official without independent certification; its proposed label remains unchanged and its false positive disclosed, not promoted into official references.
- First engine/data freeze preceded predictions. Subsequent full regression detected **new short-alias `du` compound matching misclassified existing fictional DunePay**. The preserved test and data were not altered. General fix requires sufficiently long compound aliases; small aliases use whole-token/context evidence. Because code changed, first artifacts remain and controlled cases are explicitly now **seen**. A second fresh domain-disjoint external sample was frozen before final predictions; no tuning followed its results.
- Final external 500 misses expose the generalization gap: unknown/compromised URL strings lack configured brand or syntax clues; unavailable webpage/context evidence cannot be invented. Controlled final failures include missing long human brand aliases, compound typos separated by extra tokens, incomplete redirect-key vocabulary and brand claims only in query/body; page misses include long bank/police/Unicode title aliases and incomplete card-field vocabulary. These are not tuned using final labels. Category matrices and **all failures** remain in `phase1b-resume-results.json` and `phase1b-resume-final-results.json`.

### Real integrations and safety status

**Redirect-chain / final destination: PASS for separately authorized operator CLI; NOT AVAILABLE in public app.** `scripts/scan-url.py` actually resolves DNS on every hop, rejects any non-public/mixed answer and pins the connection to a validated literal IP; checks actual peer equality, verifies TLS/SNI against the original hostname. HTTP(S)/standard ports only; explicit host allowlist every hop; sensitive userinfo/query/fragment URLs rejected; no proxies/cookies/referrer/credentials; five-second socket timeout, six responses, 128 KiB identity-only body cap, redirect loop/downgrade checks; POSIX 20-second process alarm includes DNS/TLS/slow reads. No scripts/forms executed. Scanner is an operator tool, not an app endpoint, isolated hosted integration, scheduled task or installed container.

**Actual live evidence:** `https://httpbin.org/redirect/2` → `/relative-redirect/1` → `/get`, statuses 302/302/200, three freshly validated/pinned connections, TLSv1.3; certificate dates `2026-11-05` → `2027-02-03`. `https://example.org/` returned 200, TLSv1.3, certificate dates `2026-09-26` → `2026-12-25`; non-executing static analysis found no title/form suspicion. `www.du.ae` returned HTTPS→HTTP and was correctly blocked. Only authorized benign/official sites were visited, never fraud dataset sites. Certificate metadata verifies a connection, not organization authenticity.

**Shorteners: PARTIAL.** The operator transport follows genuine HTTP redirect chains and can handle a shortener only when all hosts are explicitly authorized and no query/secret disclosure is involved. No live `bit.ly`/`tinyurl` destination was resolved or claimed. The public portal detects shorteners but still reports destination unverified. Privacy blocks forwarding raw visitor links without explicit permission; a deployed scanner must have independently enforced egress isolation, all-hop pinning and safe limits. Existing Worker `fetch` has no general third-party DNS-pinned connection control (`resolveOverride` zone restriction), so ordinary DoH then hostname fetch is not substituted.

**Page impersonation/cloaking: PARTIAL.** Non-executing parse5 checks credential forms, title/domain mismatch, HTML base and submit override actions; actual benign captured HTML analyzed. Two same-final-URL static captures may be compared for partial content/form differences, never confirmed cloaking. No remote JS, credential submission, browser fingerprint simulation, login bypass or live malicious-page scanning. No authorized isolated browser service/connector exists; current connection list empty. Alternatives: provision an owner-approved isolated browser/container scanner with explicit retention/URL-consent controls, or authorized private urlscan/Browser Run after credentials/bindings/egress requirements are approved. A static CLI is not a substitute for JS-rendered cloaking detection.

**`.ae` intelligence: actual DNS PASS; registration unavailable.** Fresh IANA RDAP bootstrap publication `2026-11-20T23:00:03Z` still has no `.ae` service; registration dates/registrars absent, not guessed from DNS/TLS. Actual `du.ae` Google DNS: A `94.206.168.161`, MX `2 du-ae.mail.protection.outlook.com.`, NS `dxbns1/2/3.duhosting.ae.`; no CAA answer invented. RIPE ASN **15802**, prefix **94.206.160.0/19**. DNSSEC not confirmed. App shows these real fields bilingually; sends only canonical hostname/domain under existing limiter. Sources: fixed Google DoH and RIPE; `.com/.net/.org` fixed-provider RDAP preserved. These are resolver/routing snapshots, not authoritative hosting ownership or safety. Future registry-approved WHOIS API or authenticated registrar access could supply `.ae` dates; no unauthenticated WHOIS scraping/credential was added.

**Hybrid/model:** OpenAI `openai/gpt-6.1-sol` through existing server-only Lovable Gateway Responses, 2,400-output-token cap unchanged. Prompt-injection/redaction/strict schema/grounding/atomic 5-per-10-minutes + 200/day untouched. Two actual preview inferences: English ADCB credential/OTP threat **Critical/90**, Arabic informational official government URL **Low/20**. No reports saved. Large full-hybrid evaluation is **NOT VERIFIED**; 500+ real calls require an approved multi-day credit/request plan, never budget bypass or inferred AI results.

### Regression, privacy, staff and published verification

- Final automated test totals and clean build are recorded in the delivery evidence section below. Existing private-check, registry, staff auth/role, organization/audit, graph, alert, AI grounding/fallback and date tests included. Seven Python scanner safety tests passed. New integrity tests retain all samples, enforce domain-disjoint final selection and preserve malformed inputs rather than dropping them.
- Live preview English refund lure High/74; real `du.ae` DNS/NS/MX/ASN Low/20, Arabic labels inspected; 390×844 mobile no horizontal overflow; reload clears visit-private results; signed-out staff URLs redirect to `/auth`; no browser runtime exceptions. Initial language test used an incorrect exact accessible name; corrected selector rerun passed, with no code/label changes or AI replay.
- Staff audit **read-only**: HAM123 Officer+Public Visitor; HAM1234 Analyst+Public Visitor, both confirmed/password-configured; prior sign-ins 23 November. No owner-password sign-in or positive authenticated staff walkthrough performed. Credential/permission changes forbidden; test mappings are not password success. Existing owner credential, legacy inbox/OTP and independent Supervisor workflow verification remain unresolved.
- Published `https://taakkad.lovable.app/trust` actually loaded and submitted the refund lure: **Low/20**, no new metadata consent control. **FAIL: published app is older**. No publish/deployment/configuration change performed; explicit owner approval requested. Test is evidence of version absence, not proof new engine works published. Separate owner publication action is required before rerunning the same check.
- No new users/roles/credentials/private records/deletions, database/schema/permissions/deployment settings, paid subscription or external key. Only normal existing metadata and two AI usage reservations. Original design/brand/navigation/workflows/master README note and Punycode fix preserved.

### Reproduce / changed files / delivery

1. Full app: `bunx vitest run`; operator scanner: `python3 scripts/test_scan_url.py`.
2. Actual benign operator redirects: `python3 scripts/scan-url.py https://httpbin.org/redirect/2 --allow-host httpbin.org > /tmp/capture.json`. Each cross-host target requires another exact `--allow-host`; do not use this outside an authorized isolated environment. Analyze: `bun scripts/analyze-scan.ts /tmp/capture.json` (optional second same-final capture for partial differential indicators).
3. Final frozen evaluation: `bun scripts/evaluate-phase1b-resume.ts --final`. First-pass replay deliberately fails if its frozen engine no longer matches; use its historical checkpoint/artifacts, not regenerated hashes. Final dataset reproduction: `python3 scripts/sample-phase1b-resume.py /path/to/data.csv --final` with the retained first sample present. Labels/features never modified based on predictions.
4. New reviewer scenarios serializer: `python3 scripts/save-phase1b-reviewer.py`. Public artifacts remain defanged and docs-only. All original Phase 1/1B artifacts untouched.

Local branch: **main**. Exact source/docs/test/evaluation file list is in `docs/evaluation/phase1b-resume-delivery.json`; commit ID is supplied in the final delivery (a file cannot contain its own resulting commit hash). GitHub **master synchronization NOT VERIFIED**; no push/branch settings/history rewrite. Open blockers: owner publication approval; isolated deployed visitor scanner/privacy authorization; live browser cloaking; `.ae` registration service; full multi-day AI accuracy benchmark; owner-password and preserved legacy/Supervisor flows. **Phase 2 not started.**

---

**24 November 2026. Overall: PARTIAL; engineering targets NOT achieved. Phase 2 not started.**

## Before and after (positive = score ≥50; caution is negative)

| Dataset | Engine | N | TP | TN | FP | FN | Accuracy | Precision | Recall | F1 | FPR |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Original synthetic, now seen | Phase 1 | 48 | 21 | 23 | 1 | 3 | 91.67% | 95.45% | 87.50% | 91.30% | 4.17% |
| Original synthetic, now seen | Phase 1B | 48 | 24 | 24 | 0 | 0 | 100% | 100% | 100% | 100% | 0% |
| Independent controlled | Phase 1 | 39 | 8 | 18 | 1 | 12 | 66.67% | 88.89% | 40% | 55.17% | 5.26% |
| Independent controlled | Phase 1B | 39 | 16 | 17 | 2 | 4 | 84.62% | 88.89% | 80% | 84.21% | 10.53% |
| External historical public | Phase 1 | 1000 | 0 | 500 | 0 | 500 | 50% | N/A | 0% | 0% | 0% |
| External historical public | Phase 1B | 1000 | 5 | 500 | 0 | 495 | 50.50% | 100% | 1% | 1.98% | 0% |

The separate hybrid **fallback** engine returns the same counts on URL-only data. Four actual live AI+rules checks scored TP/TN/FP/FN **2/2/0/0**; N=4 is functional evidence only, not a 500-example AI accuracy benchmark. The score remains ordinal risk, never a calibrated fraud probability. External precision of 100% reflects only five detected positives and must not conceal 495 misses.

## Composition, sources, independence

- **1,000 external historical cases:** 500 source-phishing / 500 source-legitimate, [PhiUSIIL UCI 967](https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset), Prasad & Chandra (2024), [paper DOI](https://doi.org/10.1016/j.cose.2023.103545), CC BY 4.0. Source CSV has 235,795 rows, SHA-256 `a236549cd369cd80bd478ff8e1779cbf44c58d5c3f79f7a51a1adbed7d06d1c6`. Fixed seeded hash sampling per registrable-domain/source-label group; original development/seen domains excluded **before predictions**. Source feature columns, page titles and extracted features were not supplied to the engine. URLs are defanged in documents, never visited or bundled into the app.
- **40 independently proposed controlled scenarios:** read-only reviewer did not inspect rules or predictions. One original URL overlap is retained as seen; 39 are new (20 suspicious / 19 legitimate). Include UAE banks/government, login/payment, editorial/UGC negatives, compound names, encoded/base64 targets, userinfo, Unicode, IP and malformed Punycode. Paths are controlled illustrative scenarios, not certified live pages; a proposed Salik legitimacy label was not independently authenticated and is retained unchanged.
- **Uncertainty controls:** four unverified brand/IDN/shortener examples are reported separately; unknown shortener destinations are not artificially labeled fraudulent.
- **Offline defensive fixtures:** legitimate and credential-harvesting HTML variants, partial content differences, redirect chains including private/IPv6/rebinding evidence and hop limits. These are regression fixtures, not independent live scanner accuracy.
- Original 16/48 fixtures and reported Phase 1 output remain unchanged. Engine hashes frozen before final predictions; final results were not used for threshold/rule/label tuning. Baseline replay from `d58af97` reproduced original counts. All six controlled failures and 495 public misses, plus per-category matrices, remain in [final results](evaluation/phase1b-results.json). No difficult cases were discarded after prediction.

## Technical changes and error diagnosis

The four original mistakes came from overbroad bare-brand matching, compound `support` not counted as identity context, no contextual credential-collection signal, and IP/login evidence below threshold. General rules now address these; seen-set improvements are not independent evidence.

New rules add contextual compound identity/service names, editorial-mention caution, IP account actions, misleading official-domain path evidence and bounded nested/percent/base64 URL inspection. Official-domain outer URLs cannot hide suspicious nested evidence. Maintained PSL parsing and limited Unicode skeleton remain; unlisted domains/login words alone are not fraud verdicts.

Remaining controlled errors: `du.ae` is falsely matched by the old `u.ae` full-reference substring heuristic; proposed `salik.gov.ae` lacks a confirmed reference; malformed Punycode is a miss; MOHRE refund, telecom reward and airline refund contexts remain insufficiently covered. These are disclosed, not patched against the final set. Most external phishing examples contain no configured UAE brand/syntax clues and may depend on unknown/compromised webpage content. A larger URL-only dataset exposed the generalization gap rather than confirming the engineering targets.

## Actual capability status

| Capability | Status | Evidence / precise limitation |
|---|---|---|
| Redirect chain and displayed/final mismatch | **NOT AVAILABLE live** | No established arbitrary-third-party DNS-pinned HTTPS transport. DoH then ordinary fetch has a TOCTOU resolution gap. Offline chain policy only. |
| Shortened URL resolution | **NOT AVAILABLE live** | Shorteners detected; zero actual hops verified. No fabricated expansion. |
| Live webpage impersonation / cloaking | **NOT AVAILABLE** | No authorized isolated browser scanner. Offline non-executing title/form comparison produces fixture-only partial indicators, never confirmed cloaking. |
| `.ae` RDAP/registration dates | **UNAVAILABLE** | IANA bootstrap publication `2026-11-20T23:00:03Z` lists no `.ae` service. No guessed WHOIS age. |
| `.ae` DNS | **PASS live** | Actual `selfcare.uaepass.ae` A/CNAME via Google DoH, addresses `213.42.56.87`, alias `selfcare.gslb.uaepass.ae`. |
| Network routing metadata | **PASS live** | RIPE returned ASN 204206 / `213.42.56.0/24`; actual UI checked Arabic/English. Not hosting owner/geolocation. |
| RDAP `.com/.net/.org` | **PRESERVED** | Fixed-provider boundary and all RDAP regression tests passed; actual records verified during Phase 1, not re-claimed as fresh Phase 1B observations. |
| TLS certificates | **NOT AVAILABLE** | No target connection/certificate inspection; historical CT would not certify current target TLS. |
| Existing real AI | **PASS preview** | Four fresh bilingual inferences, model OpenAI `openai/gpt-6.1-sol`; no changed model/key/quota. |
| Current published improved engine | **FAIL** | Published Trust Portal loaded and checked; compound lure remained Unverified/Low/20 and lacked new lookup option. No publication performed. |

### Investigated alternatives
[Worker request options](https://developers.cloudflare.com/workers/runtime-apis/request/) restrict `resolveOverride` to zone contexts, not generic third-party IP pinning. [Browser Run](https://developers.cloudflare.com/browser-run/get-started/) has free quotas, but no binding/contained scanning environment is provisioned. [urlscan submission](https://docs.urlscan.io/apis/urlscan-openapi/scanning/submitscan) requires credentials and explicit privacy/visibility choices. [Firecrawl keyless scraping](https://docs.firecrawl.dev/authentication) exists, but JS execution, submitted-URL disclosure, retention and unproven required DNS containment mean it is not silently used as a security scanner. No new paid service or external key was introduced. Credentials are not the sole blocker.

## Security, regressions and staff

- **251 tests across 21 files passed**, including all existing tests; preview harness **build OK**. Existing AI privacy/grounding/fallback, organization workflows, reports, graph, alerts, role boundaries and login regressions passed.
- Google DoH/RIPE are literal fixed-origin providers; no submitted website fetch. Domain/hostname-only inputs, server revalidation, per-hop fixture public-IP checks, provider redirect rejection, fresh headers, omitted credentials/referrer, ECS suppression, timeouts and streamed response caps. DNS metadata is not connection pinning. Age, shared hosting and missing records do not independently raise risk.
- Preview Arabic/English, 390×844 mobile, reload result clearing and signed-out protected routes verified; no browser exceptions in successful checks. First language screenshot and evaluation grouping errors were corrected without repeating AI calls or changing labels. RIPE numeric-string schema corrected to match actual provider response, not a risk/threshold change.
- Read-only account check: HAM123 confirmed/password-configured, Officer only; HAM1234 confirmed/password-configured, Analyst only (each also Public Visitor), with prior sign-ins on 23 November. **No current owner password login or authenticated staff walkthrough verified.** No users, credentials, roles, auth settings, schema, existing records or deployment settings changed.
- Full 500-example model+registry+intelligence evaluation is **NOT VERIFIED**; existing 200/day and 5/visitor/10-minute controls remain. It needs an approved multi-day evaluation/credit plan, not bypass. Old owner-password, legacy inbox/OTP and independent Supervisor-publication blockers remain.

## Reproduction and delivery

1. Download the cited CSV to a temporary path; run `python3 scripts/sample-phase1b-public.py /path/to/data.csv`.
2. Run `bun scripts/evaluate-phase1b.ts`; the script rejects changed frozen engine hashes, duplicates and old URL overlap. It retains malformed URLs as negative/caution predictions rather than dropping them.
3. Run `bunx vitest run`. Baseline results are in `evaluation/phase1b-before.json`, final matrices/errors in `phase1b-results.json`, freeze hashes in `phase1b-engine-freeze.json`, and actual four inference observations in `phase1b-live-hybrid.json`.

Changed groups: URL analysis/reference/intelligence helpers and offline fixture parser; existing Trust result/consent presentation only; parse5 dependency; independent fixtures, regression tests, reproducible sampling/evaluation scripts; evaluation data/results and this report; README, ARCHITECTURE, AI_IMPLEMENTATION_REPORT, TEST_REPORT, AGENTS and roadmap. Original colors/layout/symbol/brand/workflows and master submission note preserved. Exact file list, commit ID and local branch are recorded with the final delivery; GitHub master synchronization is not verifiable here.

**Conclusion:** useful Phase 1B improvements and honest evaluation delivered, but not maximum accuracy, not published, and not a completed live scanner. No Phase 2 work started.