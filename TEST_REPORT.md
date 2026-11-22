# Final polish test report

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

## Readiness
**Hackathon preview: conditional PASS.** Owner credential checks, complete OTP tracking and Supervisor publication demonstration remain unverified. **Production readiness: NOT CLAIMED.** Source and documentation are suitable for repository handoff; publishing requires the owner's separate action.
