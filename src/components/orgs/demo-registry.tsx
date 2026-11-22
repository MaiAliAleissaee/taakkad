import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { readDemoRegistry } from "@/lib/organizations/demo.functions";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel } from "@/lib/i18n/labels";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { matchesDemoRegistry } from "@/lib/organizations/demo-schema";

export const demoRegistryQuery = queryOptions({ queryKey: ["organization-demo-registry"], queryFn: () => readDemoRegistry() });
export function DemoRegistry() {
  const { tr, pick } = useI18n();
  const { data } = useSuspenseQuery(demoRegistryQuery);
  const [query, setQuery] = useState("");
  const filtered = data.filter(org => matchesDemoRegistry(org, query));
  return <section id="approved-organizations" className="mb-8 scroll-mt-24 border-b pb-8"><h2 className="mb-3 text-2xl font-semibold">{tr("Approved Organizations", "الجهات المعتمدة")}</h2><p className="mb-4 text-sm text-muted-foreground">{tr("Demo approval does not constitute real-world identity or channel ownership verification. These simulated channels are not genuinely verified or guaranteed safe by public checks.", "الاعتماد التجريبي لا يُعد تحققاً من الهوية الفعلية أو ملكية القنوات. لا تصنّف الفحوص العامة هذه القنوات التجريبية كموثّقة فعلياً أو مضمونة الأمان.")}</p>
    <div className="relative mb-4 max-w-xl"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" value={query} onChange={event => setQuery(event.target.value)} aria-label={tr("Search approved organizations", "البحث في الجهات المعتمدة")} placeholder={tr("Search name, website or channel", "ابحث بالاسم أو الموقع أو القناة")} /></div>
    {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(org => <article key={org.application_id} className="min-w-0 space-y-3 rounded-lg border bg-card p-5 shadow-card"><h3 dir="auto" className="break-words text-lg font-semibold">{pick(org.name)}</h3><Badge variant="unverified">{tr("Demo Approved", "اعتماد تجريبي")}</Badge><dl className="space-y-3">{org.channels.map(channel => <div key={channel.type} className="text-sm"><dt className="text-muted-foreground">{pick(channelLabel[channel.type])} · {tr("Simulated", "تجريبي")}</dt><dd dir="ltr" className="break-all font-mono text-xs">{channel.value}</dd></div>)}</dl></article>)}</div> : <p className="text-sm text-muted-foreground">{data.length ? tr("No approved organizations match your search.", "لا توجد جهات معتمدة مطابقة لبحثك.") : tr("No simulated approvals yet.", "لا توجد اعتمادات تجريبية بعد.")}</p>}
  </section>;
}