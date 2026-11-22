import { useMemo, useState } from "react";
import { Network, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/common/native-select";
import { Mono, StatTile } from "@/components/common/bits";
import { InvestigationGraph } from "./investigation-graph";
import { connectionSummary, groupDomains, isDocumentationIp, reportLabel } from "@/lib/security/presentation";
import type { ImpersonationAlert, LookalikeDomain, LookalikeStatus, Organization } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/i18n";
import { indicatorLabel, lookalikeStatusLabel, techniqueLabel } from "@/lib/i18n/labels";

export function FraudConnections({ alerts, lookalikes, organizations, onOpenReport, onStatus, onScan, scanOrg, setScanOrg, busy, scanning }: {
  alerts: ImpersonationAlert[]; lookalikes: LookalikeDomain[]; organizations: Organization[];
  onOpenReport: (id: string) => void; onStatus: (id: string, status: LookalikeStatus) => void;
  onScan: () => void; scanOrg: string; setScanOrg: (id: string) => void; busy: boolean; scanning: boolean;
}) {
  const { tr, pick, num, date, dir } = useI18n();
  const summary = useMemo(() => connectionSummary(alerts), [alerts]);
  const grouped = useMemo(() => groupDomains(lookalikes, alerts), [lookalikes, alerts]);
  const [graph, setGraph] = useState(false);
  return <div className="space-y-5">
    <div className="security-connection-statistics grid gap-3 sm:grid-cols-3"><StatTile label={tr("Related reports", "بلاغات مرتبطة")} value={num(summary.relatedReports)} /><StatTile label={tr("Shared indicators", "مؤشرات مشتركة")} value={num(summary.shared.length)} tone="warning" /><StatTile label={tr("Unique similar domains", "نطاقات مشابهة فريدة")} value={num(grouped.length)} tone="emerald" /></div>
    <p className="border-s-4 border-unverified bg-unverified-soft p-3 text-sm text-unverified">{tr("Connections are suggested by exact shared indicators, not offender attribution. Review evidence, timing and infrastructure independently.", "تُقترح الارتباطات بناءً على مؤشرات مشتركة متطابقة، وليس إسناد الجريمة. راجع الأدلة والتوقيت والبنية التحتية بشكل مستقل.")}</p>
    <Tabs defaultValue="summary" dir={dir}><TabsList className="h-auto flex-wrap"><TabsTrigger value="summary">{tr("Connection summary", "ملخص الارتباط")}</TabsTrigger><TabsTrigger value="domains">{tr("Suspicious domains", "النطاقات المشبوهة")}</TabsTrigger><TabsTrigger value="ips">{tr("IP indicators", "مؤشرات IP")}</TabsTrigger></TabsList>
      <TabsContent value="summary" className="space-y-4 pt-3">
        <div className="grid gap-3 md:grid-cols-2">{summary.shared.map(indicator => <article key={indicator.id} className="min-w-0 rounded-lg border bg-card p-4"><Badge variant="unverified">{tr("Human review required", "تتطلب مراجعة بشرية")}</Badge><p className="mt-2 text-xs text-muted-foreground">{pick(indicatorLabel[indicator.type])}</p><Mono className="mt-1 block break-all">{indicator.value}</Mono><p className="mt-2 text-sm">{tr("Suggested because this exact indicator appears in", "مقترح لأن هذا المؤشر يظهر مطابقاً في")} {num(indicator.cases.length)} {tr("reports", "بلاغات")}</p><div className="mt-3 flex flex-wrap gap-2">{indicator.cases.map(report => <Button key={report.id} variant="outline" size="sm" onClick={() => onOpenReport(report.id)}>{reportLabel(report)}</Button>)}</div></article>)}</div>
        {!summary.shared.length && <p className="text-sm text-muted-foreground">{tr("No exact shared indicators found. This does not prove reports are unrelated.", "لم تُعثر على مؤشرات مشتركة متطابقة. لا يثبت ذلك أن البلاغات غير مترابطة.")}</p>}
        <Button variant="outline" onClick={() => setGraph(value => !value)}><Network />{graph ? tr("Hide connection network", "إخفاء شبكة الارتباط") : tr("Show connection network", "عرض شبكة الارتباط")}</Button>
        {graph && <InvestigationGraph alerts={alerts.map(report => ({ ...report, caseId: reportLabel(report) }))} onOpenCase={onOpenReport} />}
      </TabsContent>
      <TabsContent value="domains" className="space-y-4 pt-3">
        <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 space-y-1 text-sm"><span>{tr("Fictional scan target", "جهة الفحص الخيالي")}</span><NativeSelect value={scanOrg} onChange={e => setScanOrg(e.target.value)}>{organizations.map(org => <option key={org.id} value={org.id}>{pick(org.name)}</option>)}</NativeSelect></label><Button disabled={busy || scanning || !scanOrg} onClick={onScan}><Radar />{scanning ? tr("Scanning…", "جارٍ الفحص…") : tr("Run simulated scan", "تشغيل الفحص الافتراضي")}</Button></div>
        <p className="text-xs text-muted-foreground">{tr("Similarity describes spelling resemblance, not the probability of fraud. All observations here are fictional; a simulated takedown request does not disable a website.", "التشابه يصف تقارب الكتابة، وليس احتمال الاحتيال. جميع المشاهدات هنا خيالية؛ طلب الإزالة الافتراضي لا يعطّل أي موقع.")}</p>
        <div className="divide-y border-y">{grouped.map(group => <details key={group.domain} className="py-3"><summary className="cursor-pointer"><Mono className="break-all font-semibold">{group.domain}</Mono><span className="ms-3 text-xs text-muted-foreground">{num(group.records.length)} {tr("records", "سجلات")} · {num(group.reports.length)} {tr("related reports", "بلاغات مرتبطة")}</span></summary>
          <div className="mt-3 flex flex-wrap gap-2">{group.reports.map(report => <Button key={report.id} size="sm" variant="outline" onClick={() => onOpenReport(report.id)}>{reportLabel(report)}</Button>)}</div>
          {group.records.map(record => <div key={record.id} className="mt-3 grid gap-3 border-s-2 ps-3 text-sm md:grid-cols-[1fr_12rem]"><div><p className="break-all">{tr("Imitates", "يشابه")}: <Mono>{record.targetDomain}</Mono></p><p className="mt-1">{pick(techniqueLabel[record.technique])} · {num(record.similarity)}% {tr("spelling similarity only", "تشابه كتابة فقط")}</p><p className="mt-1 text-xs text-muted-foreground">{date(record.firstSeen)} · {record.registrar} · {record.source === "seed" ? tr("Fictional seeded observation", "مشاهدة خيالية معدّة للعرض") : tr("Locally generated simulation", "محاكاة مولّدة محلياً")}</p><p className="mt-1 text-xs text-muted-foreground">{record.technique === "substitution" ? tr("A character is replaced with a lookalike.", "استُبدل حرف بآخر مشابه.") : record.technique === "keyword" || record.technique === "combo" ? tr("Added words may imitate an official service.", "قد تقلّد الكلمات المضافة خدمة رسمية.") : record.technique === "typo" ? tr("A spelling variation resembles the original.", "اختلاف إملائي يشابه الأصل.") : tr("The domain ending differs from the original.", "نهاية النطاق تختلف عن الأصل.")}</p></div><NativeSelect aria-label={`${tr("Domain status", "حالة النطاق")} ${record.id}`} value={record.status} disabled={busy} onChange={e => onStatus(record.id, e.target.value as LookalikeStatus)}>{(["monitoring", "flagged", "takedown_requested", "cleared"] as const).map(status => <option key={status} value={status}>{pick(lookalikeStatusLabel[status])}</option>)}</NativeSelect></div>)}
        </details>)}</div>
      </TabsContent>
      <TabsContent value="ips" className="space-y-4 pt-3"><p className="text-xs text-muted-foreground">{tr("No geolocation service is connected. Shared infrastructure alone does not establish a common offender.", "لا توجد خدمة تحديد موقع متصلة. البنية المشتركة وحدها لا تثبت وحدة مرتكب الجريمة.")}</p>{[...new Set(alerts.flatMap(report => report.indicators.filter(indicator => indicator.type === "ip").map(indicator => indicator.value)))].map(ip => <article key={ip} className="rounded-lg border bg-card p-4"><Mono>{ip}</Mono><p className="mt-1 text-xs text-muted-foreground">{isDocumentationIp(ip) ? tr("RFC 5737 documentation/demo address — no real geographic attribution.", "عنوان توثيقي/تجريبي وفق RFC 5737 — لا يُنسب لموقع جغرافي حقيقي.") : tr("Location not verified; no coordinates are available.", "الموقع غير متحقق منه؛ لا توجد إحداثيات متاحة.")}</p><div className="mt-3 flex flex-wrap gap-2">{alerts.filter(report => report.indicators.some(indicator => indicator.type === "ip" && indicator.value === ip)).map(report => <Button key={report.id} size="sm" variant="outline" onClick={() => onOpenReport(report.id)}>{reportLabel(report)}</Button>)}</div></article>)}</TabsContent>
    </Tabs>
  </div>;
}