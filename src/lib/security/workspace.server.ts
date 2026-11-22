import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { snapshotSchema, type SecuritySnapshot, messageSchema } from "./schema";
import { buildPublicReport } from "@/lib/services/reporting";
import { assessMessage } from "@/lib/services/verification";
import { buildBlocklist } from "@/lib/services/blocklist";
import { createSeedState } from "@/lib/data/seed";

export async function loadWorkspace(client: SupabaseClient<Database>, userId: string) {
  const result = await client.rpc("ensure_security_workspace");
  if (result.error) throw new Error("Workspace unavailable");
  const row = await client.from("security_workspaces").select("payload,revision").eq("user_id", userId).single();
  if (row.error) throw new Error("Workspace unavailable");
  let snapshot = snapshotSchema.parse(row.data.payload);
  const reports = await client.from("security_reports").select("id,input").order("received_at");
  if (reports.error) throw new Error("Reports unavailable");
  if (reports.data.length) {
    for (const report of reports.data) {
      if (snapshot.alerts.some(a => a.id === report.id)) continue;
      const input = messageSchema.parse(report.input);
      const assessment = assessMessage(input, { organizations: createSeedState().organizations, blocklist: buildBlocklist(snapshot.alerts) });
      const caseNumber = Math.max(1047, ...snapshot.alerts.map(a => Number(a.caseId.replace(/\D/g, "")) || 0)) + 1;
      snapshot.alerts.unshift({ ...buildPublicReport(input, assessment), id: report.id, caseId: `TZ-${caseNumber}` });
    }
    const saved = await saveWorkspace(client, userId, snapshot, row.data.revision);
    const removed = await client.from("security_reports").delete().in("id", reports.data.map(r => r.id));
    if (removed.error) throw new Error("Reports saved; inbox cleanup pending");
    return saved;
  }
  return { snapshot, revision: row.data.revision, userId };
}
export async function saveWorkspace(client: SupabaseClient<Database>, userId: string, snapshot: SecuritySnapshot, revision: number) {
  const updated = await client.from("security_workspaces").update({ payload: snapshot, revision: revision + 1 }).eq("user_id", userId).eq("revision", revision).select("revision,payload").maybeSingle();
  if (updated.error || !updated.data) throw new Error("Save failed or another tab changed this workspace. Reload before retrying.");
  return { snapshot: snapshotSchema.parse(updated.data.payload), revision: updated.data.revision, userId };
}