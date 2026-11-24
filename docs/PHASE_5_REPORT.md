# Taakkad — Phase 5: feasibility, scalability and presentation readiness

**24 November 2026. Documentation-first final phase; no new application features.**

## Release and actual validation

Screenshot implementation **`5e10491`**, followed by documentation-only `40c9dfd`, was published to https://taakkad.lovable.app. Actual hosted `/trust` returned HTTP 200 and executed the new OCR/QR controls; this is deployment confirmation, not merely a scheduled publish. The final documentation commit is supplied in the handoff/git history; it does not change the deployed application logic.

| Check | Actual result | Scope / limitation |
|---|---|---|
| Screenshot-only | PASS | Hosted English JPEG, Arabic PNG, mixed WebP and paired QR fixtures yielded editable extraction and local results |
| Manual-only | PASS functionality | Official ADCB homepage scored 20; lookalike `adcb.com.attacker.example/login` scored 74 with Suspicious Indicators; targets were not visited |
| Legitimate sensitive path | FALSE WARNING | `www.adcb.com/login/payment` retained its correct official-domain reference but local ML raised risk to 65. Not a registry approval, crime claim or newly measured accuracy rate |
| Combined screenshot/manual | PASS | Arabic screenshot and different manual URL retained both values and displayed unresolved conflict |
| Arabic/English OCR and QR | PASS functionality | Actual text/URL extraction; adjacent `https://qr-pay.example` and `javascript:alert(1)` QR payloads decoded as inert text. OCR on QR patterns remains uncertain |
| Responsive public experience | PASS | Six public/login/setup pages returned 200 and had no horizontal overflow at 1280×1800 and 390×844; English mobile mixed OCR/result also checked |
| Private visit state | PASS | Reload removed manual result; source review confirms local screenshot ownership, cancellation and no automatic persistence |
| OCR network boundary | PASS, qualified | OCR/runtime/language GETs were same-origin; no target visit or image/text upload observed. Hosting emitted a separate `/__l5e/trackevents` POST without the tested image/text payload. Do not claim zero total POST traffic |
| Staff access, signed out | PASS negative check | `/officer` and `/security` redirected to `/auth`; not positive staff-login evidence |
| Full regression | PASS | **424 tests across 37 files**, one `bunx vitest run`, 12:35 UTC, no skipped/failed Vitest tests |
| Security release check | PASS with retained info | Screenshot deep scan completed 12:32 UTC without critical/warning findings; fresh quick scan 12:35 UTC returned one informational public-registry finding, untouched. Aggregate freshness labels changed after documentation commits; not represented as a new deep scan of Phase 5 |

Browser screenshots were inspected. A first URL check assumed all legitimate paths would stay Low and failed on the real 65 ML warning; follow-up preserved/documented that result rather than changing the model or selecting it away. A mobile network assertion also incorrectly counted hosting telemetry as OCR upload; request classification corrected the assertion, not the application. No paid AI calls, metadata scans, accuracy benchmarks or retraining were performed in Phase 5. No users, roles, credentials, records, registry policies or runtime dependencies were modified.

The full Vitest suite includes mocked server tests and local fixtures. SQL/Python contracts outside Vitest were not rerun and are not included in 424. Actual deployment execution is verified; no standalone production build or load test was manually run.

## Implemented capability matrix

