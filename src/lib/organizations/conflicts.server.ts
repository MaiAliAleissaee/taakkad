import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { domainSchema, observationSchema } from "@/lib/intelligence/schema";
import { verifyDomain } from "@/lib/intelligence/metadata.server";
import { z } from "zod";
import { conflictSchema, relationshipSchema } from "./relationship";
import { lookalikeIdentityLeads } from "./identity-matches";

export const conflictResultSchema = z.object({
  conflicts: z.array(conflictSchema), relationship: relationshipSchema.nullable(),
  technical: z.array(z.object({ domain: z.string(), observation: observationSchema.nullable(), unavailable: z.string().nullable() })),
  review: z.object({ actor: z.string().optional(), note: z.string().optional(), at: z.string().optional() }),
  resolved: z.boolean(), revision: z.number().int(),
});
export async function readIdentityConflicts(client: SupabaseClient<Database>, id: string) {
  const result = await client.rpc("read_organization_identity_conflicts", { application_uuid: id });
  if (result.error || !result.data) throw new Error("conflict_access_denied");
  const raw = z.object({ relationship: z.unknown(), resolved: z.boolean().nullable() }).passthrough().parse(result.data);
  const parsed = conflictResultSchema.parse({ ...raw, relationship: relationshipSchema.safeParse(raw.relationship).success ? raw.relationship : null, resolved: raw.resolved === true });
  const applications = await client.from("organization_applications").select("id,organization_id,payload,status");
  if (applications.error) throw new Error("conflict_access_denied");
  const identity = z.object({ name: z.object({ en: z.string(), ar: z.string() }), domains: z.array(z.string()) });
  const candidates = applications.data.map(a => ({ id: a.id, organizationId: a.organization_id, status: a.status, ...identity.parse(a.payload) }));
  const subject = candidates.find(a => a.id === id);
  return { ...parsed, conflicts: subject ? lookalikeIdentityLeads(subject, candidates, parsed.conflicts) : parsed.conflicts };
}
export async function collectIdentityMetadata(domains: string[], verify: typeof verifyDomain = verifyDomain) {
  return Promise.all([...new Set(domains)].slice(0, 3).map(async domain => {
    if (!domainSchema.safeParse(domain).success) return { domain, observation: null, unavailable: "ineligible_domain" };
    try { return { domain, observation: await verify(domain), unavailable: null }; }
    catch { return { domain, observation: null, unavailable: "metadata_unavailable" }; }
  }));
}