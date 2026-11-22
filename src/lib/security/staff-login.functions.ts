import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { directPasswordSetupSchema, staffIdentifierSchema, staffLoginSchema } from "./staff-login-schema";
import { staffAttemptLimit, staffAuthClient, staffEmail } from "./staff-login.server";

export const signInStaff = createServerFn({ method: "POST" }).inputValidator(input => staffLoginSchema.parse(input)).handler(async ({ data }) => {
  try {
    try { await staffAttemptLimit(data.identifier, "login"); } catch { return { ok: false as const, reason: "rate_limit" as const }; }
    const email = await staffEmail(data.identifier);
    const result = await staffAuthClient().auth.signInWithPassword({ email: email ?? "invalid-staff@invalid.local", password: data.password });
    if (!email || result.error || !result.data.session) return { ok: false as const, reason: "credentials" as const };
    return { ok: true as const, accessToken: result.data.session.access_token, refreshToken: result.data.session.refresh_token };
  } catch { return { ok: false as const, reason: "unavailable" as const }; }
});

export const requestStaffPasswordSetup = createServerFn({ method: "POST" }).inputValidator(input => z.object({ identifier: staffIdentifierSchema, origin: z.string().url() }).parse(input)).handler(async ({ data }) => {
  try {
    await staffAttemptLimit(data.identifier, "setup");
    const origin = new URL(data.origin);
    if (origin.origin !== data.origin || getRequestHeader("origin") !== data.origin || (origin.protocol !== "https:" && origin.hostname !== "localhost")) return { ok: false };
    const email = await staffEmail(data.identifier);
    if (email) {
      const result = await staffAuthClient().auth.resetPasswordForEmail(email, { redirectTo: `${origin.origin}/reset-password` });
      if (result.error) return { ok: false };
    }
    return { ok: true };
  } catch { return { ok: false }; }
});
// Single-use private setup link: only the server can consume it; the password goes straight to Cloud Auth.
export const completeStaffPasswordSetup = createServerFn({ method: "POST" }).inputValidator(input => directPasswordSetupSchema.parse(input)).handler(async ({ data }) => {
  try {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.token))), b => b.toString(16).padStart(2, "0")).join("");
    try { await staffAttemptLimit(hash, "link"); } catch { return { ok: false as const, reason: "busy" as const }; }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const claimed = await supabaseAdmin.from("staff_password_setup_grants").update({ used_at: now }).eq("token_hash", hash).is("used_at", null).gt("expires_at", now).select("user_id").maybeSingle();
    if (claimed.error || !claimed.data) return { ok: false as const, reason: "invalid" as const };
    const updated = await supabaseAdmin.auth.admin.updateUserById(claimed.data.user_id, { password: data.password });
    if (updated.error) {
      await supabaseAdmin.from("staff_password_setup_grants").update({ used_at: null }).eq("token_hash", hash);
      return { ok: false as const, reason: "busy" as const };
    }
    await supabaseAdmin.from("staff_password_setup_grants").update({ used_at: now }).eq("user_id", claimed.data.user_id).is("used_at", null);
    return { ok: true as const };
  } catch { return { ok: false as const, reason: "busy" as const }; }
});
