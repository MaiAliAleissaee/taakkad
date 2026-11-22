import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { z } from "zod";
import { demoRegistrationSchema, demoTrackingSchema, demoPayload, type DemoStatus } from "./demo-schema";

export const submitDemoOrganization = createServerFn({ method: "POST" })
  .inputValidator(input => demoRegistrationSchema.parse(input))
  .handler(async ({ data }) => {
    const { trackingRateLimit } = await import("./tracking.server");
    await trackingRateLimit("demo-registration", 10);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("submit_demo_organization", { application_payload: demoPayload(data) as unknown as Json });
    if (result.error || !result.data) throw new Error("Demo registration unavailable");
    return { code: result.data, status: "pending" as const };
  });

export const trackDemoOrganization = createServerFn({ method: "POST" })
  .inputValidator(input => demoTrackingSchema.parse(input))
  .handler(async ({ data }) => {
    const { trackingRateLimit } = await import("./tracking.server");
    await trackingRateLimit("demo-status", 20);
    // Shared ceiling limits distributed guessing as well as the per-address budget.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const budget = await supabaseAdmin.rpc("organization_rate_limit", { bucket_key: "demo-status-global", max_requests: 1000, window_seconds: 3600 });
    if (budget.error || !budget.data) throw new Error("Status lookup temporarily unavailable");
    const result = await supabaseAdmin.rpc("read_demo_organization_status", { tracking_code: data.code });
    if (result.error) throw new Error("Status lookup unavailable");
    const status = z.enum(["pending", "under_review", "needs_information", "approved", "rejected"]).nullable().parse(result.data);
    return { status: status as DemoStatus | null };
  });

export const reviewDemoOrganization = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid(), revision: z.number().int().nonnegative(), decision: z.enum(["under_review", "approved", "rejected", "needs_information"]), note: z.string().trim().max(1000) }).refine(value => value.decision === "under_review" || value.note.length > 0).parse(input))
  .handler(async ({ context, data }) => {
    const { applicationIdentity } = await import("./applications.server");
    const identity = await applicationIdentity(context.supabase);
    if (!identity.officer) throw new Error("Officer required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("review_demo_organization", { actor_id: identity.userId, application_uuid: data.id, expected_revision: data.revision, decision: data.decision, decision_note: data.note });
    if (result.error) throw new Error("Review denied or application changed");
    return { ok: true };
  });

const publicDemoSchema = z.object({ application_id: z.string().uuid(), name: z.object({ ar: z.string(), en: z.string() }), channels: z.array(z.object({ type: z.enum(["email", "website", "social", "phone", "sms"]), value: z.string(), status: z.literal("simulated") })) });
export const readDemoRegistry = createServerFn({ method: "GET" }).handler(async () => {
  const { emailCodeClient } = await import("./tracking.server");
  const result = await emailCodeClient().from("organization_demo_registry").select("application_id,name,channels").eq("approved", true).eq("simulated", true);
  if (result.error) throw new Error("Demo registry unavailable");
  return z.array(publicDemoSchema).parse(result.data);
});