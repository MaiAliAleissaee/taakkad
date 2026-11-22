import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader, StatTile } from "@/components/common/bits";
import { NativeSelect } from "@/components/common/native-select";
import { MessageCard } from "@/components/trust/message-card";
import { MessageChecker } from "@/components/trust/message-checker";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChannelType, TrustState } from "@/lib/domain/types";
import { useMessageAssessments } from "@/lib/data/hooks";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel, trustStateHelp, trustStateLabel } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Public Trust Portal — TRUST ZERO AI" },
      { name: "description", content: "See whether sample messages and links are Verified, Unverified or Suspicious, with a clear explanation for each result." },
      { property: "og:title", content: "Public Trust Portal — TRUST ZERO AI" },
      { property: "og:description", content: "Check a message or link against registered organizations. Prototype with fictional data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrustPage,
});

function TrustPage() {
  const { tr, pick, num, dir } = useI18n();
  const assessed = useMessageAssessments();
  const [state, setState] = useState<TrustState | "all">("all");
  const [channel, setChannel] = useState<ChannelType | "all">("all");

  const counts = useMemo(() => {
    const c = { verified: 0, unverified: 0, suspicious: 0 };
    assessed.forEach((a) => { c[a.assessment.state] += 1; });
    return c;
  }, [assessed]);

  const filtered = assessed.filter((a) => (state === "all" || a.assessment.state === state) && (channel === "all" || a.message.channel === channel));

  return (
    <>
      <PageHeader
        eyebrow={tr("Public Trust Portal", "بوابة الثقة العامة")}
        title={tr("Is this message really from them?", "هل هذه الرسالة منهم حقاً؟")}
        description={tr(
          "Every result comes with its reasons. Unverified means we could not confirm the sender — it does not mean fraud unless there is evidence.",
          "كل نتيجة مرفقة بأسبابها. «غير موثّق» يعني أننا لم نتمكن من تأكيد المرسل — ولا يعني احتيالاً ما لم يوجد دليل.",
        )}
      >
        <div className="grid grid-cols-3 gap-3">
          <StatTile label={pick(trustStateLabel.verified)} value={num(counts.verified)} tone="emerald" />
          <StatTile label={pick(trustStateLabel.unverified)} value={num(counts.unverified)} tone="warning" />
          <StatTile label={pick(trustStateLabel.suspicious)} value={num(counts.suspicious)} tone="danger" />
        </div>
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {(["verified", "unverified", "suspicious"] as const).map((s) => (
            <div key={s} className="rounded-xl border bg-card p-4">
              <TrustBadge state={s} />
              <p className="mt-2 text-sm text-muted-foreground">{pick(trustStateHelp[s])}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="feed" dir={dir}>
          <TabsList>
            <TabsTrigger value="feed">{tr("Sample messages", "رسائل تجريبية")}</TabsTrigger>
            <TabsTrigger value="check">{tr("Check a message", "افحص رسالة")}</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2" role="group" aria-label={tr("Filter by result", "تصفية حسب النتيجة")}>
                {(["all", "verified", "unverified", "suspicious"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={state === s}
                    onClick={() => setState(s)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      state === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                    )}
                  >
                    {s === "all" ? tr(`All (${assessed.length})`, `الكل (${assessed.length})`) : `${pick(trustStateLabel[s])} (${counts[s]})`}
                  </button>
                ))}
              </div>
              <div className="md:w-56">
                <NativeSelect aria-label={tr("Channel", "القناة")} value={channel} onChange={(e) => setChannel(e.target.value as ChannelType | "all")}>
                  <option value="all">{tr("All channels", "كل القنوات")}</option>
                  {(["email", "sms", "phone", "social", "website"] as const).map((c) => <option key={c} value={c}>{pick(channelLabel[c])}</option>)}
                </NativeSelect>
              </div>
            </div>
            {filtered.length ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {filtered.map(({ message, assessment }) => <MessageCard key={message.id} message={message} assessment={assessment} />)}
              </div>
            ) : (
              <div className="mt-5"><EmptyState title={tr("No messages match these filters", "لا توجد رسائل مطابقة")} /></div>
            )}
          </TabsContent>

          <TabsContent value="check" className="mt-5">
            <MessageChecker />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
