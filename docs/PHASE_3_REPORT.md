# Taakkad — Phase 3: Explainability, Digital Evidence and Actionability

24 November 2026. Phase 4 was subsequently approved separately; Phase 5 not started.

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
| Quick security scan | Fresh PASS at 10:51 UTC after fixes: one existing informational public organization-registry finding left unchanged; no critical/warning findings. |
| Deep code scan | Initial scan found eight selected findings (including duplicates). All eight fixed and marked resolved. A fresh deep scan of the saved changes is still required before publication. |
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

## Approved security completion

- Fixed the four public indicator/report functions: non-null workspace arguments require ownership and active analyst authorization. Six duplicate/related scan findings resolved in `f388aef`; seven live anonymous/public-reference tests and 26 targeted regressions had passed. Signed-in positive/cross-owner rollback tests remained unavailable because the test connection cannot access Auth sessions.
- Paid semantic analysis now requires an active authenticated session before usage reservation or Gateway inference. Local ML/rules, official/demo registry searches and public reporting remain anonymous. Budget buckets are anchored to authenticated users; the existing five/ten-minute and global 200/day ceilings remain. Public check/report functions add shared durable ceilings (6000 checks/hour, 500 reports/hour) using the already-approved custom limiter.
- New anonymous demo registration atomically issues the existing five-digit reference plus a cryptographically random 256-bit private receipt secret. Only SHA-256 is stored; secrets are kept in component memory and can be saved in a user-requested private receipt, never URLs/query caches/browser persistence. POST/no-store tracking returns general status/date only. Old number-only and internal status functions cannot be called directly by visitors.
- Existing applications/references/decisions remain unchanged. Legacy receipts with no fingerprint cannot be used by reference alone. Active officers can recover/rotate a receipt only after explicit independent identity-check confirmation and a private note; the change appends a separate security audit and invalidates the old secret. This is assisted recovery, not a claim that unverified email/name fields prove identity. Secure delivery is a human responsibility; there is no new email/SMS integration.
- Corrected shared stale workspace targeting across public checks and reporting: logout/account switches immediately fall back to public mode and remove the stale hint without deleting records.
- **30 targeted tests passed**, including the corrected hook mount race; only the two initially failing hook tests were rerun. Prior final 321-test regression and isolated Phase 3 JSON/PDF/hash results above were retained, not repeated. Preview compilation passed. Actual bilingual public browser checks verified local ML/checking, anonymous reporting, secret-receipt registration, owner status readback, wrong-secret denial, no browser-secret persistence and mobile layout. Three direct anonymous database bypass attempts were rejected. One explicitly fictional application and one fictional report were retained. Zero paid inference, metadata calls, benchmark repeats or new accounts.
- Genuine staff upload/readback, receipt recovery/rotation and authenticated owner/cross-owner execution remain **NOT VERIFIED**. Existing-account restoration failed with no matching requester identity; no test user, permission bypass, role or credential change was introduced. Mocked session/recovery boundary tests are not password-login or persistence proof.
- All eight selected findings have been marked fixed. The unrelated informational public organization-registry finding remains untouched. Subsequent owner-approved email-recipient and staff recovery/sign-in lockout corrections preserve this evidence implementation. Phase 3/4 publication is authorized but withheld until fresh deep-scan clearance of the saved fixes; Phase 5 is not started.
- Latest staff sign-in/recovery correction: caller-only budgets prevent charging a submitted staff identifier; ten login attempts/hour across usernames, three recovery requests/hour, private-link limits unchanged. 34 targeted tests pass; local live checks verify safe missing-address denial on both portals, not successful hosted password login. No evidence/regression tests or paid calls repeated. Full details and retained limitations are in `PHASE_4_REPORT.md`; genuine staff evidence persistence, officer recovery and inbox completion remain unverified.

## Changed files

- `src/lib/evidence/schema.ts`, `model.ts`, `evidence.server.ts`, `evidence.functions.ts`, `download.ts`: validation, provenance/UTC-UAE explanations, authorized subject snapshots, append-only files/actions, hash-checked package readback and local exports.
- `src/components/evidence/evidence-tools.tsx`: shared bilingual evidence panel.
- `src/routes/_authenticated/security.tsx`, `src/components/intelligence/intelligence-panel.tsx`, `src/components/orgs/officer-dashboard.tsx`: existing-detail integrations and explicit status confirmation.
- `src/lib/security/schema.ts`, `workspace.functions.ts`: server-required human escalation confirmation and future status audit notes.
- `src/test/evidence.test.ts`, `evidence-authorization.test.ts`, `evidence-access.test.sql`: concrete validation, provenance, hash, action and authorization contracts.
- Tool-generated `drizzle/migrations/0027_private_staff_evidence.sql`, `meta/0027_snapshot.json`, `meta/_journal.json`, regenerated `src/integrations/supabase/types.ts`: additive private evidence schema and grants.
- `AGENTS.md`, `roadmap.md`, `README.md`, `TEST_REPORT.md`, this report: boundaries and actual results.
- Security completion: `src/lib/security/workspace-target.ts`, `src/lib/data/hooks.ts`; `src/lib/services/authenticated-ai.server.ts`, `ai-analysis.functions.ts`, `ai-usage.server.ts`; `src/lib/organizations/demo-schema.ts`, `demo.functions.ts`, `demo-receipt.server.ts`; `src/components/orgs/application-tracker.tsx`, `tracking-receipt.tsx`, `tracking-recovery.tsx`, `officer-dashboard.tsx`; `src/components/trust/message-checker.tsx`; `src/test/security-completion.test.ts`, `workspace-target-hook.test.tsx`, updated `demo-organization.test.ts` and `ai-usage.test.ts`; tool-generated migrations 0028–0030, journal/snapshots and Cloud types; README, test report, architecture, AI implementation report and roadmap.

Phase 3 evidence implementation: `5cdd796`. Ownership correction: `f388aef`. Approved paid-AI/private-receipt/stale-reference correction: `7e602a5`, local branch `main`. Documentation follow-up supplied in delivery. GitHub `master` synchronization not verified. No history rewrite or visibility/settings changes.