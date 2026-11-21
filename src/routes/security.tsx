import { createFileRoute } from "@tanstack/react-router";
import { Radar, Search, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Disclosure } from "@/components/common/disclosure";
import { analystName, demoText, registrarName } from "@/lib/i18n/demo-content";
import { EmptyState, Mono, PageHeader, RiskMeter, StatTile } from "@/components/common/bits";
import { NativeSelect } from "@/components/common/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { InvestigationGraph } from "@/components/security/investigation-graph";
import type { AlertStatus, LookalikeStatus, Severity } from "@/lib/domain/types";
import { repository, useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import {
  alertStatusLabel, evidenceLabel, indicatorLabel, lookalikeStatusLabel, severityLabel, sourceLabel, techniqueLabel,
} from "@/lib/i18n/labels";
import { normalizeIndicator } from "@/lib/services/blocklist";
import { simulatedDomainMonitor } from "@/lib/services/domain-monitoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/security")({
  validateSearch: (s: Record<string, unknown>): { case?: string } =>
    typeof s["case"] === "string" ? { case: s["case"] } : {},
  head: () => ({
    meta: [
      { title: "Security Dashboard — TRUST ZERO AI" },
      { name: "description", content: "Simulated impersonation alerts, lookalike domains, linked indicators, evidence, risk scores and case review." },
      { property: "og:title", content: "Security Dashboard — TRUST ZERO AI" },
      { property: "og:description", content: "Simulated law-enforcement view of impersonation cases. Fictional data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SecurityPage,
});

const STATUSES: AlertStatus[] = ["new", "investigating", "escalated", "confirmed", "false_positive"];
const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const LK_STATUSES: LookalikeStatus[] = ["monitoring", "flagged", "takedown_requested", "cleared"];
const ANALYSTS = ["Analyst 07", "Analyst 12", "Analyst 21"];

function SecurityPage() {
  const { tr, pick, num, date, dir, lang } = useI18n();
  const { alerts, organizations, lookalikes } = useDemoState();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [status, setStatus] = useState<AlertStatus | "all">("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");
  const [scanOrg, setScanOrg] = useState(organizations[0]?.id ?? "");
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState("alerts");

  const orgName = (id?: string) => pick(organizations.find((o) => o.id === id)?.name) || tr("Unknown", "غير معروف");
  const filtered = alerts.filter((a) =>
    (status === "all" || a.status === status) && (severity === "all" || a.severity === severity) &&
    (!q.trim() || [a.caseId, a.title.en, a.title.ar, ...a.indicators.map((i) => i.value)].some((v) => v.toLowerCase().includes(q.trim().toLowerCase()))),
  );
  const selected = alerts.find((a) => a.id === search.case) ?? filtered[0];
  const select = (id: string) => navigate({ search: { case: id }, replace: true });

  const open = alerts.filter((a) => a.status !== "confirmed" && a.status !== "false_positive");
  const avgRisk = open.length ? Math.round(open.reduce((s, a) => s + a.riskScore, 0) / open.length) : 0;

  const addNote = (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !note.trim()) return;
    repository.addAlertNote(selected.id, selected.assignee ?? "Analyst 07", note.trim());
    setNote("");
    toast.success(tr("Note added", "تمت إضافة الملاحظة"));
  };

  const runScan = async () => {
    const org = organizations.find((o) => o.id === scanOrg);
    if (!org) return;
    setScanning(true);
    const found = await simulatedDomainMonitor.scan(org, lookalikes.map((l) => l.domain));
    repository.addLookalikes(found);
    setScanning(false);
    toast(tr(`${found.length} simulated candidates added`, `أُضيف ${found.length} نطاق افتراضي`), {
      description: tr("Generated locally — not observed on the internet.", "مولّدة محلياً — لم تُرصد على الإنترنت."),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow={tr("Professional services · Security Dashboard", "خدمات المختصين · لوحة الأمن")}
        title={tr("Impersonation case review", "مراجعة قضايا الانتحال")}
        description={tr("Simulated alerts and fictional evidence for demonstration. No real police systems are connected and no live internet monitoring takes place.", "تنبيهات افتراضية وأدلة خيالية للعرض. لا يوجد ربط بأنظمة شرطة فعلية ولا مراقبة حيّة للإنترنت.")}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label={tr("Open cases", "قضايا مفتوحة")} value={num(open.length)} />
          <StatTile label={tr("Critical / high", "حرجة / مرتفعة")} value={num(open.filter((a) => a.severity === "critical" || a.severity === "high").length)} tone="danger" />
          <StatTile label={tr("Average risk", "متوسط الخطورة")} value={num(avgRisk)} tone="warning" />
          <StatTile label={tr("Lookalike domains", "نطاقات مشابهة")} value={num(lookalikes.length)} tone="emerald" />
        </div>
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={setTab} dir={dir}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="alerts">{tr("Alerts & cases", "التنبيهات والقضايا")}</TabsTrigger>
            <TabsTrigger value="lookalikes">{tr("Lookalike domains", "النطاقات المشابهة")}</TabsTrigger>
            <TabsTrigger value="indicators">{tr("Linked indicators", "المؤشرات المترابطة")}</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="mt-5">
            <div className="grid gap-3 border-b pb-5 md:grid-cols-[1fr_12rem_12rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Search case, title or indicator", "ابحث بالقضية أو العنوان أو المؤشر")} aria-label={tr("Search", "بحث")} />
              </div>
              <NativeSelect aria-label={tr("Status", "الحالة")} value={status} onChange={(e) => setStatus(e.target.value as AlertStatus | "all")}>
                <option value="all">{tr("All statuses", "كل الحالات")}</option>
                {STATUSES.map((s) => <option key={s} value={s}>{pick(alertStatusLabel[s])}</option>)}
              </NativeSelect>
              <NativeSelect aria-label={tr("Severity", "الخطورة")} value={severity} onChange={(e) => setSeverity(e.target.value as Severity | "all")}>
                <option value="all">{tr("All severities", "كل المستويات")}</option>
                {SEVERITIES.map((s) => <option key={s} value={s}>{pick(severityLabel[s])}</option>)}
              </NativeSelect>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[22rem_1fr]">
              <ul className="space-y-2">
                {filtered.length === 0 ? <EmptyState title={tr("No alerts match", "لا توجد تنبيهات مطابقة")} /> : null}
                {filtered.map((a) => (
                  <li key={a.id}>
                    <Button variant="outline" type="button" aria-pressed={selected?.id === a.id} onClick={() => select(a.id)} className={cn("block h-auto w-full whitespace-normal rounded-lg border bg-card p-4 text-start shadow-none transition hover:border-primary", selected?.id === a.id && "border-emerald ring-1 ring-emerald")}>
                      <div className="flex items-center justify-between gap-2">
                        <Mono className="text-xs font-semibold text-muted-foreground">{a.caseId}</Mono>
                        <Badge variant={a.severity}>{pick(severityLabel[a.severity])}</Badge>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-snug">{pick(a.title)}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{pick(alertStatusLabel[a.status])}</span>
                        <span>{date(a.detectedAt)}</span>
                      </div>
                      <RiskMeter score={a.riskScore} className="mt-2" />
                    </Button>
                  </li>
                ))}
              </ul>

              {selected ? (
                <article className="space-y-5 rounded-2xl border bg-card p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Mono className="text-sm font-semibold">{selected.caseId}</Mono>
                        <Badge variant={selected.severity}>{pick(severityLabel[selected.severity])}</Badge>
                        <Badge variant="muted">{pick(sourceLabel[selected.source])}</Badge>
                      </div>
                      <h2 className="mt-2 text-xl font-semibold">{pick(selected.title)}</h2>

                    </div>
                    <div className="w-40"><p className="mb-1 text-xs text-muted-foreground">{tr("Risk score", "درجة الخطورة")}</p><RiskMeter score={selected.riskScore} /></div>
                  </div>

                  <Disclosure title={tr("Case summary", "ملخص القضية")}>
                    <p className="text-sm leading-relaxed text-muted-foreground">{pick(selected.summary)}</p><p className="mt-2 text-sm">{tr("Target", "الجهة المستهدفة")}: <span className="font-medium">{orgName(selected.targetOrgId)}</span></p>
                  </Disclosure>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{tr("Case review status", "حالة مراجعة القضية")}</span>
                      <NativeSelect aria-label={tr("Case review status", "حالة مراجعة القضية")} value={selected.status} onChange={(e) => { repository.updateAlert(selected.id, { status: e.target.value as AlertStatus }); toast.success(tr("Status updated", "تم تحديث الحالة")); }}>
                        {STATUSES.map((s) => <option key={s} value={s}>{pick(alertStatusLabel[s])}</option>)}
                      </NativeSelect>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{tr("Assigned analyst", "المحلل المكلّف")}</span>
                      <NativeSelect aria-label={tr("Assigned analyst", "المحلل المكلّف")} value={selected.assignee ?? ""} onChange={(e) => repository.updateAlert(selected.id, { assignee: e.target.value || undefined })}>
                        <option value="">{tr("Unassigned", "غير مكلّف")}</option>
                        {ANALYSTS.map((n) => <option key={n} value={n}>{analystName(n, lang)}</option>)}
                      </NativeSelect>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">{tr("Escalated and confirmed cases mark their indicators as suspicious in the Public Trust Portal.", "القضايا المُصعّدة والمؤكدة تجعل مؤشراتها مشبوهة في بوابة الثقة العامة.")}</p>

                  <Disclosure title={tr("Indicators & human-review leads", "المؤشرات وخيوط المراجعة البشرية")}>
                    <p className="text-xs text-muted-foreground">{tr("Shared indicators are investigation leads only, not proof of a shared offender.", "المؤشرات المشتركة خيوط تحقيق فقط، ولا تثبت وجود مرتكب واحد.")}</p>
                    <ul className="mt-2 space-y-1.5">
                      {selected.indicators.map((i) => {
                        const linked = alerts.filter((a) => a.id !== selected.id && a.indicators.some((x) => normalizeIndicator(x.value) === normalizeIndicator(i.value)));
                        return (
                          <li key={i.type + i.value} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                            <Badge variant="outline">{pick(indicatorLabel[i.type])}</Badge>
                            <Mono className="break-all">{i.value}</Mono>
                            {linked.map((l) => (
                              <Button key={l.id} variant="link" size="sm" type="button" onClick={() => select(l.id)} className="ms-auto h-auto px-2 py-1 text-xs text-info">
                                {tr("Linked", "مرتبط")} {l.caseId}
                              </Button>
                            ))}
                          </li>
                        );
                      })}
                    </ul>
                  </Disclosure>

                  <Disclosure title={tr("Evidence (fictional)", "الأدلة (خيالية)")} open>
                    <ul className="mt-2 space-y-2">
                      {selected.evidence.map((ev) => (
                        <li key={ev.id} className="border-b py-3 text-sm"><details><summary className="text-sm font-medium">{pick(evidenceLabel[ev.kind])}<span className="ms-3 text-xs font-normal text-muted-foreground">{date(ev.capturedAt, true)}</span></summary><p className="mt-3 leading-relaxed text-muted-foreground">{pick(ev.description)}</p></details></li>
                      ))}
                    </ul>
                  </Disclosure>

                  <Disclosure title={tr("Analyst notes", "ملاحظات المحلل")} open>
                    <ul className="mt-2 space-y-2">
                      {selected.notes.length === 0 ? <li className="text-sm text-muted-foreground">{tr("No notes yet.", "لا توجد ملاحظات بعد.")}</li> : null}
                      {selected.notes.map((n) => (
                        <li key={n.id} className="rounded-lg bg-muted p-3 text-sm">
                          <p className="text-xs text-muted-foreground">{analystName(n.author, lang)} · {date(n.at, true)}</p>
                          <p className="mt-1" dir="auto">{demoText(n.text, lang)}</p>
                        </li>
                      ))}
                    </ul>
                    <form onSubmit={addNote} className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Textarea dir="auto" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr("Add a review note…", "أضف ملاحظة مراجعة…")} aria-label={tr("Note", "ملاحظة")} />
                      <Button type="submit" disabled={!note.trim()}><Send className="rtl:rotate-180" />{tr("Add", "إضافة")}</Button>
                    </form>
                  </Disclosure>
                </article>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="lookalikes" className="mt-5 space-y-4">
            <div className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end">
              <label className="flex-1 space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">{tr("Run a simulated lookalike scan for", "تشغيل فحص افتراضي للنطاقات المشابهة لـ")}</span>
                <NativeSelect value={scanOrg} onChange={(e) => setScanOrg(e.target.value)}>
                  {organizations.map((o) => <option key={o.id} value={o.id}>{pick(o.name)}</option>)}
                </NativeSelect>
              </label>
              <Button onClick={runScan} disabled={scanning || !scanOrg}><Radar />{scanning ? tr("Scanning…", "جارٍ الفحص…") : tr("Run simulated scan", "تشغيل الفحص الافتراضي")}</Button>
            </div>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 text-start">{tr("Domain", "النطاق")}</th>
                    <th className="p-3 text-start">{tr("Imitates", "يقلّد")}</th>
                    <th className="p-3 text-start">{tr("Technique", "الأسلوب")}</th>
                    <th className="p-3 text-start">{tr("Similarity", "التشابه")}</th>
                    <th className="p-3 text-start">{tr("First seen", "أول رصد")}</th>
                    <th className="p-3 text-start">{tr("Status", "الحالة")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lookalikes.map((l) => (
                    <tr key={l.id} className="border-t align-top">
                      <td className="p-3"><Mono className="font-semibold">{l.domain}</Mono>{l.source === "simulated_scan" ? <Badge variant="info" className="ms-2">{tr("simulated", "افتراضي")}</Badge> : null}</td>
                      <td className="p-3"><Mono>{l.targetDomain}</Mono><p className="text-xs text-muted-foreground">{orgName(l.targetOrgId)}</p></td>
                      <td className="p-3">{pick(techniqueLabel[l.technique])}</td>
                      <td className="p-3 font-mono">{l.similarity}%</td>
                      <td className="p-3 text-xs">{date(l.firstSeen)}<p className="text-muted-foreground">{registrarName(l.registrar, lang)}</p></td>
                      <td className="p-3 min-w-44">
                        <NativeSelect aria-label={tr("Status", "الحالة")} value={l.status} onChange={(e) => repository.setLookalikeStatus(l.id, e.target.value as LookalikeStatus)}>
                          {LK_STATUSES.map((s) => <option key={s} value={s}>{pick(lookalikeStatusLabel[s])}</option>)}
                        </NativeSelect>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="indicators" className="mt-5">
            <InvestigationGraph alerts={alerts} initialCaseId={selected?.id} onOpenCase={(id) => { select(id); setTab("alerts"); }} />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
