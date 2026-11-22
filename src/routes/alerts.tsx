import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publishedAlertsQuery } from "@/lib/alerts/queries";
import { PublicAlertCard } from "@/components/security/public-alert-card";
import { PageHeader, EmptyState } from "@/components/common/bits";
import { useI18n } from "@/lib/i18n/i18n";
export const Route = createFileRoute("/alerts")({ loader: ({ context }) => context.queryClient.ensureQueryData(publishedAlertsQuery), head: () => ({ meta: [{ title: "Published Security Alerts — Taakkad" }, { name: "description", content: "Approved fictional cybercrime warnings and practical safety actions for the Taakkad hackathon prototype." }, { property: "og:title", content: "Security Alerts — Taakkad" }, { property: "og:description", content: "Published fictional security warnings, not official police publications." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: AlertsPage });
function AlertsPage() {
  const { tr } = useI18n(); const { data } = useSuspenseQuery(publishedAlertsQuery);
  return <><PageHeader eyebrow="Taakkad" title={tr("Security Alerts", "التنبيهات الأمنية")} description={tr("Fictional hackathon warnings. These are not official police publications or live police intelligence.", "تحذيرات خيالية للهاكاثون. ليست منشورات رسمية للشرطة أو معلومات من قواعد بيانات حية.")} /><section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="grid gap-4 md:grid-cols-3">{data.map(alert => <PublicAlertCard key={alert.id} alert={alert} />)}</div>{!data.length && <EmptyState title={tr("No published alerts", "لا توجد تنبيهات منشورة")} />}</section></>;
}