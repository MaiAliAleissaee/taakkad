import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BlockedIndicator } from "@/lib/services/blocklist";
import { indicatorsFor } from "@/lib/services/reporting";
import { assessMessage, type Assessment, type MessageInput } from "@/lib/services/verification";
import { useDemoState } from "./local-store";
import { useStaffSession } from "@/lib/security/session";
import { publicWorkspaceTarget } from "@/lib/security/workspace-target";

export function usePublicWorkspace() {
  const session = useStaffSession();
  const [workspace, setWorkspace] = useState<string | null>(null);
  useEffect(() => {
    const read = () => { const value = localStorage.getItem("trustzero.security.workspace"); setWorkspace(value && /^[0-9a-f-]{36}$/i.test(value) ? value : null); };
    read(); window.addEventListener("trustzero-workspace", read); window.addEventListener("storage", read);
    return () => { window.removeEventListener("trustzero-workspace", read); window.removeEventListener("storage", read); };
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem("trustzero.security.workspace");
    if (session.ready && (!session.securityAccess || saved !== session.user?.id)) {
      localStorage.removeItem("trustzero.security.workspace");
      setWorkspace(null);
    }
  }, [session.ready, session.securityAccess, session.user?.id, workspace]);
  return publicWorkspaceTarget(workspace, session.user?.id, session.ready, session.securityAccess);
}

// The public response contains only submitted matching values, never case IDs, evidence or linked-indicator lists.
export function useBlocklist(inputs?: MessageInput[]) {
  const { messages } = useDemoState();
  const workspace = usePublicWorkspace();
  const candidates = [...new Set((inputs ?? messages.map(m => ({ channel: m.channel, sender: m.sender, url: m.url, body: m.body.en }))).flatMap(input => indicatorsFor(input).map(i => i.value)))].sort();
  const flags = useQuery({ queryKey: ["public-flags", workspace, candidates], queryFn: async () => {
    const result = await supabase.rpc("flagged_message_values", { candidate_values: candidates, ...(workspace ? { workspace_user: workspace } : {}) });
    if (result.error) throw new Error("Message safety check unavailable");
    return result.data;
  }, enabled: candidates.length > 0, staleTime: 0 });
  return useMemo<BlockedIndicator[]>(() => (flags.data ?? []).map(value => ({ type: "domain", value, caseId: "restricted" })), [flags.data]);
}

/** Live assessments: change when organizations or case statuses change. */
export function useMessageAssessments() {
  const { messages, organizations } = useDemoState();
  const blocklist = useBlocklist();
  return useMemo(
    () =>
      messages.map((m) => ({
        message: m,
        assessment: assessMessage(
          { channel: m.channel, sender: m.sender, url: m.url, body: `${m.subject?.en ?? ""} ${m.body.en}`, claimedOrgId: m.claimedOrgId },
          { organizations, blocklist },
        ) as Assessment,
      })),
    [messages, organizations, blocklist],
  );
}