| Capability | Implemented | Tested evidence | Published / remaining unverified |
|---|---|---|---|
| Bilingual risk explanations | Yes: local rules/UAE cues and optional server semantic inference | Current regression; hosted bilingual local results; historical real AI spot checks | Published; current authorized paid AI and staff explanations not repeated |
| Timelines and attribution | Yes: UTC/UAE dates, typed source and metadata observations | Regression; earlier isolated evidence reports | Published; real staff save/readback unverified |
| Secure screenshots / hashes | Yes: local OCR/QR; separate authorized bounded evidence upload with server SHA-256 | Current local hosted OCR; validation/tamper/authorization unit tests and earlier DB contracts | Published; genuine Cloud attachment persistence and owner export unverified |
| PDF / JSON packages | Yes: authorized evidence snapshots, manifest and printable bilingual report | Current regression and earlier isolated real download/print tests | Published; owner-authenticated export and Safari/iOS print UI unverified |
| Linked-report visualization | Yes: exact normalized typed-indicator links and zoom/pan graph | Regression and earlier fictional graph fixtures | Published; current genuine Analyst report-to-graph walkthrough unverified |
| Recommended police preparation / approval | Yes: bilingual evidence-based guidance and explicit human preparation approval | Approval/authorization regression, earlier DB contracts | Published; real action save/readback unverified; no external escalation integration |
| Organization review and tracking | Yes: separated officer review, simulated projection and reference + private receipt secret | Regression; earlier receipt privacy readback | Published; real officer recovery and legacy positive email-code flow unverified |

## Architecture and feasibility

```text
Browser: React 19 / TypeScript / TanStack Start UI, Tailwind v4
  selected raster -> local worker (Tesseract ara+eng) -> editable text + local jsQR
  reviewed inputs -> local deterministic URL/UAE rules + exported URL ML trees
  candidates only -> narrow public Cloud matching -> visit-local result
  optional authenticated redacted text -> atomic budget -> server Gateway -> grounded interpretation
  explicit report -> restricted inbox
Staff: active role/owner/session -> server function + matching RLS -> private workspace/evidence
  authorized snapshot -> JSON download / escaped bilingual browser-print PDF
Public: approved active-channel projection and separately published warnings only
```

- **Deployment:** managed Lovable publishing serves the bundled assets and Worker-compatible TanStack server functions; Lovable Cloud provides Auth, database and private records. Backend migrations apply separately from publishing an app snapshot. Generated configuration/clients are preserved. A public clone alone is not a complete backend installation.
- **Development:** Bun, installed package lock and configured managed environment; `bun install`, `bun run dev`, `bun run test`, `bun run build`. Six placeholder variables in `.env.example` describe config names only, not usable credentials. Configure private Gateway credentials only through managed secrets, never the browser/repository. No need to provision Python for deployed inference.
- **OCR:** Tesseract.js 7.0.0 / jsQR 1.4.0 lazy browser dependencies; pinned same-origin assets and license/digests in `public/ocr/NOTICE.md`. First use downloads runtime/languages; with caching disabled language downloads may recur. CPU/memory/battery cost shifts to the visitor; not proven fast on every device. 8 MiB input, 8192 side, 16M pixels, 2400 OCR side, 10k characters and bounded indicators/QR payloads constrain work.
- **ML:** exported 40-tree numeric artifact (~23 KiB), 36 URL-only features, bounded JavaScript traversal; no inference network/service charge, no Python runtime. Historical same-source results in Phase 1C remain unchanged: accuracy 77.40%, recall 59.10%, FPR 4.30%. These do not estimate current UAE accuracy, OCR quality or full-hybrid performance.
- **Server/data security:** authenticated staff roles separate from editable profiles; active-session/owner checks and RLS; atomic revision checks/audit; service privileges used only after authorization; non-null workspace arguments cannot confer access. Tracking stores only SHA-256 of a 256-bit private receipt. Public reports are write-only; public registry rows are deliberately narrow. Hashes demonstrate byte integrity, not image authenticity or legal chain-of-custody certification.
- **Quotas:** paid semantic AI five reservations/user/rolling ten minutes, global 200/UTC day, 2400 output tokens/call. Failed attempts consume reservations; fail closed if budget unavailable. The output ceiling is at most 480,000 requested output tokens/day, not a measured expense or guaranteed throughput. Input varies; current credit pricing must be checked before funding a pilot. Public shared check/report caps are 6000/500 per hour; demo tracking 20/address/hour plus 1000 globally/hour; public metadata 20/address/hour plus 1000 globally/hour; Analyst metadata 30 commands/ten minutes; staff login ten/address/hour across usernames, recovery three/address/hour. Shared-network callers may affect each other, but cannot charge a victim username's bucket.
- **Evidence bounds:** six attachments/subject, 512 KiB PNG/JPEG per attachment, 100 events/subject and 30 saves/ten minutes. Public WebP OCR is not a private-upload capability: staff must deliberately convert/reduce derivatives and label provenance. Intelligence workspaces cap at 500 records; metadata batches cap at four domains.

