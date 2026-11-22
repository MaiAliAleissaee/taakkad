import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";
import { canAccessSecurity } from "./access";
export async function securityIdentity(supabase: SupabaseClient<Database>) {
  const token = getRequestHeader("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new Error("Unauthorized");
  // Revalidate against Auth, including logout/session revocation, not just a signed JWT.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  const roles = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
  if (roles.error) throw new Error("Access check unavailable");
  if (!canAccessSecurity((roles.data ?? []).map(r => r.role))) throw new Error("Forbidden");
  return data.user;
}