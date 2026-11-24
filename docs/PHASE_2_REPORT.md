# TAAKKAD — Phase 2: Proactive Detection and Early Threat Intelligence

Date: 24 November 2026. Phase 3 not started.

## Implemented

- **Analyst-only intelligence tab** in the existing Security Dashboard, preserving its other tabs, design and controls. Existing `security_analyst` role required; officers, visitors and supervisors without Analyst role are denied. Both server authentication and database policies retain the existing active-session/revocation check.
- **Targeted candidate generation** reuses the sourced UAE domain reference list: UAE banks, government entities, UAE PASS, TAMM, Ministry of Interior, Abu Dhabi/Dubai Police, RTA, Salik and related services. Keyword combinations and limited typo variants across `.com`, `.net`, `.org`, `.ae`; 20–24 distinct candidates per selected entity. Generated candidates are NOT internet discoveries or confirmed registrations.
- **Explicit real metadata verification** of up to four selected non-synthetic public registrable domains per command. Reuses the existing fixed-origin, bounded-body, five-second DNS/RDAP/RIPE helpers. Google DNS A/AAAA/MX/NS/CAA observations and RIPE public-IP routing metadata are recorded, with source URLs and check timestamps. No target website requests, redirect resolution, screenshots, HTML loading or automatic link opening.
- **Reliable registration distinctions:** a successful matching RDAP domain record establishes registration; reliable registration events supply date and age. Current supported registry suffixes: `.com`, `.net`, `.org`. `.ae` DNS works but its registration date remains unavailable. DNS presence is displayed separately and never called registration confirmation. Missing DNS records do not mean a domain is unregistered; RDAP 404 is only a lookup result, not a fraud or definitive global-registration verdict.
- **New-registration indicator:** a reliable registration age of at most 30 days, at the displayed check timestamp. Dates are never inferred from discovery time, DNS or an imported claim.
- **Manual and batch JSON imports:** suspicious search results, advertisements, business listings, helpline leads or manual intelligence. Required source attribution, explicit synthetic flag, target and typed indicators; optional source observation timestamp and original-language notes. Up to 50 records per batch; 250 KB browser file cap; 500 records / 1 MiB workspace cap. Incoming evidence cannot supply DNS/RDAP observations. Idempotent exact imports preserve existing records and distinguish changed notes/source observations.
- **Correlation:** type-aware normalized exact matches for phone numbers, domains, email addresses, URLs, IPs, SMS senders and social handles, against current accessible reports and intelligence records. Seeded report matches remain explicitly synthetic. Links are human-review leads, never common-offender attribution.
- **Private evidence-backed early warnings:** a non-synthetic candidate resembling the selected reference plus actual DNS records or confirmed RDAP registration creates a review warning without requiring a victim report. Review priority medium, or high with reliable recent registration. No public publication, trust-registry promotion, takedown automation or confirmed-fraud claims. Imports without independently obtained supporting domain evidence remain unverified leads.
- **Bilingual details:** risk/review level, target, source, creation/check/source timestamps, DNS/RDAP/ASN evidence, synthetic labels, shared indicators and recommended independent verification actions; Arabic RTL, existing locale/date helper and design-system controls.
- **Private Cloud persistence:** per-user workspaces, optimistic revision checks, server-only evidence commits, no browser persistence. Domain checks reserve a per-analyst allowance of 30 commands / 10 minutes; at most 120 domains per window, usually fewer. No paid APIs, subscriptions, AI inference or ML retraining.

## Security and preservation

The application checks the authenticated caller, Analyst role and existing active Cloud Auth session before reads or commands. RLS limits table reads to that Analyst's own workspace. Anonymous grants and authenticated direct writes are revoked. Service-only evidence commit checks the actor's Analyst role again; only the authorized application handler supplies verified observations. Source text is rendered escaped and never fetched. Domain names alone go to metadata services, with optional public IPs to RIPE; notes, phones, source URLs, report relationships and message content are not sent.

No staff account, password, identifier, role, existing report/application, public registry or existing detection rule was changed. The trained artifact is byte-identical to `7d76645`, SHA256 `089276cac26e8648a4a294e07195f25f25a9e2469790eff971339e993fdf143c`. Punycode/security dependency fixes preserved. No private case fixture was added to production code. No new intelligence record was successfully saved during verification; failed checks never fabricated evidence.

## Actual verification

