import { useMemo } from "react";
import { buildBlocklist } from "@/lib/services/blocklist";
import { assessMessage, type Assessment } from "@/lib/services/verification";
import { useDemoState } from "./local-store";

export function useBlocklist() {
  const { alerts } = useDemoState();
  return useMemo(() => buildBlocklist(alerts), [alerts]);
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
