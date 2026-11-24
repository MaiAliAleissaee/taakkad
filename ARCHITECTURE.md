# Taakkad architecture

## Resumed Phase 1B architecture — 24 November 2026

The public application and offline operator scanner are deliberately separate trust boundaries. `scripts/scan-url.py` is a POSIX operator CLI, **not Worker/server-function code and not a public route**. Explicit exact-host authorization is required at every redirect. It rejects userinfo/query/fragment URLs, special hosts, IP literals, nonstandard ports, non-public/mixed DNS answers, redirect loops, HTTPS downgrades and excessive hops. Each fresh resolver result is validated before a literal-IP socket connection; actual peer equality and the original-host verified TLS SNI remove the DoH-to-fetch rebinding gap. It ignores proxy environment settings and uses no browser credentials/cookies/referrer. Fresh socket per hop, five-second connection/read timeout, six response maximum, 128 KiB uncompressed cap, no compression, and a POSIX 20-second process alarm including resolver/TLS/slow reads. An external isolated container/egress policy remains necessary before serving arbitrary visitor URLs. Windows execution is rejected without POSIX deadline support. No JS, credential submission, automatic HTML redirects or browser rendering is performed.

`scripts/analyze-scan.ts` analyzes operator-acquired HTML offline through the non-executing parse5 parser. It distinguishes actual captured chain observations from fixture-only supplied chains. The parser checks credential form destinations, HTML base and button action overrides, short-name token boundaries and title/domain mismatches. Comparing two supplied same-final-URL captures yields **partial differential indicators only**, never confirmed cloaking. Body capture storage is operator-local, not an app database or shared visitor cache. The CLI is runnable and tested but has no scheduled jobs, app endpoint, deployment or invented integration.

The app retains component-local results and hostname/domain-only consent. A/AAAA/MX/NS/CAA use five fixed-origin concurrent DNS requests; concurrent RDAP is the sixth invocation slot, RIPE enrichment begins after resolver responses. CNAME/NS/MX/CAA data is never followed. Real record fields are shown bilingually. Metadata, age, unavailable registration, shared networks and DNSSEC never independently raise fraud scores or approve channels. `.ae` has no IANA RDAP bootstrap service; no guessed WHOIS/TLS fields appear in the public portal.

General URL improvements are DNS-label-bounded reference matching, contextual refund/reward language and failure-safe Punycode decoding. Short aliases require token/context matches, not compound substring guesses. A preserved-demo regression discovered after the first benchmark was repaired; the first independent evidence remains immutable, controlled cases become seen, and a second domain-disjoint external sample was frozen before final predictions. Original Phase 1/1B files are preserved. Separate first/final freeze files and every failed example are in `docs/evaluation/phase1b-resume-*.json`; none are bundled into production app routes.

Real `httpbin.org` relative redirects and `example.org` static HTML/TLS verified the CLI, not public scanning. `www.du.ae` returned an HTTPS→HTTP redirect that was correctly blocked. No suspicious dataset site was visited. No available scanner connector/credential was found; no external credential, subscription, role or schema was added. Public deployment remains the older engine pending owner publication approval.

## Phase 1B addendum — 24 November 2026 (supersedes Phase 1 scope omissions below)

