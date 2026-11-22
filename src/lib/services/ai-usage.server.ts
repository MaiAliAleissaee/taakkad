import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server";

/** A random HttpOnly browser identifier isolates visitors without storing messages. */
export async function reserveAiUsage(): Promise<boolean> {
  const existing = getCookie("trust-ai-visitor");
  const visitor = existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing) ? existing : crypto.randomUUID();
  setCookie("trust-ai-visitor", visitor, { httpOnly: true, sameSite: "strict", secure: new URL(getRequest().url).protocol === "https:", path: "/", maxAge: 86400 });
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`trust-ai-visitor:${visitor}`));
  const fingerprint = Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, "0")).join("");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.rpc("reserve_trust_ai_usage", { visitor_hash: fingerprint });
  return !result.error && result.data === true;
}