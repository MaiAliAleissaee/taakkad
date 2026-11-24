# Taakkad — Phase 4: UAE Relevance and Innovation

24 November 2026. Phase 5 not started. No credentials, roles, permissions, migrations, dependencies, model artifacts, existing records or palette/layout were changed.

## Audit against the supplied requirements

The user's supplied UAE hackathon requirements are the audit baseline; no separate official judging rubric was supplied. Existing functionality was reused rather than rebuilt.

| Requirement | Existing capability | Meaningful Phase 4 improvement |
|---|---|---|
| Government/bank impersonation | Curated UAE official domains; boundary checks, bank/government lookalikes, IDN/Punycode, URL rules and frozen local URL ML | Visible reference provenance and independent-verification guidance; rechecked government source links; no new implicit channel approval |
| UAE PASS, TAMM, traffic, delivery, payment | General URL/content rules; fictional bank, delivery and traffic examples | Seven additional fictional UAE scenarios, including unsolicited UAE PASS approval, TAMM renewal, mixed-language bank support and benign service discussion; scenario-specific prevention guidance |
| Emirati dialect, Arabic, English, mixed language | General bilingual keywords and optional authenticated semantic AI | Explainable free local request cues for طرشلي الكود, عطنا OTP, الحين, حول … درهم, and unsolicited approval instructions; Arabic diacritic/alef/digit normalization |
| UAE phone/channel verification | Punctuation normalization and explicit active-approved registry channels | Shared UAE national/+971/00971 and Arabic/Persian digit normalization; mobile/landline and domestic service-number handling; source-linked UAE PASS help-desk reference stays separate from registry verification |
| Cross-report domain/phone/email linking | Private type-aware investigation graph, intelligence correlation and evidence-package links | Equivalent UAE phone formats now share keys everywhere; explicit body phone/email/URL contacts extracted locally and deduplicated; legacy report linking corrected to use type-aware keys |
| Bilingual police/public guidance | Generic safety advice and human-confirmed preparation actions | Scenario-linked prevention and police review guidance in public results and private evidence views/JSON/print reports; external submission still never automatic |
| Visual impersonation | URL Unicode/homoglyph cues; private staff screenshot attachments and printable image evidence | Assessment and clear limitation wording only: no OCR, logo/pixel similarity, screenshot classifier or computer-vision inference |

## Official references: actual verification performed

Only preselected official/reference pages were retrieved; submitted/demo/suspicious websites were not visited.

