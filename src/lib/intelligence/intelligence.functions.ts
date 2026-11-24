import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { commandSchema, workspaceSchema, type IntelligenceRecord } from "./schema";
import { generateCandidates, mergeRecords } from "./engine";
export const readIntelligence = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { authorizeAnalyst } = await import("./authorization.server");
  await authorizeAnalyst(context.supabase);
  const result = await context.supabase.rpc("read_analyst_intelligence");
  if (result.error) throw new Error("Intelligence unavailable");
  return workspaceSchema.parse(result.data);
});
export const changeIntelligence = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => commandSchema.parse(input)).handler(async ({ context, data }) => {
  const { authorizeAnalyst } = await import("./authorization.server");
  const user = await authorizeAnalyst(context.supabase);
  const result = await context.supabase.rpc("read_analyst_intelligence");
  if (result.error) throw new Error("Intelligence unavailable");
  const current = workspaceSchema.parse(result.data);
  if (current.revision !== data.revision) throw new Error("Workspace changed; reload");
  const now = new Date().toISOString();
  let records = current.records;
  if (data.action === "generate") {
    const incoming: IntelligenceRecord[] = generateCandidates(data.targetDomain).map(domain => ({ id: crypto.randomUUID(), title: domain, domain, targetDomain: data.targetDomain, source: "generated", sourceReference: "Local deterministic candidate generator", sourceObservedAt: null, synthetic: false, notes: "", indicators: [{ type: "domain", value: domain }], observation: null, createdAt: now }));
    records = mergeRecords(records, incoming);
  } else if (data.action === "import") {
    records = mergeRecords(records, data.rows.map(row => ({ ...row, id: crypto.randomUUID(), observation: null, createdAt: now })));
  } else {
    const selected = records.filter(r => data.ids.includes(r.id));
    if (selected.length !== data.ids.length || selected.some(r => !r.domain || r.synthetic)) throw new Error("Select real public domains only; synthetic records cannot be checked");
    const reserve = await context.supabase.rpc("reserve_analyst_intelligence_check");
    if (reserve.error || !reserve.data) throw new Error("Metadata limit reached; retry after ten minutes");
    const { verifyDomain } = await import("./metadata.server");
    // Four domains maximum: at most 28 fixed-origin metadata subrequests; never target-site HTTP.
    const observations = new Map<string, Awaited<ReturnType<typeof verifyDomain>>>();
    for (const record of selected) { if (record.domain) observations.set(record.id, await verifyDomain(record.domain)); }
    records = records.map(r => observations.has(r.id) ? { ...r, observation: observations.get(r.id) ?? null } : r);
  }
  const validated = workspaceSchema.parse({ records, revision: current.revision });
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const saved = await supabaseAdmin.rpc("commit_analyst_intelligence", { actor_id: user.id, next_payload: { records: validated.records }, expected_revision: current.revision });
  if (saved.error) throw new Error("Save failed or another tab changed the workspace; reload");
  return workspaceSchema.parse(saved.data);
});
