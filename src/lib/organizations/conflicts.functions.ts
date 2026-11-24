import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { z } from "zod";
import { conflictReviewSchema } from "./relationship";

export const readOrganizationConflicts = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid() }).strict().parse(input))
  .handler(async ({ context, data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const { readIdentityConflicts } = await import("./conflicts.server");
    return readIdentityConflicts(context.supabase, data.id);
  });
export const resolveOrganizationConflicts = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => conflictReviewSchema.parse(input))
  .handler(async ({ context, data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const result = await context.supabase.rpc("resolve_organization_identity_conflicts", { application_uuid: data.id, expected_revision: data.revision, review_note: data.note, explanation_reviewed: data.explanationReviewed, evidence_reviewed: data.evidenceReviewed });
    if (result.error) throw new Error("conflict_review_denied_or_changed");
    return { ok: true };
  });
export const refreshOrganizationTechnical = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid(), revision: z.number().int().nonnegative() }).strict().parse(input))
  .handler(async ({ context, data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const { readIdentityConflicts, collectIdentityMetadata } = await import("./conflicts.server");
    await readIdentityConflicts(context.supabase, data.id);
    const { applicationIdentity, getApplication, organizationPayload } = await import("./applications.server");
    const identity = await applicationIdentity(context.supabase);
    const row = await getApplication(context.supabase, data.id);
    if (!identity.officer || row.owner_id === identity.userId || row.revision !== data.revision) throw new Error("Independent current officer required");
    const contact = await context.supabase.rpc("officer_is_application_contact", { application_uuid: data.id });
    if (contact.error || contact.data) throw new Error("Independent officer required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const budget = await supabaseAdmin.rpc("organization_rate_limit", { bucket_key: `identity-metadata:${identity.userId}`, max_requests: 10, window_seconds: 600 });
    if (budget.error || !budget.data) throw new Error("metadata_limit_reached");
    const snapshots = await collectIdentityMetadata(organizationPayload(row.payload).domains);
    const saved = await supabaseAdmin.rpc("save_organization_identity_technical", { actor_id: identity.userId, application_uuid: data.id, expected_revision: data.revision, snapshots: snapshots as unknown as Json });
    if (saved.error) throw new Error("metadata_save_denied_or_changed");
    return { ok: true };
  });