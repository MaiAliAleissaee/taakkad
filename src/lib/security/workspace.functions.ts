import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { commandSchema, snapshotSchema } from "./schema";
import { z } from "zod";

export const readSecurityWorkspace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { securityIdentity } = await import("./authorization.server");
  const user = await securityIdentity(context.supabase);
  const { loadWorkspace } = await import("./workspace.server");
  return loadWorkspace(context.supabase, user.id);
});
export const migrateSecurityWorkspace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ migrationId: z.string().uuid(), snapshot: snapshotSchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { securityIdentity } = await import("./authorization.server");
    await securityIdentity(context.supabase);
    const result = await context.supabase.rpc("import_security_snapshot", { migration_id: data.migrationId, saved_payload: data.snapshot });
    if (result.error) throw new Error("Migration failed; browser records have not been removed.");
    const { loadWorkspace } = await import("./workspace.server");
    return loadWorkspace(context.supabase, context.userId);
  });
export const changeSecurityWorkspace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) => commandSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { securityIdentity } = await import("./authorization.server");
    const user = await securityIdentity(context.supabase);
    const { loadWorkspace, saveWorkspace } = await import("./workspace.server");
    const current = await loadWorkspace(context.supabase, user.id);
    let snapshot = structuredClone(current.snapshot);
    if (data.action === "reset") {
      const template = await context.supabase.from("security_templates").select("payload").eq("id", "original").single();
      if (template.error) throw new Error("Reset failed");
      snapshot = snapshotSchema.parse(template.data.payload);
    } else if (data.action === "scan") {
      snapshot.lookalikes = [...data.items.filter(item => !snapshot.lookalikes.some(l => l.domain === item.domain)), ...snapshot.lookalikes];
    } else if (data.action === "lookalike_status") {
      snapshot.lookalikes = snapshot.lookalikes.map(l => l.id === data.id ? { ...l, status: data.status } : l);
    } else {
      snapshot.alerts = snapshot.alerts.map(alert => {
        if (alert.id !== data.id) return alert;
        if (data.action === "status") return { ...alert, status: data.status };
        if (data.action === "assign") return { ...alert, assignee: data.assignee };
        return { ...alert, notes: [...alert.notes, { id: crypto.randomUUID(), at: new Date().toISOString(), author: user.user_metadata['display_name'] || user.email || "Authorized analyst", text: data.text }] };
      });
    }
    return saveWorkspace(context.supabase, user.id, snapshot, current.revision);
  });