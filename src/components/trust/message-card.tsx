import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ChannelIcon, Mono, RiskMeter } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import type { SampleMessage } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel, trustStateHelp } from "@/lib/i18n/labels";
import type { Assessment } from "@/lib/services/verification";
import { cn } from "@/lib/utils";
import { ReasonList } from "./reason-list";
import { ReportButton } from "./report-button";
import { TrustBadge } from "./trust-badge";

const accent = { verified: "before:bg-verified", unverified: "before:bg-unverified", suspicious: "before:bg-suspicious" };

export function MessageCard({ message, assessment }: { message: SampleMessage; assessment: Assessment }) {
  const { tr, pick, date } = useI18n();
  const [open, setOpen] = useState(assessment.state === "suspicious");
  return (
    <article className={cn("relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card before:absolute before:inset-y-0 before:start-0 before:w-1", accent[assessment.state])}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ChannelIcon type={message.channel} />
            <span>{pick(channelLabel[message.channel])}</span>
            <span aria-hidden>·</span>
            <time dateTime={message.receivedAt}>{date(message.receivedAt, true)}</time>
          </div>
          <p className="mt-1 text-sm font-semibold"><Mono>{message.sender}</Mono></p>
        </div>
        <TrustBadge state={assessment.state} />
      </div>
      {message.subject ? <h3 className="mt-3 font-semibold">{pick(message.subject)}</h3> : null}
      <p className="mt-1 text-sm leading-relaxed text-foreground/85">{pick(message.body)}</p>
      {message.url ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <Mono className="truncate">{message.url}</Mono>
          <span className="ms-auto shrink-0 text-muted-foreground">{tr("link not opened", "لم يُفتح الرابط")}</span>
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          {open ? tr("Hide explanation", "إخفاء التفسير") : tr("Why this result?", "لماذا هذه النتيجة؟")}
        </Button>
        <div className="ms-auto">
          <ReportButton
            input={{ channel: message.channel, sender: message.sender, url: message.url, body: pick(message.body), claimedOrgId: message.claimedOrgId }}
            assessment={assessment}
          />
        </div>
      </div>

      {open ? (
        <div className="mt-3 space-y-3 rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">{pick(trustStateHelp[assessment.state])}</p>
          <ReasonList reasons={assessment.reasons} />
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{tr("Risk score (prototype heuristic)", "درجة الخطورة (تقدير تجريبي)")}</p>
            <RiskMeter score={assessment.riskScore} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
