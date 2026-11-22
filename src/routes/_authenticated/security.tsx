import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useStaffSession } from "@/lib/security/session";
import { isVerificationOfficer } from "@/lib/organizations/schema";
import { Radar, Search, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { EmptyState, Mono, PageHeader, RiskMeter, StatTile } from "@/components/common/bits";
import { NativeSelect } from "@/components/common/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { InvestigationGraph } from "@/components/security/investigation-graph";
import type { AlertStatus, LookalikeStatus, Severity } from "@/lib/domain/types";
import { useDemoState } from "@/lib/data/local-store";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { securityQuery } from "@/lib/security/queries";
import { canAccessSecurity } from "@/lib/security/access";
import { changeSecurityWorkspace, migrateSecurityWorkspace } from "@/lib/security/workspace.functions";
import { pendingSecurityMigration, completeSecurityMigration } from "@/lib/security/legacy";
import type { SecuritySnapshot, commandSchema } from "@/lib/security/schema";
import type { z } from "zod";
import { StaffSignOut } from "@/components/security/staff-sign-out";
import { BrowserArchive } from "@/components/security/browser-archive";
import { AlertManager } from "@/components/security/alert-manager";
import { useI18n } from "@/lib/i18n/i18n";
import {
  alertStatusLabel, evidenceLabel, indicatorLabel, lookalikeStatusLabel, severityLabel, sourceLabel, techniqueLabel,
} from "@/lib/i18n/labels";
import { normalizeIndicator } from "@/lib/services/blocklist";
import { simulatedDomainMonitor } from "@/lib/services/domain-monitoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/security")({
  beforeLoad: async ({ context }) => {
    const roles = await supabase.from("user_roles").select("role").eq("user_id", context.staffUserId);
    if (roles.error || !canAccessSecurity((roles.data ?? []).map(r => r.role))) throw redirect({ to: "/auth", replace: true });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(securityQuery(context.staffUserId)),
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
  component: SecurityDataGate,
});

const STATUSES: AlertStatus[] = ["new", "investigating", "escalated", "confirmed", "false_positive"];
const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const LK_STATUSES: LookalikeStatus[] = ["monitoring", "flagged", "takedown_requested", "cleared"];
const ANALYSTS = ["Analyst 07", "Analyst 12", "Analyst 21"];

function SecurityDataGate() {
  const { staffUserId } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(securityQuery(staffUserId));
  const migrate = useServerFn(migrateSecurityWorkspace);
  const change = useServerFn(changeSecurityWorkspace);
  const { tr } = useI18n();
  const [migration, setMigration] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    async function preserve() {
      try {
        const pending = pendingSecurityMigration();
        if (pending) {
          const saved = await migrate({ data: pending });
          queryClient.setQueryData(securityQuery(staffUserId).queryKey, saved);
        }
        completeSecurityMigration(staffUserId);
        if (alive) setMigration("ready");
      } catch { if (alive) setMigration("error"); }
    }
    void preserve();
    return () => { alive = false; };
  }, [staffUserId, migrate, queryClient, attempt]);
  const mutation = useMutation({ mutationFn: (command: z.infer<typeof commandSchema>) => change({ data: command }),
    onSuccess: saved => { queryClient.setQueryData(securityQuery(staffUserId).queryKey, saved); void queryClient.invalidateQueries({ queryKey: ["public-flags"] }); },
    onError: () => toast.error(tr("The change was not saved. Reload and try again.", "لم يُحفظ التغيير. أعد تحميل الصفحة وحاول مجدداً.")),
  });
  if (migration !== "ready") return <section className="mx-auto max-w-7xl px-4 py-8"><p role="status">{migration === "error" ? tr("Browser records could not be migrated. They remain unchanged in this browser.", "تعذّر نقل سجلات المتصفح. تبقى محفوظة دون تغيير في هذا المتصفح.") : tr("Loading your secure workspace…", "جارٍ تحميل مساحة العمل الآمنة…")}</p>{migration === "error" && <Button onClick={() => { setMigration("loading"); setAttempt(v => v + 1); }}>{tr("Try again", "حاول مجدداً")}</Button>}<div className="mt-4"><StaffSignOut /></div></section>;
  return <SecurityPage snapshot={data.snapshot} change={mutation.mutateAsync} busy={mutation.isPending} />;
}

