<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Use the shared deterministic date formatter for rendered dates so server and browser ICU versions cannot cause hydration mismatches.
- Pre-optimize dependencies used by lazy portal pages in Vite so first navigation does not invalidate loaded module URLs.
- Derive investigation graphs from the current demo repository with type-aware, deduplicated indicator matches; relationships are human-review leads, never offender attribution.
- Use react-zoom-pan-pinch for the investigation surface so wheel, touch and cursor anchoring share maintained interaction logic.
- Keep demo personas transient and label their permissions as simulations, never authentication; production authorization must be enforced by an authenticated server with roles separate from organization/profile records.
- Route channel changes through the shared transition policy and retain local audit history after removal; pending, edited, rejected, inactive and revoked channels cannot yield positive registry matches.
- Migrate legacy browser records in place instead of resetting the seed version so existing cases, investigation leads and judge edits survive registry upgrades.
- Match email senders and website hosts against explicit active approved channels, not implicit domain-wide approval, so revocation cannot be bypassed by organization domains.
- Keep convenience input recognition and registry-result wording in the presentation layer; they must not alter detection assessments or infer cryptographic message authentication.
- Resolve locale through the shared preference helper and inherit direction in reusable dialogs and notifications to keep navigation, reloads and portal overlays consistent.
- Translate fixed fictional notes and analyst labels at display time without rewriting stored records; visitor-authored free text retains its original language and uses automatic text direction.
- Legacy registration retains its validator; demo registration uses a shared six-field schema so browser/server validation agree.
- Preserve the pre-redesign presentation; security storage may move to Cloud without changing channel policy, detection or investigation semantics.
- Keep legacy accent token names as semantic palette aliases and primary CTAs on the primary token so controlled palette changes do not require restructuring existing screens.
- Store restricted security snapshots in role-gated per-user Cloud workspaces; never bundle private case seeds or write cases to browser storage because UI-only gates do not protect data.
- Archive legacy browser security snapshots transactionally before removing their local copy; preserve organization records, retain newer Cloud review fields, merge missing notes/evidence/indicators and allow owner-scoped archive downloads so no saved work is lost on conflicts.
- Keep staff roles separate from profiles, with no client role grants; authorize every restricted server operation and enforce matching RLS policies.
- Public checks return only submitted flagged values, never case IDs, evidence or relationship lists; public reports are write-only until authorized review.
- Applications and attachments stay private. Legacy capabilities remain intact; demo references return status only, never edit rights. Officer decisions use atomic role-authorized commands with audit.
- The public organization projection contains only approved identity fields and individually active approved channels; merge projections in memory without overwriting legacy browser records so existing saved data survives.
- Demo approvals use a searchable, idempotent simulated projection, never trusted channels; tracking returns only status/date to preserve privacy and trust semantics.
- Keep user-initiated trust checks in component-local memory, outside shared query caches and browser persistence; send only indicator candidates for matching, and share content only through explicit restricted reports so visitors cannot retrieve each other's checks.
- Keep public security bulletins separate from investigation cases; an atomic role-authorized command maintains private audit and the public published-only projection so draft edits, rejection and withdrawal cannot leak confidential content.
- Keep semantic fraud inference in server-only Gateway helpers, redact inputs before transmission and again before inference, validate and ground model indicators in supplied text, and keep registry facts distinct from AI interpretations; this prevents model claims from becoming verification facts.
- Require an active authenticated session only for paid semantic inference; reserve per-user hashed usage atomically before inference and retain the shared daily ceiling. Public rules, local ML, registry and write-only reporting stay anonymous.
- Resolve staff login aliases only inside rate-limited server Auth operations using a service-only profile-linked table; never expose unauthenticated email mappings or infer roles from aliases. Password setup requires a Cloud recovery session and never changes roles.
- Classify sign-in failures by Cloud Auth codes, separately from role authorization; route organization password recovery to the existing staff setup flow so no duplicate recovery endpoint is introduced.
- Email-free staff password setup uses service-issued single-use hashed link secrets in the URL fragment, consumed atomically server-side; links never grant roles, so staff onboarding needs no inbox while authorization stays role-based.
- After staff sign-in, route by role through one shared helper (officers to organization review, analysts to the Security Dashboard) so both sign-in forms agree.
- Officer review lives in the gated /officer workspace; the public Organization Portal keeps only staff sign-in, tracking and registry, so staff and public experiences stay separate.
- Allocate report display numbers through a private permanent year ledger in database triggers; preserve internal IDs and return saved payloads so deletion, reordering and concurrent writes never recycle numbers.
- Analyze URLs locally; follow src/lib/services/url/AGENTS.md for safe metadata and evaluation.
- Validate fictional intelligence .example domains only for explicitly synthetic storage records; retain strict public-domain validation for metadata requests so demo imports never enable network scanning.
- Keep staff evidence in bounded append-only owner-private Cloud records; authorize the subject and active institution-specific session before every operation, compute SHA-256 server-side and recheck before exports so attachments never become publicly accessible or verified-source claims.
- Build evidence packages from authorized server snapshots, separate model outputs from observed facts, and print escaped bilingual text with the browser PDF dialog; exports and human preparation approvals never transmit external requests.
- Guard every non-null public check/report workspace argument with active analyst authorization and caller ownership inside the database; null keeps the public synthetic/check and shared report paths without granting private access.
- Demo tracking requires a server-issued random receipt secret stored only as SHA-256 alongside the unchanged reference; legacy/lost receipts use independently confirmed active-officer recovery with separate security audit, never code-only fallback.
- Resolve saved workspace hints against the current ready analyst session and discard stale hints; server ownership checks remain the authority.
- Keep UAE scenario cues, official reference provenance and phone-format normalization in shared pure local helpers; never turn reference/contact matches into channel approvals or message authentication, and extract only explicitly supplied indicators for private matching.
- Legacy email-code delivery requires an active session, Cloud-confirmed matching recipient and receipt; never send to a visitor-selected third party or create an account while resending, so verification cannot become an outbound-mail proxy.
- Charge public staff login/recovery only to the hosting-provided caller address, never an unverified identifier; fail closed without it to avoid cross-user lockouts.