### Scalability: reasoning, not a benchmark

Browser OCR/local ML reduce central inference work and keep pixels local; static asset delivery can be cached by hosting. Server functions can process independent requests, but database locks for global budgets/number allocation, bounded JSON snapshots and revision conflicts become likely contention points as use grows. Mobile worker startup, static language transfers, model false positives and operator review capacity may dominate perceived performance. Current ceilings intentionally reject excess work; they are not supported-user capacity measurements.

**Proposed, not implemented:** supervised load/soak tests with p50/p95 latency, memory and concurrency reporting; per-institution quotas; reviewed normalized data storage for larger workspaces; appropriate indexes and connection/queue monitoring; asynchronous authorized intelligence jobs; disaster recovery drills; managed alerts, retention/deletion schedules and independent penetration review. Raise caps only after cost, abuse and privacy assessment. No throughput, availability SLA, hosting residency, autoscaling guarantee or production security certification is asserted.

## Proposed controlled Abu Dhabi Police pilot — no partnership claimed

This is a proposal requiring institutional authorization; there is no current police integration or agreement.

### Scope, participants and stages

Proposed six-week supervised evaluation with **two Officers, four Analysts, one independently authorized Supervisor, one pilot lead, one privacy/security reviewer and at most twenty consenting internal volunteers**. These are proposed counts, not newly created accounts. Existing HAM roles/credentials stay unchanged. Begin with synthetic training, then only consented/de-identified examples inside an approved environment. No general public enrollment or automatic production enforcement.

1. **Weeks 1–2, approvals/readiness:** police sponsor defines lawful purpose/authority; privacy lead agrees data inventory, retention, deletion, permitted providers/residency and AI disclosure; security lead reviews environment, threats and access; owner completes authenticated acceptance checklist below. Stop if any required control is unverified.
2. **Week 3, synthetic rehearsal:** two-role boundaries, fake applications/channel revocation, bilingual screenshot errors, shared-indicator false links and evidence export exercises. Label every synthetic asset; do not merge it into official intelligence.
3. **Weeks 4–5, supervised limited inputs:** volunteers consent; Analysts document observed facts, sources, timestamps and uncertainty. Officers independently establish institutional authorization/channel ownership. Supervisor reviews any proposed public notice under existing publication permissions; no new role is silently granted.
4. **Week 6, review:** independent adjudication of sample labels, security/privacy findings, false positives/misses and reviewer effort; sponsor decides stop, revise or authorize a separately scoped production project.

### Responsibilities and approval flow

- Volunteer selects/crops a redacted screenshot; local extraction is reviewed before a public check or explicit report. Do not upload third-party personal content without lawful authority.
- Analyst verifies accessible evidence, keeps generated candidates separate from DNS/RDAP observations, records source/time and seeks independent corroboration; shared indicators alone cannot identify offenders.
- Officer verifies entity/legal representative authority and individual channels independently before any genuine approval. Simulated approvals remain simulated.
- Supervisor/pilot lead reviews evidence completeness, privacy and proposed action; authorized legal/operational staff decide external escalation in their own approved systems. The app records preparation, not transmission, takedown or enforcement.
- Privacy/security reviewer controls access, retention, logs and incident response. Emergency reports follow established police channels, not an app-generated enforcement instruction.

### Success indicators and go/no-go

