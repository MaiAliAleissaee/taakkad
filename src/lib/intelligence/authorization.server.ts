import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { securityIdentity } from "@/lib/security/authorization.server";
import { isAnalyst } from "./schema";
export async function authorizeAnalyst(client: SupabaseClient<Database>) {
  const user = await securityIdentity(client);
  const roles = await client.from("user_roles").select("role").eq("user_id", user.id);
  if (roles.error || !isAnalyst((roles.data ?? []).map(r => r.role))) throw new Error("Forbidden");
  const active = await client.rpc("has_security_access");
  if (active.error || active.data !== true) throw new Error("Forbidden");
  return user;
}
