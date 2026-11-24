import { createClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";

export function staffAuthClient() {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("Authentication unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key); return fetch(input, { ...init, headers });
  } } });
}

export async function staffAttemptLimit(identifier: string, kind: string) {
  const requestAddress = getRequestHeader("cf-connecting-ip");
  // Public login/recovery must never charge the owner of an unverified username.
  // Deny requests without the hosting-provided address instead of sharing a global fallback.
  const callerOnly = kind === "setup" || kind === "login";
  if (callerOnly && !requestAddress) throw new Error("Authentication unavailable");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const address = requestAddress ?? "shared-preview";
  // Ten login attempts per caller across ALL usernames prevents username rotation bypass.
  // Private setup-link limits retain their additional secret-specific counter.
  const values = callerOnly ? [address] : [address, identifier];
  for (const value of values) {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
    // New namespace also prevents old identifier/shared-preview counters blocking recovery.
    const bucket = callerOnly ? `staff-${kind}-caller:${hash}` : `staff-${kind}:${hash}`;
    const result = await supabaseAdmin.rpc("organization_rate_limit", { bucket_key: bucket, max_requests: kind === "setup" ? 3 : 10, window_seconds: 3600 });
    if (result.error || !result.data) throw new Error("Authentication unavailable");
  }
}

// Never return a mapping to an unauthenticated caller. Resolve only to perform Auth operations.
export async function staffEmail(identifier: string) {
  if (identifier.includes("@")) return identifier;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const row = await supabaseAdmin.from("staff_login_identifiers").select("user_id").eq("staff_id", identifier).maybeSingle();
  if (row.error || !row.data) return null;
  const user = await supabaseAdmin.auth.admin.getUserById(row.data.user_id);
  return user.data.user?.email_confirmed_at ? user.data.user.email ?? null : null;
}