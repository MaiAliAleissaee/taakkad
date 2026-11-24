# TAAKKAD — Organization identity conflicts and relationship declarations

## Implementation

| Capability | Actual status |
|---|---|
| Existing approved green registry cards | Preserved: four original staff-approved prototype records remain public; yellow preloaded examples remain hidden. |
| Automatic registry updates after demo approval | Existing atomic, idempotent projection and 15-second refresh retained; rollback-only approval/projection checks passed. |
| Protected bilingual relationship declarations | Implemented in public demo registration and the preserved legacy form; eight relationship choices, related organization, explanation and optional evidence description/reference. |
| Private storage | Dedicated private application field, stripped from identity payloads before public projection. Existing applications retain an unknown declaration rather than an invented answer. |
| Identity conflicts | Database-normalized domain/website, phone, email, handle, SMS and name comparisons; supplemented by the existing lookalike detector. No automatic rejection or fraud classification. |
| Technical observations | Officer-initiated bounded reuse of existing DNS/RDAP/routing helpers; up to three distinct eligible registrable domains. No submitted website or supporting-evidence URL is visited. |
| Shared infrastructure | Stored IP, NS, MX, CAA and ASN matches remain low-risk review leads. Missing snapshots remain unknown, and ineligible/synthetic domains are never scanned. |
| Staff conflict screen | Bilingual matched organization, indicator, exact/approximate match, severity, reason, source classification, declaration, evidence description and available technical timestamps. Existing private evidence tools remain available below the review. |
| Significant conflict disposition | Independent active officer must document a decision and confirm review of the explanation and available/missing evidence. A relationship declaration does not clear a conflict. |
| Approval protection | Server checks and an atomic database trigger block unresolved high-risk overlaps. Fingerprints bind disposition to current identity, declaration, documents, technical snapshots and matching records. The approving officer must be the reviewer. |
| Audit | Private conflict decision and metadata events retained in application history, including the officer, time, decision note and matched conflict snapshot. |
| Public tracking | Unchanged five-digit reference-only tracking returns exactly code, submission date, status and a generic bilingual message. Private receipts and recovery remain separate. |

## Actual verification

- **78 distinct targeted unit/regression tests passed.** Initial six-file run: 74 tests. After the maintained lookalike integration, its four new tests and the affected 29-test module passed; completed registry/tracking suites were not repeated.
- **Rollback-only database contracts passed:** normalized exact email/phone/SMS conflicts; private declaration separation; no relationship-based auto-clear; unresolved high-risk approval denial; no public projection on denied approval; sessionless resolution denial; approval/projection after a service-side documented-review fixture; idempotent reapproval; stale-evidence reapproval denial; low-risk IP/NS/ASN matching. The service-side fixture tests the guard and projection, not genuine authenticated human resolution. Early fixture construction/query errors were corrected; no failed test transaction was retained.
- **Actual public browser submission passed:** a fictional relationship assertion was saved with pending status and remained absent from the public registry. Stored declaration was confirmed outside the identity payload.
- **Arabic and English mobile/desktop form checks passed:** all relationship options and protected fields render, including validation, at 855px and 390px without horizontal overflow.
- **Anonymous direct calls denied:** conflict reading, conflict resolution and technical checks all rejected a caller without authentication.
- **Public tracking privacy observed:** the validation reference returned exactly the four allowed fields and the current general status, without relationship text or private evidence. Its status subsequently became `needs_information`; a test's assumed older status was not treated as an application defect.
- **Temporary test-session denial observed:** the minted test session could reach existing officer UI after a temporary isolated role grant, but the new conflict operation correctly rejected it because it did not satisfy the permanent active-session predicate. No session or permission bypass was added. The temporary role was removed; original HAM123/HAM1234 roles and credentials were not changed.
- **Genuine active-session officer conflict read/resolution and full browser approval-to-registry readback remain UNVERIFIED.** The owner offered to sign in as HAM123; the sandbox could not yet restore that genuine session. Existing basic review access is not evidence that the new conflict resolution flow passed.
- **Preview compilation: build OK.** No package installation, model change, paid AI invocation or new benchmark was needed.

## Security and publication

- Quick security check: **no critical or warning findings; one unchanged informational public-registry policy finding**. It was not modified or ignored.
- New conflict read/resolution operations require both the assigned officer role and an active authenticated session inside the database. Anonymous execute privileges are revoked. Technical snapshot writes are service-only, reached only after live independent officer authorization; callers cannot supply observations through the browser action.
- Existing private evidence, receipt, tracking, registry simulation and fraud-detection boundaries are retained. Public projections never include relationships, conflict notes or technical snapshots.
- Deep security clearance for the saved enhancement and genuine staff end-to-end verification are outstanding release gates. **Not published.**
- One new private fictional validation application, `Final Conflict Verification TEMP`, is retained for the requested genuine staff check. It is not an approved public sample. Cleanup is deferred while the owner is reviewing it; no pre-existing record is deleted. Rollback-only test copies were discarded.

## Limits and uncertainty

- A declaration or documented disposition is a human prototype decision, not independently verified corporate ownership or channel authorization.
- Applicant evidence in demo registration is a private description/reference, not an automatic document fetch. Legacy applicant documents and existing staff-only validated evidence attachments remain available under their original protections.
- Technical comparisons require observations for both organizations; no background scan fabricates missing infrastructure. Fresh real DNS/RDAP collection through a genuine officer session is not yet verified in this enhancement.
- Name matching is conservative normalized edit distance; domain leads additionally reuse the existing deterministic lookalike engine. Transliteration, all possible brand variants and visual logo impersonation are not guaranteed.
- Current comparison queries suit the hackathon repository. A large production registry needs indexed indicator projections and load/concurrency testing; serialized decisions and optimistic revisions are implemented, but a separate high-load benchmark was not run.
- No partnerships, ownership certificates, fraud verdicts or genuinely trusted channels are fabricated by this enhancement.

## Technical inventory

- `src/lib/organizations/relationship.ts`, `identity-matches.ts`, `conflicts.server.ts`, `conflicts.functions.ts`
- `src/components/orgs/relationship-fields.tsx`, `conflict-review.tsx`
- Existing demo/legacy schemas, forms, private read/edit handoffs and officer review integration
- Additive private application fields, normalized comparison functions, authenticated resolution, service-only technical snapshots and serialized approval safeguards
- `src/test/organization-conflicts.test.ts`, `organization-lookalike-conflicts.test.ts`, `organization-conflicts.db.sql`

The saved implementation commit is supplied in the delivery message.