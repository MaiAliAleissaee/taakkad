# Taakkad

Arabic-first, bilingual digital identity verification and AI-assisted impersonation detection for a UAE cybersecurity hackathon. **Fictional prototype—not a government service, operational police system or production-ready deployment.** Original navy, white and emerald visual identity is retained.

## Features
- Public, visit-private channel/message checks with optional real AI content analysis, explanations and explicit restricted reporting.
- Private organization registration, one-time tracking secret, email-code verification, original 24-hour edit deadline and officer-requested corrections.
- Independent organization and channel review, private documents/audit and approved-active-only public channels.
- Security Dashboard: Reports, Fraud Connections, Public Security Alerts, Analytics and Reports. Permanent display numbers such as `1/2026` preserve legacy/internal IDs.
- Type-aware investigation graph, shared-indicator leads, deduplicated domain views and correctly labeled documentation IPs.
- Separate staff roles: **HAM123 Officer only; HAM1234 Analyst only.** Passwords stay private. Officer entry is in the Organization Portal.
- Ten fictional reports, ten domain examples, ten existing application records, ten managed bulletins (three published; seven drafts) and ten copyable public examples after the final additive augmentation.

## Architecture and AI
TanStack Start, React 19, TypeScript, Tailwind v4, TanStack Query, maintained zoom/pan interactions and Lovable Cloud. App-internal server functions authenticate staff and enforce role checks; Cloud row-level policies provide a second boundary. Restricted records are not bundled in the client or saved in browser storage.

Real provider/model: **OpenAI `openai/gpt-6.1-sol` through the managed AI Gateway**. Redaction runs in the browser and again server-side before inference. Structured output is validated, indicators are grounded in supplied text and risk is combined with deterministic checks without changing registry facts. Categories are interpretations, not calibrated probabilities. Failures show an honest rule-based fallback. Atomic usage limits: five requests per visitor per rolling ten minutes; 200 daily globally. Resettable visitor cookies do not replace the global cost ceiling.

## Development
Use Bun and a current Node-compatible development environment:
```sh
bun install
bun run dev
bun run test
```
Production packaging uses the existing `bun run build` script and Lovable publishing. Configure Cloud and the managed AI integration through the project; never commit private credentials. Generated Cloud clients/configuration must not be edited manually. The source repository contains the migration history. `scripts/hackathon-demo-data.sql` is an additive, idempotent augmentation for authorized data tools, **not a page-load seed or a complete fresh-backend installer**.

## Security, privacy and limitations
- Public checks remain component-local. Only explicit reports share content and extracted indicators with authorized staff; full private AI explanations are not retained in reports.
- Browser storage contains public preferences/legacy organization samples only; legacy private snapshots are archived before migration.
- No real domain ownership lookup, cryptographic message authentication, live monitoring, takedown or IP geolocation service is connected. Reserved `.example` domains are never opened.
- Publication requires independent Security Supervisor approval; neither demo staff account is a Supervisor. Existing published samples are fictional.
- Applicant tracking requires a reachable mailbox and a received code. Delivery/complete OTP retrieval remains unverified in this pass. Decision notes are available through tracking; decisions do not send email notifications.
- HAM123/HAM1234 password login must be personally confirmed by their owner. Isolated tester login is not evidence of their passwords working.
- No published deployment exists in the supplied project status. Preview is not production validation.

## Handoff
See [DEMO_GUIDE.md](DEMO_GUIDE.md), [ARCHITECTURE.md](ARCHITECTURE.md), [TEST_REPORT.md](TEST_REPORT.md) and [PRESENTATION_OUTLINE.md](PRESENTATION_OUTLINE.md). Proposed future integrations: independently verified domain ownership, mail authentication, consented threat feeds, sourced approximate IP intelligence and production operational governance. These are proposals, not installed services or partnerships.