- Local `analyze.ts` adds bounded three-layer percent decoding, selected redirect-parameter/base64 decoding and three-level recursive nested URL evidence. An official outer host cannot override suspicious nested evidence. Compound support/service identity names, credential-collection context, IP account actions and embedded official paths add explained evidence; editorial mentions are observations. No submitted target is fetched. The limited glyph map is still not a full Unicode-confusables library.
- Optional `intelligence.functions.ts` accepts the registrable domain plus its canonical hostname, validates their relationship and reserves the unchanged 20/address/hour + 1,000/hour atomic limits. RDAP receives the registrable domain; DNS receives the **actual submitted hostname**, not an assumed apex address. Results remain component-local, not persisted or placed in shared query caches.
- `dns.server.ts` contacts only `https://dns.google/resolve` for A/AAAA and `https://stat.ripe.net/data/network-info/data.json` for one validated public IP. ECS is disabled in resolver requests. Returned CNAME strings are data, never fetched. Non-public answers stop ASN enrichment. Each provider uses fresh headers, omitted credentials/referrer, manual redirects, a shared five-second abort and streamed 64 KiB caps; schemas cap records/ASNs and validate prefix membership. RIPE's string-or-number ASN format is normalized. No arbitrary URL or provider link is followed.
- DNSSEC means resolver validation, not website identity. DNS and routing results are snapshots, not DNS pinning, target TLS metadata or hosting-owner identification. Dates, shared hosting, missing DNS/RDAP and ASN observations never create fraud scores alone. Existing hybrid maximum and AI grounding/privacy boundaries are preserved.
- `controlled-scan.ts` is an **offline fixture harness only**, with parse5 non-executing HTML parsing, a 128 KiB input cap, title/domain/credential-form evidence and differential partial indicators. Script contents are ignored, never run. Controlled redirect evidence checks HTTP(S), permitted ports, hop limits and every supplied IP; it is not an HTTP transport and cannot attest that a future scanner actually pinned DNS. No runtime endpoint exposes fixture results as live verification.

