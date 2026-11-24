# TRUST ZERO AI — hybrid AI implementation and validation

## Phase 1B — measured hybrid boundaries (24 November 2026)

The current brand is Taakkad / تأكّد; the historical report below remains unchanged. Existing server-only **OpenAI `openai/gpt-6.1-sol`**, Responses surface, 2,400-output-token cap, double redaction, strict bilingual JSON schema, prompt-injection instructions, supplied-text grounding and atomic quotas remain unchanged. No alternate model, external key or new browsing tool was introduced.

Improved local URL evidence feeds the existing deterministic assessment before the bounded hybrid maximum. Official-domain facts do not suppress local nested-target evidence or semantic risk. DNS/RIPE/RDAP fields are separately labeled metadata; they are not sent to AI or converted into registry facts. Queries, URL credentials and private text are still removed from external domain lookups; AI continues its existing minimization. No HTML from an untrusted live website enters a prompt or is executed.

**Separate measurement:** On 1,000 externally labeled URL-only examples, deterministic and explicit AI-unavailable hybrid fallback both scored TP/TN/FP/FN **5/500/0/495**, accuracy **50.50%**, recall **1%**. On 39 independent controlled URLs, both scored **16/17/2/4**, accuracy **84.62%**. Identical results are expected here: no message text, trusted registry, live metadata or AI outcome was supplied. This is not a full AI-assisted accuracy benchmark.

**Actual full-hybrid spot checks:** four fresh UI inferences completed in the preview: English bank information → Low/score 20; English Salik payment/OTP intimidation → Critical/90; Arabic TAMM information → Low/30; Arabic Emirates ID document/credential threat → Critical/90. Tiny-set TP/TN/FP/FN **2/2/0/0** at combined score ≥50, excluding uncertainty labels. The synthetic inputs were predefined before inference, contain no real passwords/OTPs and no reports were submitted. Both languages rendered actual output. This N=4 observation cannot establish 98–99% performance. Existing usage protections remain 5/visitor/10 minutes and 200/day; 500 full inferences exceed the daily ceiling and would require an approved multi-day evaluation plan and credit budget, not limiter bypass.

No post-test prompt/rule tuning, simulated model success or inference replay was used. Safe redirect/shortener expansion, live webpage/cloaking and TLS inspection remain blocked by scanner/transport/privacy prerequisites. Current published application was checked and does not yet use Phase 1B. Accounts/passwords/roles were untouched. Full evidence, source limitations and failure lists are in `docs/PHASE_1B_REPORT.md` and `TEST_REPORT.md`.

## Phase 1 URL addendum — 24 November 2026

This addendum supersedes historical counts/scope statements below. This phase adds deterministic local URL inspection and optional live RDAP, **not a new model or browsing agent**. Public-suffix parsing, limited homoglyph/lookalike detection, IP/URL syntax and sensitive-pattern signals are rules. Official references establish domain boundaries only; simulated approvals are not genuine verification. Registration metadata comes from actual RDAP providers, not model claims.

The model remains **OpenAI `openai/gpt-6.1-sol` through Lovable AI Gateway**, with existing server-only prompts, redaction, 2,400-output-token cap, strict schema, grounding, fallbacks and atomic quotas (five checks/visitor/ten minutes, 200 globally/day). No account, credential, permission, case or model setting changed.

AI remains opt-in. Separate RDAP consent transmits only the registrable domain to fixed providers, excluding message/path/query. Local results survive AI/RDAP failure. Missing registry entries are not fraud verdicts. Redirects, page content and cloaking remain **unverified**; no submitted URL is opened.

The displayed 0–100 combined score takes the bounded maximum of existing deterministic assessment, mapped AI severity (0/40/65/90) and flagged-indicator score 65. It is **not a calibrated probability**. Registry facts, technical observations and AI interpretations keep distinct explanations; low risk does not certify safety/authenticity.

Two actual opt-in preview inferences completed on 24 November 2026: English synthetic UAE PASS password/OTP lure → **Critical**; Arabic informational text with the official ADCB contact URL → **Low**. Real bilingual output, grounded supplied indicators and safety actions were inspected. These functional spot checks are not an AI accuracy dataset; no private credentials or report/case submissions were used.

The held-out synthetic benchmark measures **local deterministic URL classification only**, excluding AI/registry/RDAP: precision 95.45%, recall 87.50%, F1 91.30%, false-positive rate 4.17%, accuracy 91.67%. There is no before/after production accuracy or independently labelled real-world performance claim. Full confusion counts, errors and limitations are in `TEST_REPORT.md` and `docs/url-evaluation-results.json`.

## Actual inference