Collect consented, independently labeled Arabic/English/mixed cases and report TP/TN/FP/FN by scenario, language and input quality; compare local rules, ML and any separately funded semantic AI without pooling outputs. Measure extraction omissions/digit errors, unavailable results, review agreement/time, response latency, quota rejection, receipt recovery and authorized export completion. Denominator and confidence intervals must accompany any accuracy claim. Proposed safety gate: no cross-owner/institution leakage in acceptance tests, all sampled actions have named human approval, and every public notice has required authorization. Sponsor sets quantitative accuracy/latency targets **before** pilot labels are reviewed. No achieved values are fabricated here.

### Production prerequisites (not current integrations)

1. Organization accreditation: independently authorized entity register and representative proof, verified domain/channel ownership challenge, periodic review/revocation, disputed-identity process and immutable audit. Current fictional records are insufficient.
2. Intelligence feeds: contracts/licensing, permitted collection scope, provider attribution/reliability, update timestamps, deduplication and contested-indicator process; isolate any future scanner with explicit consent and public-IP-pinned egress. No suspicious-site browsing/feed subscription currently exists.
3. Evidence: authorized collection/consent, documented capture context, original/derivative separation, custody access logs, retention/deletion/legal hold, approved encryption/key handling, malware scanning and admissibility review. Current SHA-256 is not a forensic certification.
4. Operations: approved hosting/residency and processors (including Gateway), MFA/institutional identity and session policies, monitoring/incident escalation, recovery drills and independent security/load tests. These need separate approvals and implementation.

## Missing functionality versus unverified workflows

**Not implemented by design:** official institutional ownership verification/partnership, operational police-system submission, automatic enforcement/takedown, continuous commercial intelligence feed, public arbitrary-site crawler, cryptographic email/message authentication, logo/visual-authenticity/deepfake/tamper detection, hidden hyperlink extraction, capture-time attestation, attachment malware certification and `.ae` RDAP registration dates. PDF uses the browser print/Save as PDF dialog, not a server PDF service. No additions were made in Phase 5.

**Implemented but owner must still test with existing real sessions:**
- HAM123 and HAM1234 private username/password login, own workspace access, bidirectional institution denial and logout/account switch.
- Analyst DEMO-001 synthetic import, persisted readback, authorized metadata check and report-to-graph link.
- Valid private PNG/JPEG upload, Cloud readback/hash/export; other-owner denial, revoked-session denial and approved preparation action readback.
- Officer review/correction, independently authorized channel changes, lost-receipt recovery and audit; keep simulated records out of trusted matching.
- Legacy confirmed-owner email code delivery/retrieval; Supervisor-only notice review/publication only if a separately authorized Supervisor exists.
- Optional paid AI only after active authorized session and explicit consent/budget; not needed for a no-cost judging demo.

Do not turn these into PASS from unit tests, a minted session or signed-out redirects. Camera hardware, Safari/iOS/HEIC and mobile performance on physical devices remain unverified. Run owner tests with isolated fictional records, retain receipts privately and never expose setup secrets on slides.

## Concise five-criterion technical summary

The supplied brief has no separate official scoring sheet; these five headings are a presentation mapping, not invented official weights.

| Criterion | Submission evidence | Honest boundary |
|---|---|---|
| Problem relevance / impact | UAE government, banking, UAE PASS/TAMM, traffic/delivery/payment; bilingual/dialect guidance | No invented incident prevalence, official endorsement or measured societal impact |
| Innovation | Local bilingual screenshot OCR + paired QR, URL ML/rules, separate registry facts and cross-report leads | No visual-image authenticity model; combinations support human review |
| Technical implementation | Three connected portals, typed full-stack app, active roles/RLS, budgets, private evidence/exports | Positive staff end-to-end acceptance still owner-dependent |
| Feasibility / scalability | Published usable public demo; local inference and bounded server work; documented pilot/ops requirements | No load/SLA/residency/production accuracy certification |
| Presentation / validation | Live screenshot flows, 424 passing tests, guide and explicit failure/uncertainty evidence | Fictional examples, historical ML metrics and real observations kept separate |

**Hackathon submission:** documentation and public demo ready, with declared owner-authenticated verification gaps. **Production/police deployment:** not claimed. This completes the requested final development phase without introducing additional features.