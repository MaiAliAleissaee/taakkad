import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canAccessSecurity } from "./access";

type StaffSession = { user: User | null; ready: boolean; roles: string[]; displayName: string; securityAccess: boolean };
const SessionContext = createContext<StaffSession>({ user: null, ready: false, roles: [], displayName: "", securityAccess: false });
export function StaffSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<StaffSession>({ user: null, ready: false, roles: [], displayName: "", securityAccess: false });
  useEffect(() => {
    let alive = true;
    let generation = 0;
    async function refresh() {
      const current = ++generation;
      const result = await supabase.auth.getUser();
      const user = result.data.user;
      if (!user) {
        if (alive && current === generation) setSession({ user: null, ready: true, roles: [], displayName: "", securityAccess: false });
        return;
      }
      const [roleRows, profile] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      ]);
      const roles = (roleRows.data ?? []).map(r => r.role);
      if (alive && current === generation) setSession({ user, ready: true, roles, displayName: profile.data?.display_name || "", securityAccess: canAccessSecurity(roles) });
    }
    const listener = supabase.auth.onAuthStateChange(event => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      if (event === "SIGNED_OUT") {
        ++generation;
        setSession({ user: null, ready: true, roles: [], displayName: "", securityAccess: false });
        void queryClient.cancelQueries().then(() => { queryClient.clear(); void router.invalidate(); });
      } else {
        // Outside the Auth callback lock: getUser/queries must not run inside it.
        queueMicrotask(() => { void refresh(); void router.invalidate(); void queryClient.invalidateQueries(); });
      }
    });
    void refresh();
    return () => { alive = false; ++generation; listener.data.subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
export const useStaffSession = () => useContext(SessionContext);