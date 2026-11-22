import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n";
export function StaffSignOut({ onNavy = false }: { onNavy?: boolean }) {
  const queryClient = useQueryClient(); const navigate = useNavigate(); const { tr } = useI18n();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await queryClient.cancelQueries(); queryClient.clear();
    const result = await supabase.auth.signOut();
    if (result.error) { toast.error(tr("Sign out failed. Please try again.", "تعذّر تسجيل الخروج. حاول مجدداً.")); setBusy(false); return; }
    await navigate({ to: "/auth", replace: true });
  }
  return <Button size="sm" variant={onNavy ? "onNavy" : "outline"} disabled={busy} onClick={signOut}><LogOut />{tr("Logout", "تسجيل الخروج")}</Button>;
}