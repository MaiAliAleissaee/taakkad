import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

interface EmailRequestServices {
  receiptIdentity(reference: string, secret: string): Promise<{ application_id: string; email: string }>;
  beginCode(id: string): Promise<boolean>;
  sendCode(email: string): Promise<boolean>;
}

/** Receipt possession never proves ownership of its visitor-supplied email. */
export async function requestRecipientOwnedCode(
  client: SupabaseClient<Database>,
  token: string,
  userId: string,
  receipt: { reference: string; secret: string },
  services: EmailRequestServices,
) {
  if (!token) throw new Error("Verified recipient sign-in required");
  const active = await client.rpc("has_active_app_session");
  if (active.error || active.data !== true) throw new Error("Verified recipient sign-in required");
  const identity = await client.auth.getUser(token);
  const user = identity.data.user;
  if (identity.error || !user || user.id !== userId || !user.email_confirmed_at || !user.email) {
    throw new Error("Verified recipient sign-in required");
  }
  const ownEmail = user.email.trim().toLowerCase();
  const application = await services.receiptIdentity(receipt.reference, receipt.secret);
  if (application.email.trim().toLowerCase() !== ownEmail) throw new Error("Verified recipient sign-in required");
  if (!await services.beginCode(application.application_id)) throw new Error("Wait before requesting another code");
  // Always send to Cloud Auth's independently confirmed identity, never the submitted address.
  if (!await services.sendCode(ownEmail)) throw new Error("Email code unavailable; retry later");
  return { sent: true as const };
}