import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { documentsSchema, registrationSchema } from "./schema";
import { applyChannelCommand, type ChannelCommand } from "@/lib/services/channels";
import type { DemoState } from "@/lib/domain/types";

export const readOrganizationApplications = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { applicationIdentity, organizationPayload } = await import("./applications.server");
  const identity = await applicationIdentity(context.supabase);
  if (!identity.officer) throw new Error("Verification officer required");
  const result = await context.supabase.from("organization_applications").select("*").order("submitted_at", { ascending: false });
  if (result.error) throw new Error("Applications unavailable");
  // Tracking codes are private mappings; use the service client only after the live officer check.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const codes = await supabaseAdmin.from("organization_demo_tracking").select("application_id,code");
  if (codes.error) throw new Error("Tracking references unavailable");
  return { officer: identity.officer, userId: identity.userId, now: new Date().toISOString(), applications: result.data.map(r => ({ ...r, payload: organizationPayload(r.payload), reference: codes.data.find(c => c.application_id === r.id)?.code ?? `TZ-ORG-${r.id.toUpperCase()}` })) };
});

export const saveOrganizationApplication = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid().optional(), revision: z.number().int().nonnegative(), registration: registrationSchema, documents: documentsSchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { applicationIdentity, getApplication, organizationPayload, assertOwnerEdit, validateApplication, pendingOrganization, commitApplication } = await import("./applications.server");
    const identity = await applicationIdentity(context.supabase);
    if (!identity.officer) throw new Error("Use tracking credentials and email verification to edit an application");
    const row = data.id ? await getApplication(context.supabase, data.id) : undefined;
    if (row) assertOwnerEdit(row, identity.userId);
    await validateApplication(data.registration, row?.organization_id);
    const payload = pendingOrganization(data.registration, row ? organizationPayload(row.payload) : undefined);
    const id = await commitApplication({ userId: identity.userId, ...(data.id ? { id: data.id } : {}), operation: row ? "edit" : "create", revision: data.revision, payload, documents: data.documents, status: "pending" });
    return { id, reference: `TZ-ORG-${id.toUpperCase()}` };
  });

export const reviewOrganizationApplication = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), revision: z.number().int(), decision: z.enum(["approved", "rejected", "needs_information", "suspended", "removed"]), note: z.string().trim().min(1).max(1000), domainsConfirmed: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    const { applicationIdentity, getApplication, organizationPayload, commitApplication } = await import("./applications.server");
    const identity = await applicationIdentity(context.supabase);
    if (!identity.officer) throw new Error("Verification officer required");
    const row = await getApplication(context.supabase, data.id);
    if (row.demo_registration) throw new Error("Use simulated demo review");
    if (row.owner_id === identity.userId) throw new Error("Independent officer required");
    const tracking = await context.supabase.rpc("officer_is_application_contact", { application_uuid: row.id });
    if (tracking.error || tracking.data) throw new Error("Independent officer required");
    if (data.decision === "approved" && !data.domainsConfirmed) throw new Error("Domain review required");
    if (data.decision === "approved") {
      const { readIdentityConflicts } = await import("./conflicts.server");
      const conflicts = await readIdentityConflicts(context.supabase, row.id);
      if (conflicts.conflicts.some(c => c.severity === "high") && (!conflicts.resolved || conflicts.review.actor !== identity.userId)) throw new Error("Documented conflict review required");
    }
    const payload = { ...organizationPayload(row.payload), status: data.decision === "approved" ? "verified" as const : data.decision === "suspended" || data.decision === "removed" ? "suspended" as const : "pending" as const };
    await commitApplication({ userId: identity.userId, id: row.id, operation: "review", revision: data.revision, payload, documents: documentsSchema.parse(row.documents), status: data.decision, note: data.note });
    return { ok: true };
  });

const channelCommandSchema = z.object({ action: z.enum(["add", "edit", "submit", "approve", "reject", "deactivate", "revoke", "remove"]), orgId: z.string(), channelId: z.string(), type: z.enum(["phone", "sms", "email", "website", "social", "other"]).optional(), value: z.string().max(200).optional(), note: z.string().max(1000).optional() });
export const changeOrganizationChannel = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), revision: z.number().int(), command: channelCommandSchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { applicationIdentity, getApplication, organizationPayload, assertOwnerEdit, commitApplication } = await import("./applications.server");
    const identity = await applicationIdentity(context.supabase);
    const row = await getApplication(context.supabase, data.id);
    const review = ["approve", "reject", "revoke"].includes(data.command.action);
    if (row.demo_registration) throw new Error("Demo channels are simulated, not individually verified");
    const tracking = await context.supabase.rpc("officer_is_application_contact", { application_uuid: row.id });
    if (tracking.error || tracking.data) throw new Error("Independent officer required");
    if (review ? !identity.officer || row.owner_id === identity.userId : row.owner_id !== identity.userId) throw new Error("Forbidden");
    if (!review) assertOwnerEdit(row, identity.userId);
    const org = organizationPayload(row.payload);
    if (data.command.orgId !== org.id) throw new Error("Wrong organization");
    const state: DemoState = { version: 1, organizations: [org], messages: [], alerts: [], lookalikes: [], channelAudit: [] };
    const next = applyChannelCommand(state, review ? { role: "verifier" } : { role: "org_admin", orgId: org.id }, data.command as ChannelCommand, new Date().toISOString(), crypto.randomUUID());
    const nextOrg = next.organizations[0];
    if (!nextOrg) throw new Error("Organization unavailable");
    await commitApplication({ userId: identity.userId, id: row.id, operation: review ? "officer_channel" : "owner_channel", revision: data.revision, payload: review ? nextOrg : { ...nextOrg, status: "pending" }, documents: documentsSchema.parse(row.documents), status: review ? row.status as "approved" : "pending", details: JSON.parse(JSON.stringify(next.channelAudit)) });
    return { ok: true };
  });