| Check | Result | Evidence / limits |
|---|---|---|
| Targeted unit/server tests | PASS | 20 tests: target generation, source attribution, batch limits, typed correlation, network eligibility, real-response parsing, warning predicates, synthetic/official exclusion, service failure, Analyst/Officer/Supervisor/session denial. |
| One final regression | PASS | **302 tests, 27 files**, including prior ML, authentication, organization, privacy and investigation tests. No benchmark rerun. |
| Preview compilation | PASS | Managed preview reports `build OK`; no manually run production build is claimed. |
| Transactional database checks | PASS | Privileged rollback-only test uses an existing valid database-session fixture; checks grants, read access, 30th command permitted/31st denied, non-active session and Officer denial. No counter/account/record change persists. This is NOT password login or browser end-to-end proof. |
| Live `.ae` metadata helper | PASS | `uaepass.ae`: A `213.42.56.87`, MX and NS records, ASN 204206; registration unsupported, date null. Hostname sent only to Google DNS and public address to RIPE. Observed 09:37 UTC. |
| Live benign registration control | PASS | `example.com`: successful DNS and RDAP, registration `1995-08-14T04:00:00Z`; no target website visit. Legitimate control, NOT a threat allegation. |
| Live generated candidate control | PASS, no threat discovered | `uaepass-login.com`: no DNS records observed, RDAP not found, registration date null. No invented registration or live-fraud claim. |
| Production dependency audit | PASS | `bun audit --production --json`: `{}`. No dependency changes this phase; prior development-only advisories remain documented in Phase 1C. |
| Backend security scan | PASS with existing info | No critical/warning findings; one pre-existing informational public organization projection finding left untouched. Deep scan not run. |
| Genuine authenticated analyst UI save/readback | **NOT VERIFIED** | Temporary HAM1234 preview tokens pass identity/role validation but fail existing `auth.sessions` checks. The initial dashboard fails before this tab loads (`Workspace unavailable`). Owner replied “yes” to signing in, but no usable owner preview session was available. No bypass, role change or credential change was attempted. |
| Full bilingual/mobile analyst view | **NOT VERIFIED** | Isolated non-persisting visual harness did not complete; it is not counted as a pass. Existing compilation and regression succeed, but no inspected end-to-end screenshot is claimed. |
| Published site/public boundaries | PASS | Publishing requested after successful checks. Actual public site returned 200 on Overview, Trust, Organizations and Auth; signed-out Security/Officer routes returned to Auth. English desktop/Arabic mobile screenshots inspected, no exceptions/overflow. |
| Published Phase 2 intelligence execution | **NOT VERIFIED** | The protected module did not load without a genuine analyst session. Public asset-marker inspection did not confirm the new intelligence bundle; scheduling a deployment is not completion proof. No live analyst inference/save/readback claim. |

Machine-readable live metadata/test evidence: `docs/evaluation/phase2-evidence.json`. Database test: `src/test/intelligence-access.test.sql`. First read-only CLI database attempts were not suitable for privileged tests; the successful test used the data tool and rolled back. Test failures initially exposed inherited table grants; the additive narrowing migration revoked them while preserving RLS.

## Practical limitations and alternatives

1. **No continuous feed or autonomous internet search/ad discovery.** Analyst-driven generation/import/checks only. Source references and capture notes are analyst assertions, not automatically authenticated publications. Alternative: import JSON exports/screenshot references from authorized investigations or free sources, and independently review.
2. **No reliable automatic `.ae` registration dates.** Existing IANA-bootstrap implementation has no supported `.ae` RDAP provider. DNS/ASN observations work; manually sourced official registry material can be stored as attributed notes but is not promoted to verified dates. Extend only after establishing a documented reliable free endpoint and response validation.
3. **No suspicious-site visits, live cloaking or page-content proof.** Existing Phase 1B operator-only safe scanner remains separate and unchanged. Alternative: authorized isolated operator investigation and attributed evidence import. No website requests were made by this module.
4. **No validated proactive fraud accuracy metric.** Deterministic candidate similarity plus reliable existence/age evidence prioritizes review; it does not establish malicious intent. No real confirmed fraud discoveries or threat feed coverage claims.
5. **Metadata limits/outages/staleness.** All observations are timestamped snapshots; external rate limits, NXDOMAIN, missing records or unsupported RDAP remain explicitly uncertain. Only one selected public address's routing observation is shown; ASN is not hosting identity/ownership proof.
6. **Staff/live walkthrough awaits a real login.** Finish privately signing in as HAM1234 in the preview/published site, open Proactive Intelligence, generate candidates, check one domain, import a clearly synthetic reference, and confirm readback. The agent does not know passwords; temporary sessions are not accepted as password-login evidence.
7. **Record review workflow is intentionally lightweight.** Private warnings and recommended actions; no automatic public accusations, external abuse submission, notification feed or scheduled polling. Existing public security-alert approval remains separate.

## Batch input example

The analyst selects the target for manual entry. JSON includes the target on every row. Synthetic example; no verified observation or secret:

```json
[
  {
    "title": "Synthetic helpline listing example",
    "targetDomain": "uaepass.ae",
    "domain": null,
    "source": "helpline",
    "sourceReference": "Offline synthetic hackathon listing fixture",
    "sourceObservedAt": null,
    "synthetic": true,
    "notes": "Fictional demonstration, not a real advertisement or fraud accusation.",
    "indicators": [{ "type": "phone", "value": "+971 50 000 0000" }]
  }
]
```

## Changed files

- `src/lib/intelligence/schema.ts`, `engine.ts`, `authorization.server.ts`, `metadata.server.ts`, `intelligence.functions.ts`, `queries.ts`: schema, generator/correlation/warnings, role/session boundary, metadata observations, authorized commands, private queries.
- `src/components/intelligence/intelligence-panel.tsx`: bilingual analyst view/import/evidence controls.
- `src/routes/_authenticated/security.tsx`: Analyst-only extra tab and bounded loading fallback; other workflows unchanged.
- `src/test/proactive-intelligence.test.ts`, `intelligence-authorization.test.ts`, `intelligence-access.test.sql`: focused logic/auth/database tests.
- Tool-created migrations `drizzle/migrations/0023_analyst_proactive_intelligence.sql`, `0024_protect_intelligence_evidence_writes.sql`, `0025_retain_intelligence_session_revocation_checks.sql`, `0026_narrow_analyst_intelligence_grants.sql`, corresponding managed snapshots/journal, regenerated `src/integrations/supabase/types.ts`.
- `README.md`, `TEST_REPORT.md`, `roadmap.md`, `docs/PHASE_2_REPORT.md`, `docs/evaluation/phase2-evidence.json`: documentation and measured evidence.

Initial implementation saved as `50ae5ea`; final session/grant refinements, tests and documentation commit supplied in delivery. Local branch and final synchronization status supplied after commit. No history rewrite, repository visibility or branch-setting change. Root `AGENTS.md` is at its managed size budget; its attempted new note was rejected, not applied. Architecture boundary is documented here and in the intelligence module's directory guidance.
