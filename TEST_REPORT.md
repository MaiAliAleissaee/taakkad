# Final polish test report

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
