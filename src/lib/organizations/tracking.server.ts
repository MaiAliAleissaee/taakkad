import { createClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

export function randomTrackingSecret() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join(""); }
export async function hashTrackingSecret(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join(""); }
export function equalHash(a: string, b: string) { if (a.length !== b.length) return false; let difference = 0; for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i); return difference === 0; }

export function emailCodeClient() {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("Email verification unavailable");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization"); headers.set("apikey", key); return fetch(input, { ...init, headers }); } } });
}
export async function trackingRateLimit(kind: string, max = 10) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const address = getRequestHeader("cf-connecting-ip") ?? "shared-preview";
  const bucket = `${kind}:${await hashTrackingSecret(address)}`;
  const result = await supabaseAdmin.rpc("organization_rate_limit", { bucket_key: bucket, max_requests: max, window_seconds: 3600 });
  if (result.error || !result.data) throw new Error("Too many requests. Try again later.");
}
export async function trackingIdentity(reference: string, secret: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const id = reference.replace(/^TZ-ORG-/i, "").toLowerCase();
  const result = await supabaseAdmin.from("organization_tracking_credentials").select("*").eq("application_id", id).maybeSingle();
  const hashed = await hashTrackingSecret(secret);
  if (result.error || !result.data || !equalHash(result.data.secret_hash, hashed)) throw new Error("Tracking credentials invalid");
  return result.data;
}
export async function trackedApplication(id: string, token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const hashed = await hashTrackingSecret(token);
  const grant = await supabaseAdmin.from("organization_application_grants").select("application_id,expires_at").eq("token_hash", hashed).eq("application_id", id).maybeSingle();
  if (grant.error || !grant.data || Date.parse(grant.data.expires_at) <= Date.now()) throw new Error("Email verification required");
  const row = await supabaseAdmin.from("organization_applications").select("*").eq("id", id).single();
  if (row.error) throw new Error("Application unavailable");
  return row.data;
}