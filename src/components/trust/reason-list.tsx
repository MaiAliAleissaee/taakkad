import { CheckCircle2, CircleAlert, Info, OctagonAlert } from "lucide-react";
import type { ChannelType } from "@/lib/domain/types";
import { useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel, reasonTemplate, techniqueLabel } from "@/lib/i18n/labels";
import type { Reason } from "@/lib/services/verification";
import { cn } from "@/lib/utils";

const toneIcon = { positive: CheckCircle2, neutral: Info, warning: CircleAlert, negative: OctagonAlert };
const toneColor = { positive: "text-verified", neutral: "text-info", warning: "text-unverified", negative: "text-suspicious" };

export function ReasonList({ reasons }: { reasons: Reason[] }) {
  const { fmt, pick, tr } = useI18n();
  const { organizations } = useDemoState();
  const orgName = (id: string | number | undefined) => {
    const o = organizations.find((x) => x.id === id);
    return o ? pick(o.name) : tr("an organization", "جهة");
  };
  return (
    <ul className="space-y-2">
      {reasons.map((r, i) => {
        const Icon = toneIcon[r.tone];
        const params: Record<string, string | number> = { ...r.params };
        if (r.params["org"] !== undefined) params["org"] = orgName(r.params["org"]);
        if (r.params["channel"] !== undefined) params["channel"] = pick(channelLabel[r.params["channel"] as ChannelType]);
        if (r.params["technique"] !== undefined) params["technique"] = pick(techniqueLabel[r.params["technique"] as keyof typeof techniqueLabel]);
        return (
          <li key={`${r.code}-${i}`} className="flex gap-2 text-sm leading-relaxed">
            <Icon className={cn("mt-0.5 size-4 shrink-0", toneColor[r.tone])} aria-hidden />
            <span>
              {fmt(reasonTemplate[r.code], params)}
              {r.evidence ? (
                <span className="ms-2 rounded bg-suspicious-soft px-1.5 py-0.5 text-[0.7rem] font-semibold text-suspicious">
                  {tr("Evidence", "دليل")}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
