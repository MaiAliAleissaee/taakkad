# Taakkad — Phase 1B completion report

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