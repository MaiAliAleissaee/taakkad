import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { setResponseHeader } from "@tanstack/react-start/server";
import type { Json } from "@/integrations/supabase/types";
import { z } from "zod";
import { demoRegistrationSchema, demoTrackingSchema, demoRecoverySchema, demoPayload, demoTrackingResultSchema } from "./demo-schema";

export const submitDemoOrganization = createServerFn({ method: "POST" })
  .inputValidator(input => demoRegistrationSchema.parse(input))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const { trackingRateLimit } = await import("./tracking.server");
    await trackingRateLimit("demo-registration", 10);
    const { newDemoReceiptSecret } = await import("./demo-receipt.server");
    const receipt = await newDemoReceiptSecret();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("submit_secure_demo_organization", { application_payload: demoPayload(data) as unknown as Json, receipt_hash: receipt.hash });
    if (result.error || !result.data) throw new Error("Demo registration unavailable");
    const saved = await supabaseAdmin.rpc("read_secure_demo_tracking", { tracking_code: result.data, receipt_hash: receipt.hash });
    const tracking = demoTrackingResultSchema.parse(saved.data);
    return { code: result.data, secret: receipt.secret, status: "pending" as const, updatedAt: tracking.updatedAt };
  });

export const trackDemoOrganization = createServerFn({ method: "POST" })
  .inputValidator(input => demoTrackingSchema.parse(input))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const { trackingRateLimit, hashTrackingSecret } = await import("./tracking.server");
    await trackingRateLimit("demo-status", 20);
    // Shared ceiling limits distributed guessing as well as the per-address budget.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const budget = await supabaseAdmin.rpc("organization_rate_limit", { bucket_key: "demo-status-global", max_requests: 1000, window_seconds: 3600 });
    if (budget.error || !budget.data) throw new Error("Status lookup temporarily unavailable");
    const result = await supabaseAdmin.rpc("read_secure_demo_tracking", { tracking_code: data.code, receipt_hash: await hashTrackingSecret(data.secret) });
    if (result.error) throw new Error("Status lookup unavailable");
    const resultData = demoTrackingResultSchema.nullable().parse(result.data);
    return { code: data.code, status: resultData?.status ?? null, updatedAt: resultData?.updatedAt ?? null };
  });

export const recoverDemoReceipt = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => demoRecoverySchema.parse(input))
  .handler(async ({ context, data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const { authorizeReceiptRecovery, newDemoReceiptSecret } = await import("./demo-receipt.server");
    await authorizeReceiptRecovery(context.supabase, data.id);
    const { trackingRateLimit } = await import("./tracking.server");
    await trackingRateLimit("demo-receipt-recovery", 10);
    const receipt = await newDemoReceiptSecret();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("recover_demo_tracking_receipt", { actor_id: context.userId, application_uuid: data.id, receipt_hash: receipt.hash, review_note: data.note, identity_confirmed: data.confirmed });
    if (result.error || !result.data) throw new Error("Recovery denied");
    return { code: result.data, secret: receipt.secret };
  });

export const reviewDemoOrganization = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid(), revision: z.number().int().nonnegative(), decision: z.enum(["under_review", "approved", "rejected", "needs_information"]), note: z.string().trim().max(1000) }).refine(value => value.decision === "under_review" || value.note.length > 0).parse(input))
  .handler(async ({ context, data }) => {
    const { applicationIdentity } = await import("./applications.server");
    const identity = await applicationIdentity(context.supabase);
    if (!identity.officer) throw new Error("Officer required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("review_demo_organization", { actor_id: identity.userId, application_uuid: data.id, expected_revision: data.revision, decision: data.decision, decision_note: data.note });
    if (result.error) {
      console.error("Demo review failed", { code: result.error.code, message: result.error.message });
      throw new Error("Review denied or application changed");
    }
    return { ok: true };
  });

const publicDemoSchema = z.object({ application_id: z.string().uuid(), name: z.object({ ar: z.string(), en: z.string() }), channels: z.array(z.object({ type: z.enum(["email", "website", "social", "phone", "sms"]), value: z.string(), status: z.literal("simulated") })) });
export const readDemoRegistry = createServerFn({ method: "GET" }).handler(async () => {
  const { emailCodeClient } = await import("./tracking.server");
  const result = await emailCodeClient().from("organization_demo_registry").select("application_id,name,channels").eq("approved", true).eq("simulated", true);
  if (result.error) throw new Error("Demo registry unavailable");
  return z.array(publicDemoSchema).parse(result.data);
});