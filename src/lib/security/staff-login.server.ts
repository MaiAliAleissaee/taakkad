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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const address = getRequestHeader("cf-connecting-ip") ?? "shared-preview";
  for (const value of [address, identifier]) {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
    const result = await supabaseAdmin.rpc("organization_rate_limit", { bucket_key: `staff-${kind}:${hash}`, max_requests: kind === "setup" ? 3 : 10, window_seconds: 3600 });
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