### Infrastructure investigation and precise blockers
- Ordinary [Worker requests](https://developers.cloudflare.com/workers/runtime-apis/request/) do not expose general arbitrary-third-party HTTPS connection pinning. `cf.resolveOverride` is zone-restricted. DoH → fetch(original hostname) has an independent resolution/TOCTOU gap, so it is deliberately **not implemented** as safe redirect expansion.
- [Browser Run](https://developers.cloudflare.com/browser-run/get-started/) has a free quota, but no browser binding/authorized scanning environment is provisioned here. [urlscan](https://docs.urlscan.io/apis/urlscan-openapi/scanning/submitscan) requires a key and deliberate [visibility/retention](https://docs.urlscan.io/pages/visibility) choices. Firecrawl has documented [keyless scraping](https://docs.firecrawl.dev/authentication), but renders JavaScript and does not establish the required DNS-pinned containment/trace and privacy controls. No connector is currently available; none was linked or paid for.
- No authoritative `.ae` service was present in [IANA RDAP bootstrap](https://data.iana.org/rdap/dns.json), publication `2026-11-20T23:00:03Z`. `.ae` DNS is supported, registration metadata is not. Registry WHOIS/web forms are not scraped or guessed. Live certificate inspection remains unavailable; Certificate Transparency history would not establish the certificate served by a live target.
- Sources for real metadata: [Google DoH JSON](https://developers.google.com/speed/public-dns/docs/doh/json) and [RIPE network-info](https://stat.ripe.net/docs/data-api/api-endpoints/network-info). No claim of direct hosting ownership or geolocation is made.

### Reference provenance and independent evaluation
The expanded reference file includes ICP/Emirates ID (confirmed from the [government ID directory](https://u.ae/en/information-and-services/visa-and-emirates-id/emirates-id)), MOHRE, DEWA, Salik and ADIB/Mashreq/RAKBANK/CBD/Emirates Islamic first-party reference links. ICP's direct page returned 500, MOHRE timed out and several first-party pages returned 403; these retrieval limitations are not independently certified institutional/channel ownership. ADIB's `.ae` address redirected to `.com`; the current homepage was read, and its legacy boundary remains separately documented. Mashreq/RAKBANK returned 200. Reference domains are curated identity context, not message authentication or endorsements; no generic `.gov.ae` or banking allowlist is introduced.

Detection hashes are frozen before final predictions. 1,000 PhiUSIIL rows retain source labels (balanced historical phishing/legitimate; one lowest seeded-hash row per registrable-domain/label group; original development domains excluded). Public website-feature columns are never given to detection. Forty independent reviewer scenarios retain all labels; one exact original URL is reported as seen, 39 as new. Malformed cases are retained, not dropped. Original artifacts and baseline commit remain reproducible. New category metrics/errors are in `docs/evaluation/phase1b-results.json`; no post-holdout tuning was performed. See `docs/PHASE_1B_REPORT.md` for actual failures and deployment status.

## Phase 1 URL analysis addendum — 24 November 2026

### Pipeline and trust boundaries
1. `src/lib/services/url/analyze.ts` runs locally: bounded HTTP(S) parsing → canonical host → `tldts` public/private suffix and registrable domain → Punycode/limited homoglyph skeleton → exact official-reference boundary → deterministic signals. `ipaddr.js` classifies IPs; IP/local/private/reserved/special-use destinations cannot be external registration targets.
2. `official-references.ts` contains sourced domain references, **not registry approvals**. Exact subdomain boundaries are required: `adcb.com.attacker.example` is not ADCB. Missing references, sensitive paths and registration age alone are not fraud verdicts. The limited skeleton is not comprehensive Unicode confusable detection.
3. Existing `verification.ts` incorporates technical suspicions beside channel rules. Trusted channels, simulated records, private flagged indicators and AI interpretations remain distinct. Public outputs gain no case IDs, relationship lists, documents or private notes.
4. `message-checker.tsx` keeps URL findings in component-local visit memory. Separate opt-in RDAP sends **only the registrable domain** to `intelligence.functions.ts`, which revalidates input and reserves usage through the existing atomic service-only limiter. No raw message/path/query is sent to RDAP; failures keep local results and explicit unavailable state.
5. Existing opt-in redacted/grounded AI remains server-only. `combinedRiskScore` is the bounded maximum of deterministic score, AI severity (low 0 / medium 40 / high 65 / critical 90) and flagged-indicator score 65. It is ordinal prioritization, not a fraud probability. No model, output cap or AI quota changed.

### Network safeguards and omissions
`rdap.server.ts` accepts only fixed HTTPS providers: Verisign `/com/v1/domain/`, `/net/v1/domain/`, and Public Interest Registry `/rdap/domain/`. Validated domains are path-encoded; there is no caller-controlled destination or proxy. Fetch uses `redirect: manual`, `credentials: omit`, `referrerPolicy: no-referrer`, a five-second abort and 128 KiB response cap. Provider redirects are rejected; response links are never followed; returned fields use a bounded schema. Redirect parameters, userinfo and shorteners are inspected locally only. Submitted URLs are never fetched, preventing them from targeting private hosts or rebinding through this feature. This is **not** a general redirect crawler: zero hops checked, final destination **unverified**. Cloaking, scripts, page content, DNS and hosting are not inspected.

RDAP requests reserve 20/address/hour and 1,000 globally/hour through the existing atomic Cloud command; usage failures stop lookup. No migration or authorization change was needed. Live records were obtained for `adcb.com`, `verisign.net` and `ietf.org`; `.ae`, `.abudhabi` and all other suffixes are deliberately unsupported. Missing dates/registrars remain absent, never estimated. Age does not independently raise risk.

### Official-domain sources
Exact domains and source links are maintained in `src/lib/services/url/official-references.ts`:
- UAE government: [u.ae](https://u.ae/).
- TAMM (`tamm.abudhabi`): [government smart Abu Dhabi reference](https://u.ae/en/about-the-uae/digital-uae/digital-cities/smart-abu-dhabi).
- UAE PASS (`uaepass.ae`): [government UAE PASS reference](https://u.ae/en/about-the-uae/digital-uae/digital-transformation/platforms-and-apps/the-uae-pass-app).
- Ministry of Interior, Abu Dhabi Police, Dubai Police and RTA (`moi.gov.ae`, `adpolice.gov.ae`, `dubaipolice.gov.ae`, `rta.ae`): [government road-safety directory](https://u.ae/en/information-and-services/justice-safety-and-the-law/safety/road-safety).
- ADCB (`adcb.com`): [official contact page](https://www.adcb.com/en/get-in-touch/call-us/).
- Emirates NBD (`emiratesnbd.com`): [official contact page](https://www.emiratesnbd.com/en/help-and-support/contact-us).
- FAB (`bankfab.com`): [official fraud/security page](https://www.bankfab.com/en-ae/personal/help-and-support/fraud-and-security).
- DIB (`dib.ae`): [official support page](https://www.dib.ae/support).
Government directory links were checked during implementation; bank references use first-party sites. This curated list is not complete/live institutional certification and does not authorize every URL/message on a domain.

### Evaluation separation
Technical trade-offs: maintained public-suffix parsing replaces naive last-two-label matching; fixed-provider RDAP is narrower but safer than caller-supplied WHOIS endpoints; explicit unverified redirects avoid the additional DNS-rebinding and crawling risks of a general expansion service. Existing AI is retained for semantic context instead of using URL rules as a complete fraud verdict.

`scripts/evaluate-urls.ts` evaluates labelled/provenance-annotated fixtures: 16 development + 48 disjoint held-out URLs, no private data. Positive means local `suspicious` classification at score ≥ 50; caution is negative. No fixture URL is fetched. Results and errors are in `docs/url-evaluation-results.json`; held-out mistakes were not used for tuning. AI, RDAP and registry are excluded from accuracy metrics; live functionality is reported separately in `TEST_REPORT.md`.

The pre-Phase-1 overview below is retained; any fictional registrar evidence in stored cases remains fictional, separate from new live RDAP results.

## Components and boundaries
1. **Public presentation:** Overview, Organization Portal, Trust Portal and published alerts; Arabic/English preference and RTL/LTR. Original design tokens remain authoritative.
2. **Staff session:** username resolved privately to an internal Auth identity during rate-limited operations. Password validation is performed by Cloud Auth. Single-use setup grants contain only hashes in Cloud; raw link secrets use URL fragments.
3. **Protected workspaces:** `/security` for Analysts/Supervisors; `/officer` for Organization Verification Officers. Client dialogs replace denied pages before restricted queries run; authenticated server checks and RLS remain the actual security boundaries.
4. **Private organization records:** immutable submission timestamp, documents, correction note, audit and optimistic revision. Service-only atomic commits follow live officer/owner authorization. No-signup tracking uses reference + hashed secret + email OTP, then a short-lived application-scoped capability.
5. **Public projections:** individually active approved channels and approved identity fields; no documents, private notes or applicant contacts. Public security warnings have a separate published-only projection.
6. **Investigation records:** private per-user snapshots, owner-scoped browser archives and restricted report inbox. Exact, normalized, type-aware shared indicators derive graph relationships; no offender inference.

## Data flows
```text
Public check -> submitted indicator candidates -> narrow matching RPC -> matching values only
             -> optional redaction -> atomic usage reservation -> server AI Gateway
             -> validated/grounded bilingual interpretations -> component-local result
Explicit report -> private report inbox -> authorized Analyst workspace -> human review
Registration -> private pending application -> Officer decision -> separate channel approval
             -> approved-only public projection -> deterministic channel matching
Alert draft -> independent Supervisor review/approval -> explicit publication -> public warning
```
The deterministic verification result never becomes proof of message authorship. Full AI findings stay in the checking visit; explicit reports retain content and grounded indicators, not a model-certified assessment.

## Permanent report display numbers
Private year counters and a permanent ledger map stable report IDs to monotonically assigned year/sequence pairs. Database triggers annotate templates and workspaces, overriding client-supplied display numbers. Allocation is transaction-serialized; ledger entries survive case removal. Existing IDs, evidence and notes remain unchanged. Updates return the stored, trigger-annotated payload.

## Role separation
| Staff username | Institution workspace | Forbidden workspace |
|---|---|---|
| HAM123 | Organization Verification Officer | Security Dashboard / private cases |
| HAM1234 | Security Analyst | Officer Dashboard / private applications |
Both retain public-service access. Roles are separate from profiles and not client-editable. Neither has Supervisor or administrator grants. Publishing new warnings remains unavailable to these two roles by design.

## Demo versus production
The application has real password authentication, private storage, role enforcement, approval state machines and real model invocation. Seeded investigations, registrar evidence, identity checks and enforcement actions remain fictional. No live external monitoring, geolocation, official affiliation or operational deployment is claimed. AI redaction is defensive, not complete anonymization; unnecessary personal data should be removed manually. Visitor IDs are resettable, so the global daily ceiling is the hard budget backstop.
