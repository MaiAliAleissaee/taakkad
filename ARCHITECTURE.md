# Taakkad architecture

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