- [UAE Government — UAE PASS](https://u.ae/en/about-the-uae/digital-uae/digital-transformation/platforms-and-apps/the-uae-pass-app): live HTTP 200; links under uaepass.ae and published help-desk 600 561 111 present.
- [UAE Government — Abu Dhabi Digital / TAMM](https://u.ae/en/about-the-uae/digital-uae/digital-cities/smart-abu-dhabi): live HTTP 200; TAMM official website links present.
- [UAE Government — Road safety](https://u.ae/en/information-and-services/justice-safety-and-the-law/safety/road-safety): live HTTP 200; MOI, Abu Dhabi Police, Dubai Police and RTA fine-service links present.
- [TDRA — Porting numbers](https://tdra.gov.ae/en/consumer-tool-hub/topics/porting-numbers): official indexed page lists mobile prefixes 050/052/054/055/056/058 and explains portability. This is numbering-format evidence, not carrier/ownership verification.
- [ADCB — Protecting your banking information](https://www.adcb.com/en/consumer-education-awareness/fraud-awareness/protecting-your-banking-information) and [phone fraud](https://www.adcb.com/en/security-tips/be-aware-phone-fraud/): indexed official content retrieved with prevention/caller-ID guidance; direct requests returned HTTP 403. Live bank page fetch is therefore NOT VERIFIED; no bypass attempted. No new bank number/email/SMS approval was introduced.
- Existing broader bank/reference catalog retained; not every retained reference was refetched. No partnerships, live banking/police integrations or official endorsement are claimed.

## Detection and privacy boundaries

- New language cues are deterministic heuristics, not additional trained NLP or a demonstrated Emirati-language accuracy result. They may miss paraphrases, Arabizi, audio and complex negation. The new cue helper excludes simple negative prevention clauses; it does not claim complete contextual negation handling of every legacy keyword rule.
- Scenario names alone never produce a fraud verdict. Ordinary UAE PASS/TAMM discussion remains unverified rather than suspicious. Existing registry facts and model risk semantics stay distinct.
- Equivalent phone formats can match only the existing individually active-approved channel. Revoked channels still cannot grant verification. A matching published help desk is reference information only: caller-ID spoofing remains possible.
- Body extraction uses explicit supplied UAE phone formats, emails and HTTP(S) links only; OTPs and Emirates IDs are not classified as contacts. Bounded input/contact counts and the existing 60-candidate public matching cap remain. No free text goes into lookup candidates; content is shared only via explicit reporting or separately requested authenticated semantic inference.
- Stored report values and original evidence are not rewritten; shared keys normalize comparisons in memory. Existing private workspace ownership checks, public value-only response contract, rate limits, visit-local checks, receipt secrets and human approval stay in force.
- Generic delivery domains are not declared official carriers or fraudulent by name alone. Official-domain recognition does not authenticate an individual message, mailbox, SMS sender or caller.
- All seven new examples use reserved .example links and synthetic sender labels; none is a precomputed detection result. No UAE-like demonstration phone is asserted to be reserved or safe to contact.

## Actual verification

- Targeted tests: **85 PASS**, five files including 39 new UAE rule tests. Covers normalization, all six mobile prefixes, standard Arabic/English/mixed requests, benign mentions, boundary tricks, approved/revoked channel behavior, bounded candidates, typed linking and evidence provenance.
- Anonymous live preview: **PASS** actual Arabic UAE PASS request produced local warnings; English WhatsApp phone normalization displayed +971500000000; benign UAE service discussion remained Unverified. Fictional examples visible. Viewports 835×754 and 390×844 inspected; no horizontal mobile overflow or page exceptions. No paid AI requests or suspicious-domain network requests observed. The first browser script's language-button selector failed after the successful Arabic check; the follow-up used its observed visible button text and completed the remaining checks without repeating paid inference or benchmarks.
- Single final regression: **373/374 initially PASS**; one old ten-example count expected 10 rather than the preserved 10 plus seven new examples. Corrected that expectation and rechecked **only the failing test: PASS**, six already-completed tests skipped. All 374 tests have passing execution evidence across the full run and that focused correction; a second full suite was deliberately not run.
- Managed preview builds: latest observed **build OK**. No manual production build or actual production execution claimed.
- Actual authenticated staff guidance/package readback: **NOT VERIFIED**; usable owner preview sign-in is not indicated. Existing staff accounts/credentials unchanged; no replacement test account or role bypass introduced.
- Visual screenshot classification: **UNAVAILABLE**, not a hidden or simulated classifier. Human review can use existing private uploaded screenshots and printed originals; SHA-256 establishes byte integrity only.
- New benchmarks/retraining/model calls: **NONE**. No paid API or dependency added.

## Security and publication

The ongoing deep scan completed at 11:02 UTC. It reported:

1. **Legacy applicant email verification abuse**, `lov_finding_51281c83e3817d68`: originally critical because visitor-created applications could trigger codes to visitor-selected addresses. Following explicit owner approval, the code-request function now requires authenticated middleware, a current active Cloud session, server-validated confirmed email and exact recipient match to the existing private receipt. The outgoing recipient is taken from the confirmed Cloud identity, not the submitted address; resend cannot create accounts (`shouldCreateUser: false`). Existing receipt/email-code/read/edit behavior and cooldown remain, but requesting a legacy email code now requires prior recipient sign-in. Anonymous six-field demo registration/status tracking, public checks and reporting stay unchanged. No existing account, grant, role, password or application record changed. Finding marked fixed through management after scoped verification.
2. A reappearing demo tracking warning, `lov_finding_d348ca49623130c0`: current code already requires the private random receipt secret plus reference. Read-only live grants confirmed number-only access is denied to anonymous, authenticated and service roles; direct secure helper access is also denied to anonymous callers and the receipt hash field exists. Existing prior targeted security tests are retained, not rerun. The previously approved finding was marked fixed again through finding management; the five-digit display reference itself was not replaced.

Post-approval verification: **20 targeted tests PASS**, including ten new recipient-authorization tests and ten preserved application-access tests. Missing/revoked session, unconfirmed email, inconsistent identity, third-party recipient, invalid receipt and cooldown denial prevent email sending; matching confirmed recipient and receipt succeed using mocked services. The actual anonymous server endpoint rejects before email requests; public demo tracker remains visible; no hosted OTP request or browser exception observed. Genuine recipient sign-in, inbox delivery and code completion remain **NOT VERIFIED**, with no test account or email send introduced. Previous full regression and UAE tests were not repeated. Managed preview build remains **build OK**.

Fresh quick scan at 11:18 UTC returns only the unchanged informational public organization registry finding; finding management shows no unresolved critical finding. Publication is **NOT REQUESTED yet**, pending a fresh deep scan of the saved Phase 4 and recipient-authorization changes. No additional model calls, benchmarks, database changes or paid services were used.

Phase 3 implementation remains intact but publication/live staff verification still pending. Phase 5 was not started.

## Changed source areas

- Shared local UAE phone/cue/context helpers, tests and original-example count regression.
- Public trust results and fictional examples, with the existing design preserved.
- Shared channel/investigation/report key handling and explicit local text-indicator extraction.
- Private evidence guidance and JSON/print output; no evidence-access or approval handler changed.
- This report, roadmap and one architectural boundary rule.