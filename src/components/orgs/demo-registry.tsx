import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { readDemoRegistry } from "@/lib/organizations/demo.functions";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel } from "@/lib/i18n/labels";
import { Badge } from "@/components/ui/badge";

export const demoRegistryQuery = queryOptions({ queryKey: ["organization-demo-registry"], queryFn: () => readDemoRegistry() });
export function DemoRegistry() {
  const { tr, pick } = useI18n();
  const { data } = useSuspenseQuery(demoRegistryQuery);
  return <section className="mb-8 border-b pb-8"><h2 className="mb-3 text-2xl font-semibold">{tr("DEMO organization registry", "سجل الجهات التجريبي")}</h2><p className="mb-4 text-sm text-muted-foreground">{tr("Simulated / تجريبي — ownership has not been verified. These channels are not treated as trusted by public checks.", "تجريبي / Simulated — لم يتم التحقق من الملكية. لا تُعامل هذه القنوات كقنوات موثوقة في الفحوص العامة.")}</p>
    {data.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.map(org => <article key={org.application_id} className="min-w-0 space-y-3 rounded-lg border bg-card p-5 shadow-card"><h3 dir="auto" className="break-words text-lg font-semibold">{pick(org.name)}</h3><Badge variant="unverified">{tr("Simulated", "تجريبي")}</Badge><dl className="space-y-3">{org.channels.map(channel => <div key={channel.type} className="text-sm"><dt className="text-muted-foreground">{pick(channelLabel[channel.type])} · {tr("Simulated", "تجريبي")}</dt><dd dir="ltr" className="break-all font-mono text-xs">{channel.value}</dd></div>)}</dl></article>)}</div> : <p className="text-sm text-muted-foreground">{tr("No simulated approvals yet.", "لا توجد اعتمادات تجريبية بعد.")}</p>}
  </section>;
}