import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import { applicationGrantSchema, documentsSchema, registrationSchema, trackingCredentialsSchema } from "./schema";

export const submitTrackedApplication = createServerFn({ method: "POST" })
  .inputValidator(input => z.object({ registration: registrationSchema, documents: documentsSchema, trackingEmail: z.string().trim().email().max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { trackingRateLimit, randomTrackingSecret, hashTrackingSecret } = await import("./tracking.server");
    await trackingRateLimit("submit", 10);
    const { validateApplication, pendingOrganization } = await import("./applications.server");
    await validateApplication(data.registration);
    const secret = randomTrackingSecret();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("create_tracked_application", { application_payload: pendingOrganization(data.registration) as unknown as Json, application_documents: data.documents as unknown as Json, tracking_hash: await hashTrackingSecret(secret), tracking_email: data.trackingEmail.toLowerCase() });
    if (result.error) throw new Error("Application could not be saved");
    const row = await supabaseAdmin.from("organization_applications").select("submitted_at").eq("id", result.data).single();
    if (row.error) throw new Error("Receipt unavailable");
    return { id: result.data, reference: `TZ-ORG-${result.data.toUpperCase()}`, secret, submittedAt: row.data.submitted_at, status: "pending" as const };
  });

export const requestApplicationCode = createServerFn({ method: "POST" }).inputValidator(input => trackingCredentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const { trackingRateLimit, trackingIdentity, emailCodeClient } = await import("./tracking.server");
    await trackingRateLimit("request-code", 20);
    const identity = await trackingIdentity(data.reference, data.secret);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const permitted = await supabaseAdmin.rpc("begin_application_code", { application_uuid: identity.application_id });
    if (permitted.error || !permitted.data) throw new Error("Wait before requesting another code");
    // Standard hosted OTP; no password or account-registration form. An email identity is managed by Cloud Auth.
    const result = await emailCodeClient().auth.signInWithOtp({ email: identity.email, options: { shouldCreateUser: true } });
    if (result.error) throw new Error("Email code unavailable; check email sending and retry later");
    return { sent: true };
  });

export const verifyApplicationCode = createServerFn({ method: "POST" })
  .inputValidator(input => trackingCredentialsSchema.extend({ code: z.string().regex(/^\d{6,8}$/) }).parse(input))
  .handler(async ({ data }) => {
    const { trackingRateLimit, trackingIdentity, emailCodeClient, randomTrackingSecret, hashTrackingSecret } = await import("./tracking.server");
    await trackingRateLimit("verify-code", 30);
    const identity = await trackingIdentity(data.reference, data.secret);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const attempt = await supabaseAdmin.rpc("attempt_application_code", { application_uuid: identity.application_id });
    if (attempt.error || !attempt.data) throw new Error("Code expired or too many attempts");
    const checked = await emailCodeClient().auth.verifyOtp({ email: identity.email, token: data.code, type: "email" });
    if (checked.error || !checked.data.user?.email_confirmed_at || checked.data.user.email?.toLowerCase() !== identity.email.toLowerCase()) throw new Error("Invalid email code");
    const token = randomTrackingSecret();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const grant = await supabaseAdmin.from("organization_application_grants").insert({ token_hash: await hashTrackingSecret(token), application_id: identity.application_id, expires_at: expiresAt });
    if (grant.error) throw new Error("Verification unavailable");
    return { id: identity.application_id, token, expiresAt };
  });

export const readTrackedApplication = createServerFn({ method: "POST" }).inputValidator(input => applicationGrantSchema.parse(input))
  .handler(async ({ data }) => {
    const { trackedApplication } = await import("./tracking.server");
    const row = await trackedApplication(data.id, data.token);
    const { organizationPayload } = await import("./applications.server");
    // No internal audit history, staff identities or applicant credentials leave this applicant endpoint.
    return { id: row.id, revision: row.revision, status: row.status, payload: organizationPayload(row.payload), documents: row.documents, correctionNote: row.correction_note, submittedAt: row.submitted_at, now: new Date().toISOString(), reference: `TZ-ORG-${row.id.toUpperCase()}` };
  });

export const editTrackedApplication = createServerFn({ method: "POST" })
  .inputValidator(input => applicationGrantSchema.extend({ revision: z.number().int().nonnegative(), registration: registrationSchema, documents: documentsSchema }).parse(input))
  .handler(async ({ data }) => {
    const { trackedApplication, trackingRateLimit } = await import("./tracking.server");
    await trackingRateLimit("edit", 30);
    const row = await trackedApplication(data.id, data.token);
    const { validateApplication, pendingOrganization, organizationPayload, assertOwnerEdit, commitApplication } = await import("./applications.server");
    assertOwnerEdit(row, row.owner_id);
    await validateApplication(data.registration, row.organization_id);
    await commitApplication({ userId: row.owner_id, id: row.id, operation: "edit", revision: data.revision, payload: pendingOrganization(data.registration, organizationPayload(row.payload)), documents: data.documents, status: "pending" });
    return { reference: `TZ-ORG-${row.id.toUpperCase()}` };
  });