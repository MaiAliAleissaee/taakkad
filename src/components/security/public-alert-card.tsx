import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n";
import { severityLabel } from "@/lib/i18n/labels";
import { alertCategory } from "@/lib/alerts/labels";
import type { PublicAlert } from "@/lib/alerts/schema";
export function PublicAlertCard({ alert }: { alert: PublicAlert }) {
  const { tr, pick, date } = useI18n();
  return <article className="rounded-xl border bg-card p-4 text-card-foreground shadow-card">
    {alert.simulated && <p className="mb-2 text-xs font-semibold text-muted-foreground">{tr("Simulated Awareness Alert", "تنبيه توعوي تجريبي")}</p>}
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{pick(alertCategory[alert.content.category])}</span><Badge variant={alert.content.severity}>{pick(severityLabel[alert.content.severity])}</Badge></div>
    <h3 className="mt-2 text-sm font-semibold">{pick(alert.content.title)}</h3>
    <p className="mt-1 text-sm">{pick(alert.content.explanation)}</p>
    <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium">{tr("Safety action", "إجراء الأمان")}: </span>{pick(alert.content.safety)}</p>
    <p className="mt-2 text-xs text-muted-foreground">{tr("Published", "نُشر")}: {date(alert.published_at)}</p>
  </article>;
}