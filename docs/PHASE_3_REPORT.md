# Taakkad — Phase 3: Explainability, Digital Evidence and Actionability

24 November 2026. Phase 4 not started.

## Audit and scope

Reused existing report indicator links, investigation graph, synthetic labels, proactive DNS/RDAP/ASN observations, independent officer decisions/confirmation, private application documents and decision audit. Existing visitor AI content stays private and is not copied into staff views. No trained artifact, detection formula, staff account, password, role or existing record was changed.

Missing functionality implemented as a shared evidence panel in Security report details, each proactive intelligence item and Officer application details. There is no new public page or public evidence projection.

## Implemented

- **Bilingual risk explanations:** stored case severity/index and its fictional or rule-based origin; existing URL rule signals and their weights; actual local inference from the unchanged frozen URL ML artifact, including model version, output and flag. Rule contributions are not claimed to be exact ML feature attribution; outputs are not calibrated probabilities. Applicant status is not a fraud score.
- **Evidence timelines:** original report evidence/notes, intelligence capture and check snapshots, reliable RDAP registration events where already present, application audit, new attachment receipts and approved preparation decisions. Every event has provenance/source; deterministic UTC ISO and UAE UTC+4 display. Missing dates remain unknown; declared capture times are not trusted timestamp certificates.
- **Private attachments:** PNG, JPEG, PDF and UTF-8 text, at most 512 KiB/file, six files/subject, 100 events/subject and 30 saves/10 minutes. Browser and server validate names, content size, canonical base64 and format signatures; SHA-256 computed from bytes on the server and rechecked on read/export. Source and declared UTC capture time required; future times rejected. No executable HTML/SVG accepted, no client-submitted hash trusted. Screenshots are uploaded by staff, never fabricated or captured by visiting suspicious sites.
- **Private persistence:** append-only bounded evidence records, owner-scoped reads with active-session and institution-role RLS; no browser/direct mutation. Authorized server verifies subject access before service-only insert. Analyst subjects: accessible own case/intelligence snapshots. Officer subjects: accessible organization applications. Attachments remain private to their submitting staff account even when another staff member can access the original subject.
- **Relationship review:** existing graph preserved, with exact type-aware shared-indicator lists and report references in evidence packages. Similarity/shared infrastructure never attributes an offender.
- **Exports:** structured JSON with both language fields, evidence provenance, timeline, indicators, learned output, source references, approved actions and full attachment bytes/base64 plus hashes. Bilingual printable A4 report uses escaped text and original uploaded images; browser print dialog offers Save as PDF. No paid PDF library or remote generator.
- **Actions:** preserve, independently verify, request further information and approve preparation for authorized police/takedown review. Explicit confirmation and decision note required; append-only private audit. Existing case escalated/confirmed status and simulated takedown-preparation changes now require explicit human confirmation on UI and server validation. Existing public suspicious-indicator behavior remains unchanged; preparation never submits an external request or publishes accusations.
- **Provenance:** technical observations, model predictions, generated candidates, visitor/applicant assertions, staff-supplied unverified files, human decisions and synthetic evidence remain distinct. Full original visitor AI analyses are unavailable to staff; no AI prediction is invented.

## Actual results

| Check | Result |
|---|---|
| Targeted rules/auth tests | PASS: 22 tests across three files (includes five preserved intelligence tests). |
| Single final regression | PASS: 321 tests across 29 files. |
| Managed preview compilation | PASS: `build OK`; no manually run production build claimed. |
| Database contracts | PASS: rollback-only execution checks grants/RLS, active Analyst fixture, Officer cross-denial, revoked-session denial, six-file cap and human approval. No record/counter/account change persists. Not password-login evidence. |
| Server hash/readback tests | PASS with mocked data clients; real SHA-256 bytes validated, tampered hash rejected. Not end-to-end persistence proof. |
| Actual isolated exports | PASS: JSON 6,315 bytes, PNG 68 bytes, bilingual PDF 71,033 bytes; real downloads and print output checked. Explicit fictional fixture only, no persistence. |
| Print layout | PASS: inspected desktop/mobile screenshots; Arabic text and SHA-256 visible, no mobile overflow or page errors. |
| Production dependency audit | PASS: `{}`; no dependency upgrades. |
| Quick security scan | PASS with one existing informational public organization-registry finding left unchanged; no critical/warning findings. |
| Deep code scan | Pending completion; publication deferred until the requested security checks finish. |
| Genuine staff upload, persistence, download/export readback | NOT VERIFIED: owner's genuine session cannot be restored to automation; separate test sessions fail existing workspace/session checks. No bypass or credential change. |
| Published Phase 3 execution | NOT VERIFIED until deployment and authorized live checks occur. |

## Limitations

1. Browser Save as PDF is a print-dialog export, not silent one-click PDF generation. Popups must be allowed; Safari/iOS behavior remains untested. Downloaded private packages must be handled securely by the reviewer.
2. Bounded small files are stored as private Cloud evidence records rather than a new storage bucket. Six files may require resizing screenshots before upload; no archive/large-file support.
3. Signature/UTF-8 validation is not antivirus scanning or complete PDF/image safety certification. PDF/text attachments are downloaded, not interpreted inside the report. A malicious authorized submitter can supply misleading material. Hashes prove byte consistency only, not authenticity, legal admissibility or trustworthy capture time.
4. Full visitor AI results were never persisted in staff snapshots; they remain unavailable. ML inference is local, unchanged and explicitly uncalibrated. No new model calls, retraining, benchmarks or accuracy claims.
5. Existing Phase 2 DNS/RDAP/routing snapshots are reused, not refreshed. No reliable `.ae` registration provider or hosting-owner certification added. ASN indicates routing, not owner identity. Missing values are not fabricated.
6. Legacy application documents keep their existing handling; new Phase 3 files use stricter validation/hashes. Old files/evidence/settled decisions are not rewritten or retroactively certified. Existing source-free legacy evidence uses its stored origin as attribution; no missing URL invented.
7. Human-approved preparation does not change roles, transmit abuse/takedown forms, contact police, generate legal signatures or assert guilt. Existing organization approval/independence controls remain intact.

## Changed files

- `src/lib/evidence/schema.ts`, `model.ts`, `evidence.server.ts`, `evidence.functions.ts`, `download.ts`: validation, provenance/UTC-UAE explanations, authorized subject snapshots, append-only files/actions, hash-checked package readback and local exports.
- `src/components/evidence/evidence-tools.tsx`: shared bilingual evidence panel.
- `src/routes/_authenticated/security.tsx`, `src/components/intelligence/intelligence-panel.tsx`, `src/components/orgs/officer-dashboard.tsx`: existing-detail integrations and explicit status confirmation.
- `src/lib/security/schema.ts`, `workspace.functions.ts`: server-required human escalation confirmation and future status audit notes.
- `src/test/evidence.test.ts`, `evidence-authorization.test.ts`, `evidence-access.test.sql`: concrete validation, provenance, hash, action and authorization contracts.
- Tool-generated `drizzle/migrations/0027_private_staff_evidence.sql`, `meta/0027_snapshot.json`, `meta/_journal.json`, regenerated `src/integrations/supabase/types.ts`: additive private evidence schema and grants.
- `AGENTS.md`, `roadmap.md`, `README.md`, `TEST_REPORT.md`, this report: boundaries and actual results.

Commit ID supplied in delivery after saving; local branch `main`. GitHub `master` synchronization not verified. No history rewrite or visibility/settings changes.