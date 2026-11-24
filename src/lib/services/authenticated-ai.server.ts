import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function requireActiveAiSession(client: SupabaseClient<Database>) {
  const active = await client.rpc("has_active_app_session");
  if (active.error || active.data !== true) throw new Error("Unauthorized");
}