function SecurityPage({ snapshot, change, busy }: { snapshot: SecuritySnapshot; change: (command: z.infer<typeof commandSchema>) => Promise<unknown>; busy: boolean }) {
  const { tr, pick, num, date, dir } = useI18n();
  const { organizations } = useDemoState();
  const { alerts, lookalikes } = snapshot;
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

  const addNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !note.trim()) return;
    try { await change({ action: "note", id: selected.id, text: note.trim() }); } catch { return; }
    setNote("");
    toast.success(tr("Note added", "تمت إضافة الملاحظة"));
  };

  const runScan = async () => {
    const org = organizations.find((o) => o.id === scanOrg);
    if (!org) return;
    setScanning(true);
    let found;
    try { found = await simulatedDomainMonitor.scan(org, lookalikes.map((l) => l.domain));
      await change({ action: "scan", items: found });
    } catch { return; } finally { setScanning(false); }
    toast(tr(`${found.length} simulated candidates added`, `أُضيف ${found.length} نطاق افتراضي`), {
      description: tr("Generated locally — not observed on the internet.", "مولّدة محلياً — لم تُرصد على الإنترنت."),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="TRUST ZERO AI"
        title={tr("Security Dashboard", "لوحة التحكم الأمنية")}
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{tr("Hackathon Demo — Not Connected to Abu Dhabi Police Systems", "عرض تجريبي للهاكاثون — غير متصل بأنظمة شرطة أبوظبي")}</p><div className="flex items-center gap-2"><OfficerReviewLink /><BrowserArchive /><StaffSignOut /></div></div>
        <Tabs value={tab} onValueChange={setTab} dir={dir}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="alerts">{tr("Alerts & cases", "التنبيهات والقضايا")}</TabsTrigger>
            <TabsTrigger value="lookalikes">{tr("Lookalike domains", "النطاقات المشابهة")}</TabsTrigger>
            <TabsTrigger value="indicators">{tr("Linked indicators", "المؤشرات المترابطة")}</TabsTrigger>
            <TabsTrigger value="publishing">{tr("Public security alerts", "التنبيهات الأمنية العامة")}</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="mt-5">
            <div className="grid gap-3 rounded-xl border bg-card p-3 shadow-card md:grid-cols-[1fr_12rem_12rem]">
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
                    <button type="button" onClick={() => select(a.id)} className={cn("w-full rounded-xl border bg-card p-4 text-start shadow-card transition hover:border-emerald/50", selected?.id === a.id && "border-emerald ring-1 ring-emerald")}>
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
                    </button>
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
                      <p className="mt-1 text-sm text-muted-foreground">{pick(selected.summary)}</p>
                      <p className="mt-2 text-sm">{tr("Target", "الجهة المستهدفة")}: <span className="font-medium">{orgName(selected.targetOrgId)}</span></p>
                    </div>
                    <div className="w-40"><p className="mb-1 text-xs text-muted-foreground">{tr("Risk score", "درجة الخطورة")}</p><RiskMeter score={selected.riskScore} /></div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{tr("Case review status", "حالة مراجعة القضية")}</span>
                      <NativeSelect value={selected.status} disabled={busy} aria-label={tr("Case review status", "حالة مراجعة القضية")} onChange={async (e) => { try { await change({ action: "status", id: selected.id, status: e.target.value as AlertStatus }); toast.success(tr("Status updated", "تم تحديث الحالة")); } catch { /* mutation shows error */ } }}>
                        {STATUSES.map((s) => <option key={s} value={s}>{pick(alertStatusLabel[s])}</option>)}
                      </NativeSelect>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-xs text-muted-foreground">{tr("Assigned analyst", "المحلل المكلّف")}</span>
                      <NativeSelect value={selected.assignee ?? ""} disabled={busy} aria-label={tr("Assigned analyst", "المحلل المكلّف")} onChange={(e) => { void change({ action: "assign", id: selected.id, assignee: e.target.value }).catch(() => {}); }}>
                        <option value="">{tr("Unassigned", "غير مكلّف")}</option>
                        {ANALYSTS.map((n) => <option key={n} value={n}>{n}</option>)}
                      </NativeSelect>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">{tr("Escalated and confirmed cases mark their indicators as suspicious in the Public Trust Portal.", "القضايا المُصعّدة والمؤكدة تجعل مؤشراتها مشبوهة في بوابة الثقة العامة.")}</p>

                  <div>
                    <h3 className="text-sm font-semibold">{tr("Indicators", "المؤشرات")}</h3>
                    <ul className="mt-2 space-y-1.5">
                      {selected.indicators.map((i) => {
                        const linked = alerts.filter((a) => a.id !== selected.id && a.indicators.some((x) => normalizeIndicator(x.value) === normalizeIndicator(i.value)));
                        return (
                          <li key={i.type + i.value} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                            <Badge variant="outline">{pick(indicatorLabel[i.type])}</Badge>
                            <Mono className="break-all">{i.value}</Mono>
                            {linked.map((l) => (
                              <button key={l.id} type="button" onClick={() => select(l.id)} className="ms-auto rounded bg-info-soft px-2 py-0.5 text-xs font-medium text-info hover:underline">
                                {tr("Linked", "مرتبط")} {l.caseId}
                              </button>
                            ))}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">{tr("Evidence (fictional)", "الأدلة (خيالية)")}</h3>
                    <ul className="mt-2 space-y-2">
                      {selected.evidence.map((ev) => (
                        <li key={ev.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex justify-between text-xs text-muted-foreground"><span className="font-medium">{pick(evidenceLabel[ev.kind])}</span><span>{date(ev.capturedAt, true)}</span></div>
                          <p className="mt-1">{pick(ev.description)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">{tr("Analyst notes", "ملاحظات المحلل")}</h3>
                    <ul className="mt-2 space-y-2">
                      {selected.notes.length === 0 ? <li className="text-sm text-muted-foreground">{tr("No notes yet.", "لا توجد ملاحظات بعد.")}</li> : null}
                      {selected.notes.map((n) => (
                        <li key={n.id} className="rounded-lg bg-muted p-3 text-sm">
                          <p className="text-xs text-muted-foreground">{n.author} · {date(n.at, true)}</p>
                          <p className="mt-1">{n.text}</p>
                        </li>
                      ))}
                    </ul>
                    <form onSubmit={addNote} className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr("Add a review note…", "أضف ملاحظة مراجعة…")} aria-label={tr("Note", "ملاحظة")} />
                      <Button type="submit" disabled={busy || !note.trim()}><Send className="rtl:rotate-180" />{tr("Add", "إضافة")}</Button>
                    </form>
                  </div>
                </article>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="lookalikes" className="mt-5 space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card md:flex-row md:items-end">
              <label className="flex-1 space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">{tr("Run a simulated lookalike scan for", "تشغيل فحص افتراضي للنطاقات المشابهة لـ")}</span>
                <NativeSelect value={scanOrg} onChange={(e) => setScanOrg(e.target.value)}>
                  {organizations.map((o) => <option key={o.id} value={o.id}>{pick(o.name)}</option>)}
                </NativeSelect>
              </label>
              <Button onClick={runScan} disabled={busy || scanning || !scanOrg}><Radar />{scanning ? tr("Scanning…", "جارٍ الفحص…") : tr("Run simulated scan", "تشغيل الفحص الافتراضي")}</Button>
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
                      <td className="p-3 text-xs">{date(l.firstSeen)}<p className="text-muted-foreground">{l.registrar}</p></td>
                      <td className="p-3 min-w-44">
                        <NativeSelect aria-label={tr("Status", "الحالة")} value={l.status} disabled={busy} onChange={(e) => { void change({ action: "lookalike_status", id: l.id, status: e.target.value as LookalikeStatus }).catch(() => {}); }}>
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
          <TabsContent value="publishing" className="mt-5"><AlertManager /></TabsContent>
        </Tabs>
      </section>
    </>
  );
}

function OfficerReviewLink() {
  const { tr } = useI18n(); const session = useStaffSession();
  if (!isVerificationOfficer(session.roles)) return null;
  return <Button asChild variant="outline" size="sm"><Link to="/organizations" hash="organization-access">{tr("Organization review", "مراجعة الجهات")}</Link></Button>;
}
