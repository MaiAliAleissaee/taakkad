# Taakkad architecture

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
