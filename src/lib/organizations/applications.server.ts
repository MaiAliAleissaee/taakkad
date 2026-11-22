import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { Database, Json } from "@/integrations/supabase/types";
import type { Organization } from "@/lib/domain/types";
import { createSeedState } from "@/lib/data/seed";
import { validateRegistration, toChannels, type RegistrationInput } from "@/lib/services/registration";
import { canEditApplication, isVerificationOfficer, type ApplicationDocument, type ApplicationStatus } from "./schema";

export async function applicationIdentity(client: SupabaseClient<Database>) {
  const token = getRequestHeader("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new Error("Unauthorized");
  const result = await client.auth.getUser(token);
  if (result.error || !result.data.user) throw new Error("Unauthorized");
  const roles = await client.from("user_roles").select("role").eq("user_id", result.data.user.id);
  if (roles.error) throw new Error("Access check unavailable");
  return { userId: result.data.user.id, officer: isVerificationOfficer(roles.data.map(r => r.role)) };
}
export async function getApplication(client: SupabaseClient<Database>, id: string) {
  const result = await client.from("organization_applications").select("*").eq("id", id).single();
  if (result.error) throw new Error("Application unavailable");
  return result.data;
}
export function organizationPayload(payload: Json): Organization { return payload as unknown as Organization; }
export async function validateApplication(input: RegistrationInput, excludedId?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.from("organization_applications").select("organization_id,payload");
  if (result.error) throw new Error("Registration check unavailable");
  const stored = result.data.map(r => organizationPayload(r.payload));
  const ids = new Set(stored.map(o => o.id));
  const existing = [...stored, ...createSeedState().organizations.filter(o => !ids.has(o.id))].filter(o => o.id !== excludedId);
  if (validateRegistration(input, existing).length) throw new Error("Registration requires valid, non-conflicting details");
}
export function pendingOrganization(input: RegistrationInput, original?: Organization): Organization {
  const at = original?.registeredAt ?? new Date().toISOString();
  return { id: original?.id ?? "new", name: { en: input.nameEn, ar: input.nameAr }, type: input.type, domains: input.domains, contactEmail: input.contactEmail, status: "pending", registeredAt: at, keyFingerprint: original?.keyFingerprint ?? `DEMO:${crypto.randomUUID()}`, channels: toChannels(input.channels, () => crypto.randomUUID()).map((c, i) => ({ ...c, id: original?.channels[i]?.id ?? c.id, addedAt: original?.channels[i]?.addedAt ?? at, submittedAt: new Date().toISOString() })) };
}
export function assertOwnerEdit(row: Awaited<ReturnType<typeof getApplication>>, userId: string) {
  if (!canEditApplication(row.owner_id, userId, row.submitted_at, row.status as ApplicationStatus, Date.now())) throw new Error("Owner access or editing deadline denied");
}
export async function commitApplication(args: { userId: string; id?: string; operation: string; revision: number; payload: Organization; documents: ApplicationDocument[]; status: ApplicationStatus; note?: string; details?: Json }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.rpc("commit_organization_application", { actor_id: args.userId, application_id: args.id ?? crypto.randomUUID(), operation: args.operation, expected_revision: args.revision, next_payload: args.payload as unknown as Json, next_documents: args.documents as unknown as Json, next_status: args.status, decision_note: args.note ?? "", event_details: args.details ?? {} });
  if (result.error) throw new Error("Change denied or application changed; reload and check the editing deadline");
  return result.data;
}