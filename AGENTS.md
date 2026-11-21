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
