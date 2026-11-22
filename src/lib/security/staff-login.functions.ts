import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { staffIdentifierSchema, staffLoginSchema } from "./staff-login-schema";
import { staffAttemptLimit, staffAuthClient, staffEmail } from "./staff-login.server";

export const signInStaff = createServerFn({ method: "POST" }).inputValidator(input => staffLoginSchema.parse(input)).handler(async ({ data }) => {
  try {
    await staffAttemptLimit(data.identifier, "login");
    const email = await staffEmail(data.identifier);
    const result = await staffAuthClient().auth.signInWithPassword({ email: email ?? "invalid-staff@invalid.local", password: data.password });
    if (!email || result.error || !result.data.session) return { ok: false as const };
    return { ok: true as const, accessToken: result.data.session.access_token, refreshToken: result.data.session.refresh_token };
  } catch { return { ok: false as const }; }
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