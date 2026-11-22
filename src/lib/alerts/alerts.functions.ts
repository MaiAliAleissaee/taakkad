import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { alertCommandSchema, alertContentSchema, type ManagedAlert, type PublicAlert } from "./schema";

export const listPublishedAlerts = createServerFn({ method: "GET" }).handler(async (): Promise<PublicAlert[]> => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]; const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Alerts unavailable");
  const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization"); headers.set("apikey", key); return fetch(input, { ...init, headers }); } } });
  const result = await client.from("public_security_alerts").select("id,content,published_at").order("published_at", { ascending: false }).order("id");
  if (result.error) throw new Error("Alerts unavailable");
  return result.data.map(row => ({ id: row.id as string, content: alertContentSchema.parse(row.content), published_at: row.published_at as string }));
});
export const listManagedAlerts = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { securityIdentity } = await import("@/lib/security/authorization.server"); await securityIdentity(context.supabase);
  const [rows, audit] = await Promise.all([context.supabase.from("security_bulletins").select("*").order("id"), context.supabase.from("security_bulletin_audit").select("bulletin_id,action,note,at").order("at", { ascending: false })]);
  if (rows.error || audit.error) throw new Error("Alert management unavailable");
  return { alerts: rows.data.map(row => ({ ...row, content: alertContentSchema.parse(row.content) })) as ManagedAlert[], audit: audit.data };
});
export const manageAlert = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => alertCommandSchema.parse(input)).handler(async ({ context, data }) => {
  const { securityIdentity } = await import("@/lib/security/authorization.server"); await securityIdentity(context.supabase);
  const result = await context.supabase.rpc("manage_security_bulletin", { ...(data.id ? { bulletin_id: data.id } : {}), ...(data.revision !== undefined ? { expected_revision: data.revision } : {}), operation: data.action, ...(data.content ? { public_content: JSON.parse(JSON.stringify(data.content)) } : {}), decision_note: data.note, privacy_reviewed: data.privacyReviewed });
  if (result.error) throw new Error("Action denied or alert changed. Check permissions, independent review and the current status.");
  return result.data;
});