- **Provider/model:** OpenAI `openai/gpt-6.1-sol`, through the managed Lovable AI Gateway Responses surface. Workspace discovery returned `workspace_models: included`; the selected surface has zero-provider-retention status in that catalog.
- **Public server function:** `analyzePrivateMessage` in `src/lib/services/ai-analysis.functions.ts`.
- **Actual model call:** `inferFraud` in `src/lib/services/ai-analysis.server.ts` calls SDK `generateResponse`, with strict JSON output, no tools or browsing, and a 2,400-output-token cap. The generated SDK contract is retained in source. There is no simulated success path.
- Six real server-side inference examples succeeded: Arabic bank impersonation **High**; English delivery scam **High**; fake government payment **High**; deceptive shopping offer **High**; benign library message **Low**; a message containing fictional shared IP `203.0.113.45` **High**, with that IP extracted.
- Additional live Public Trust Portal calls succeeded, including a registered `FALCONBANK` sender with suspicious content and real Arabic/mobile rendering. Registry status stayed Verified Channel while overall semantic risk was High.

## Preserved behavior and privacy

- The deterministic engine `verification.ts`, original colors, navigation, typography, Organization Portal, public alerts, Security Dashboard page, and investigation graph source are unchanged. No accounts or test users were created, and no roles were granted or altered.
- AI is explicitly optional. The existing form remains, with AI findings integrated into its existing result area. Registry facts, deterministic/keyword warnings, and AI interpretations have separate labels. AI does not establish authenticity or criminal conduct; risk categories are not calibrated probabilities.
- Client-side minimization is repeated on the server: credential-labelled values, common OTP/financial/identity-number patterns, labelled personal data, URL credentials, query strings and fragments are redacted. Attachments and identity documents are not accepted by the inference endpoint. Automatic redaction is not guaranteed to identify every secret or person, so the form asks visitors to remove unnecessary sensitive details.
- Private messages/results remain component-local. Inference does not save them. A random HttpOnly, same-site visitor cookie contains only a usage identifier; only its hash is stored with private counters. Only an explicit report stores submitted content and extracted indicators in restricted report records.
- No credential, inference prompt, raw secret, or case identifier was found in the inspected frontend inference traffic/modules. Example password and OTP values were removed before transmission to the analysis server function.

## Indicator correlation and human oversight

- Model indicators must be exact, type-valid, bounded matches in supplied redacted text. Invented indicators and embedded host suffixes are rejected; results are deduplicated using existing investigation keys.
- `flagged_ai_indicator_values` returns only submitted values matching the same indicator type and normalized value in actual escalated/confirmed case records. Public checks of `203.0.113.45` returned a general safety-match explanation, never TZ-1042/TZ-1043 or case evidence.
- `correlatePrivateIndicators` uses existing server authentication and security-role authorization, reads only the caller's restricted workspace, and reuses the existing investigation index. Case identifiers/statuses appear only to authorized staff, and every relationship remains a human-review lead.
- Unit tests correlated the original shared IP with existing fictional TZ-1042 and TZ-1043. A live explicit public report saved exactly the extracted IP; that temporary test report was verified and removed without changing existing records. The existing report-ingestion path includes grounded extracted indicators in its ordinary graph data; AI alone never automatically submits, confirms, or escalates a case, and existing heuristic case-scoring rules remain unchanged.

## Limits and tests

- Owner-approved limits: **five requests per anonymous browser visitor in a rolling ten-minute window**, **200 reservations per UTC day globally**. A service-only atomic database function reserves usage before inference, with a shared lock preventing concurrent overspend. Failed calls consume their reservation; usage-service failure stops inference but retains the heuristic fallback.
- Limits are attached to an anonymous browser identifier, not authenticated identity. Clearing/replacing cookies can reset the per-visitor bucket; the independent global daily ceiling remains the hard request-count backstop. This is the approved custom implementation, not a standard Cloud rate-limiting service.
- **99 regression/unit tests pass**, including existing verification, organization approvals, roles, alerts, and investigation tests. Transactional database tests passed for request 5/6, rolling expiry, daily request 200/201, service-only privileges, and correct/wrong indicator-type matches. Their counter changes were rolled back.
- Live checks passed for real inference, registered-sender suspicious content, shared-IP public matching, explicit restricted reporting, separate-page isolation, reload clearing, secret redaction, anonymous private-workspace denial, anonymous correlation denial, and denial of public usage reservation.
- Live usage-limit and simulated transport-outage checks both retained clearly labelled rule-based results; no inference replay was added. Arabic RTL and AI rendering were verified with no runtime errors. An existing approximately 5px Arabic mobile header overflow remains unchanged; it originates in the pre-existing navigation, not the AI result area.
- Latest observed application build: **OK**.

## Remaining limitations and costs

- There is no currently authorized security-staff account/session available for a positive signed-in correlation/report-to-graph walkthrough. Creating accounts or changing roles was expressly prohibited. Server denial, RLS privileges, existing matching logic and report storage were tested; positive staff end-to-end rendering remains unverified.
- Model explanations can be wrong, and grounded extraction can miss or reject relevant indicators. No URL browsing, cryptographic message authentication, continuous domain monitoring, or calibrated fraud prediction was added.
- Requests consume existing workspace AI credits. Discovery listed approximately **0.008 credits per 1,000 uncached input tokens** and **0.04 credits per 1,000 output tokens** at the normal short-context tier. Actual cost depends on tokens and current workspace pricing; 200 requests is a request ceiling, not a currency budget. No external provider key or new subscription was required.