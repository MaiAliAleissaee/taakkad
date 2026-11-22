import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Download, FileQuestion, LayoutDashboard, Search, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n";
import { useStaffSession } from "@/lib/security/session";
import { readOrganizationApplications, reviewOrganizationApplication, changeOrganizationChannel } from "@/lib/organizations/applications.functions";
import { documentsSchema, type ApplicationStatus } from "@/lib/organizations/schema";
import { canSubmitDecision, filterQueue, queueStats, type QueueFilter } from "@/lib/organizations/officer-queue";
import { refreshOrganizationRegistry } from "@/lib/data/local-store";
import type { Bi, ChannelAuditEvent } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/common/native-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StaffSignOut } from "@/components/security/staff-sign-out";
import { ChannelManager } from "./channel-manager";
import { RegisterOrgDialog, downloadApplicationDocument } from "./register-org-dialog";
import { orgTypeLabel } from "@/lib/i18n/labels";

const statusLabels: Record<ApplicationStatus, Bi> = {
  pending: { en: "New — awaiting review", ar: "جديد — بانتظار المراجعة" }, approved: { en: "Approved", ar: "معتمد" }, rejected: { en: "Rejected", ar: "مرفوض" }, needs_information: { en: "Additional Information Required", ar: "مطلوب معلومات إضافية" }, suspended: { en: "Suspended", ar: "موقوف" }, removed: { en: "Removed from registry", ar: "مزال من السجل" },
};
type Decision = "approved" | "rejected" | "needs_information";

export function OfficerDashboard() {
  const { tr, pick, date, dir, num } = useI18n();
  const session = useStaffSession();
  const queryClient = useQueryClient();
  const readApplications = useServerFn(readOrganizationApplications);
  const reviewApplication = useServerFn(reviewOrganizationApplication);
  const changeChannel = useServerFn(changeOrganizationChannel);
  const query = useQuery({ queryKey: ["organization-applications", session.user?.id], queryFn: () => readApplications(), enabled: session.ready && !!session.user, retry: false });
  const [term, setTerm] = useState(""); const [status, setStatus] = useState<QueueFilter>("all");
  const [selectedId, setSelectedId] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState(""); const [confirmed, setConfirmed] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const apps = query.data?.applications ?? [];
  const stats = queueStats(apps);
  const rows = useMemo(() => filterQueue(apps, term, status), [apps, term, status]);
  const selected = apps.find(a => a.id === selectedId);

  function open(id: string) { setSelectedId(id); setDecision(null); setNote(""); setConfirmed([]); setError(""); setNotice(""); window.scrollTo({ top: 0 }); }
  async function changed() { await queryClient.invalidateQueries({ queryKey: ["organization-applications"] }); await refreshOrganizationRegistry(); }
  async function submit() {
    if (!selected || !decision) return; setBusy(true); setError("");
    try {
      await reviewApplication({ data: { id: selected.id, revision: selected.revision, decision, note, domainsConfirmed: selected.payload.domains.every(d => confirmed.includes(d)) } });
      await changed();
      setNotice(decision === "needs_information"
        ? tr("Correction request saved. The applicant sees it after verifying through secure application tracking. No email notification was sent.", "تم حفظ طلب التصحيح. يراه مقدم الطلب بعد التحقق عبر متابعة الطلب الآمنة. لم يُرسل إشعار بالبريد.")
        : tr("Decision saved and the applicant tracking result updated.", "تم حفظ القرار وتحديث نتيجة متابعة الطلب."));
      setDecision(null); setNote(""); setConfirmed([]);
    } catch { setError(tr("Review denied or the application changed. Reload and verify your assigned role and independence.", "رُفضت المراجعة أو تغيّر الطلب. أعد التحميل وتحقق من دورك المعيّن واستقلالية المراجعة.")); }
    finally { setBusy(false); setConfirming(false); }
  }

  const nav = <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
    <div><p className="text-xs font-medium uppercase tracking-wide text-emerald">{tr("Staff workspace", "مساحة عمل الموظفين")}</p><h1 className="text-2xl font-semibold">{tr("Organization Verification Officer Dashboard", "لوحة موظف التحقق من الجهات")}</h1></div>
    <div className="flex flex-wrap gap-2">{session.securityAccess && <Button asChild variant="outline" size="sm"><Link to="/security"><LayoutDashboard />{tr("Security Dashboard", "لوحة التحكم الأمنية")}</Link></Button>}<StaffSignOut /></div>
  </div>;

  if (query.isPending) return <div dir={dir}>{nav}<p role="status" className="text-sm text-muted-foreground">{tr("Checking officer access…", "جارٍ التحقق من صلاحيات الموظف…")}</p></div>;
  if (query.isError || !query.data?.officer) return <div dir={dir}>{nav}<p role="alert" className="text-sm text-destructive">{tr("Verification officer access is required to view internal applications.", "يلزم دور موظف التحقق لعرض الطلبات الداخلية.")}</p></div>;

  if (selected) {
    const documents = documentsSchema.parse(selected.documents);
    const audit = Array.isArray(selected.audit) ? selected.audit as Array<Record<string, unknown>> : [];
    const channelAudit = audit.flatMap(event => Array.isArray(event['details']) ? event['details'] as ChannelAuditEvent[] : []);
    const owned = selected.owner_id === session.user?.id;
    const decidable = !owned && (selected.status === "pending" || selected.status === "needs_information");
    const ready = !!decision && canSubmitDecision(decision, note, selected.payload.domains, confirmed);
    return <div dir={dir} className="space-y-6">
      {nav}
      <Button variant="ghost" size="sm" onClick={() => { setSelectedId(""); setNotice(""); }}><ArrowLeft className="rtl:rotate-180" />{tr("Return to applications list", "العودة إلى قائمة الطلبات")}</Button>
      {notice && <p role="status" className="rounded-md border border-emerald/40 bg-accent p-3 text-sm">{notice}</p>}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card p-5 shadow-card">
        <div className="min-w-0 space-y-2"><h2 className="text-xl font-semibold">{pick(selected.payload.name)}</h2><p className="break-all font-mono text-xs" dir="ltr">{selected.reference}</p><Badge variant={selected.status === "approved" ? "verified" : selected.status === "rejected" ? "suspicious" : "unverified"}>{pick(statusLabels[selected.status as ApplicationStatus])}</Badge>
          <p className="text-xs text-muted-foreground">{tr("Submitted", "تاريخ الإرسال")}: {date(selected.submitted_at, true)} · {tr("Applicant edit deadline", "موعد انتهاء تعديل مقدم الطلب")}: {date(new Date(Date.parse(selected.submitted_at) + 86400000).toISOString(), true)}</p></div>
        <RegisterOrgDialog key={`${selected.id}:${selected.revision}`} application={{ id: selected.id, revision: selected.revision, payload: selected.payload, documents, reference: selected.reference, editable: false }} trigger={<Button variant="outline">{tr("View full submitted form", "عرض النموذج المقدّم كاملاً")}</Button>} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5"><h3 className="mb-3 font-semibold">{tr("Identity & registration", "الهوية وبيانات التسجيل")}</h3><dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{tr("English name", "الاسم بالإنجليزية")}</dt><dd dir="ltr">{selected.payload.name.en}</dd>
          <dt className="text-muted-foreground">{tr("Arabic name", "الاسم بالعربية")}</dt><dd dir="rtl">{selected.payload.name.ar}</dd>
          <dt className="text-muted-foreground">{tr("Type", "النوع")}</dt><dd>{pick(orgTypeLabel[selected.payload.type])}</dd>
          <dt className="text-muted-foreground">{tr("Domains", "النطاقات")}</dt><dd dir="ltr" className="break-all font-mono text-xs">{selected.payload.domains.join(", ")}</dd>
          <dt className="text-muted-foreground">{tr("Contact", "جهة الاتصال")}</dt><dd dir="ltr" className="break-all">{selected.payload.contactEmail || "—"}</dd>
        </dl></section>
        <section className="rounded-xl border bg-card p-5"><h3 className="mb-3 font-semibold">{tr("Supporting documents (staff only)", "المستندات الداعمة (للموظفين فقط)")}</h3>
          {documents.length ? documents.map(d => <div key={d.id} className="flex items-center gap-2"><span className="min-w-0 break-all text-sm" dir="auto">{d.name}</span><Button size="icon" variant="ghost" title={tr("Download document", "تنزيل المستند")} aria-label={tr("Download document", "تنزيل المستند")} onClick={() => downloadApplicationDocument(d)}><Download /></Button></div>) : <p className="text-sm text-muted-foreground">{tr("No documents uploaded.", "لم تُرفع مستندات.")}</p>}
          {selected.correction_note && <div className="mt-4"><p className="text-xs text-muted-foreground">{tr("Latest review note", "آخر ملاحظة مراجعة")}</p><p dir="auto" className="border-s-4 border-emerald bg-accent p-3 text-sm">{selected.correction_note}</p></div>}
        </section>
      </div>
      {decidable ? <section className="space-y-4 rounded-xl border bg-card p-5">
        <h3 className="font-semibold">{tr("Officer review actions", "إجراءات مراجعة الموظف")}</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant={decision === "approved" ? "emerald" : "outline"} onClick={() => setDecision("approved")}><CheckCircle2 />{tr("Approve Application", "اعتماد الطلب")}</Button>
          <Button variant={decision === "rejected" ? "destructive" : "outline"} onClick={() => setDecision("rejected")}><XCircle />{tr("Reject Application", "رفض الطلب")}</Button>
          <Button variant={decision === "needs_information" ? "default" : "outline"} onClick={() => setDecision("needs_information")}><FileQuestion />{tr("Request Additional Information", "طلب معلومات إضافية")}</Button>
        </div>
        {decision && <form className="max-w-xl space-y-3" onSubmit={e => { e.preventDefault(); if (!ready) return; if (decision === "needs_information") void submit(); else setConfirming(true); }}>
          {decision === "approved" && <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">{tr("Confirm domain ownership review (fictional prototype)", "تأكيد مراجعة ملكية النطاق (نموذج خيالي)")}</legend>{selected.payload.domains.map(domain => <label key={domain} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-emerald" checked={confirmed.includes(domain)} onChange={e => setConfirmed(list => e.target.checked ? [...list, domain] : list.filter(d => d !== domain))} /><span dir="ltr" className="break-all font-mono">{domain}</span></label>)}</fieldset>}
          <Label htmlFor="officer-note">{decision === "rejected" ? tr("Documented reason for rejection", "سبب الرفض الموثّق") : decision === "needs_information" ? tr("Missing documents or corrections required", "المستندات الناقصة أو التصحيحات المطلوبة") : tr("Approval evidence note", "ملاحظة أدلة الاعتماد")}</Label>
          <Textarea id="officer-note" dir="auto" maxLength={1000} required value={note} onChange={e => setNote(e.target.value)} />
          {decision === "needs_information" && <p className="text-xs text-muted-foreground">{tr("Visible only to the applicant through secure application tracking.", "تظهر لمقدم الطلب فقط عبر متابعة الطلب الآمنة.")}</p>}
          <Button type="submit" disabled={busy || !ready}>{decision === "needs_information" ? tr("Send correction request", "إرسال طلب التصحيح") : tr("Continue", "متابعة")}</Button>
        </form>}
      </section> : <p className="text-sm text-muted-foreground">{owned ? tr("You cannot review an application you own.", "لا يمكنك مراجعة طلب تملكه.") : tr("This application already has a final decision. Channels can still be managed below.", "صدر قرار نهائي لهذا الطلب. يمكن إدارة القنوات أدناه.")}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <ChannelManager key={`${selected.id}:${selected.revision}:channels`} org={selected.payload} actor={!owned ? { role: "verifier" } : { role: "viewer" }} auditEvents={channelAudit} onCommand={async command => { await changeChannel({ data: { id: selected.id, revision: selected.revision, command } }); await changed(); }} />
      <section className="rounded-xl border bg-card p-5"><h3 className="mb-3 font-semibold">{tr("Review notes & decision history", "ملاحظات المراجعة وسجل القرارات")}</h3><ol className="space-y-3">{audit.map((event, index) => <li key={index} className="border-s ps-3 text-xs"><p className="text-muted-foreground">{typeof event['at'] === "string" ? date(event['at'], true) : tr("Original fictional record", "سجل خيالي أصلي")}</p><p className="font-medium">{event['operation'] === "create" ? tr("Application submitted", "تم إرسال الطلب") : event['operation'] === "edit" ? tr("Applicant corrected application", "صحّح مقدم الطلب الطلب") : event['operation'] === "review" ? tr("Officer decision", "قرار الموظف") : tr("Channel event", "حدث قناة")}</p>{typeof event['note'] === "string" && event['note'] && <p dir="auto" className="mt-1">{event['operation'] === "legacy_fictional_record" ? tr("Preserved fictional sample", "عينة خيالية محفوظة") : event['note']}</p>}</li>)}</ol></section>
      <AlertDialog open={confirming} onOpenChange={setConfirming}><AlertDialogContent dir={dir}><AlertDialogHeader><AlertDialogTitle>{decision === "approved" ? tr("Approve this application?", "اعتماد هذا الطلب؟") : tr("Reject this application?", "رفض هذا الطلب؟")}</AlertDialogTitle><AlertDialogDescription>{decision === "approved" ? tr("Only individually approved active channels will appear in the Public Trust Portal. Documents and notes stay private.", "ستظهر في بوابة الثقة العامة القنوات المعتمدة النشطة فقط. تبقى المستندات والملاحظات خاصة.") : tr("The applicant will see the rejected status through secure tracking.", "سيرى مقدم الطلب حالة الرفض عبر المتابعة الآمنة.")}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>{tr("Cancel", "إلغاء")}</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={e => { e.preventDefault(); void submit(); }}>{tr("Confirm", "تأكيد")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>;
  }

  const tiles: Array<[string, number, string, QueueFilter]> = [[tr("Total received", "إجمالي المستلمة"), stats.total, "", "all"], [tr("New — awaiting review", "جديدة بانتظار المراجعة"), stats.pending, "text-unverified", "pending"], [tr("Additional info required", "مطلوب معلومات إضافية"), stats.needsInformation, "text-unverified", "needs_information"], [tr("Approved", "معتمدة"), stats.approved, "text-verified", "approved"], [tr("Rejected", "مرفوضة"), stats.rejected, "text-suspicious", "rejected"]];
  return <div dir={dir} className="space-y-5">
    {nav}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{tiles.map(([label, value, tone, f]) => <button key={f} type="button" onClick={() => setStatus(f)} className={`rounded-lg border bg-card p-4 text-start transition-colors hover:border-emerald ${status === f ? "border-emerald" : ""}`}><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-semibold ${tone}`}>{num(value)}</p></button>)}</div>
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-card md:flex-row">
      <div className="relative flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={term} onChange={e => setTerm(e.target.value)} className="ps-9" placeholder={tr("Search application number or organization", "ابحث برقم الطلب أو اسم الجهة")} aria-label={tr("Search applications", "البحث في الطلبات")} /></div>
      <NativeSelect className="md:w-64" aria-label={tr("Status", "الحالة")} value={status} onChange={e => setStatus(e.target.value as QueueFilter)}><option value="all">{tr("All statuses", "كل الحالات")}</option>{(Object.keys(statusLabels) as ApplicationStatus[]).map(s => <option key={s} value={s}>{pick(statusLabels[s])}</option>)}</NativeSelect>
    </div>
    <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-start text-xs text-muted-foreground"><tr><th className="p-3 text-start">{tr("Application number", "رقم الطلب")}</th><th className="p-3 text-start">{tr("Organization", "الجهة")}</th><th className="p-3 text-start">{tr("Submitted", "تاريخ الإرسال")}</th><th className="p-3 text-start">{tr("Status", "الحالة")}</th><th className="p-3 text-start">{tr("Actions", "الإجراءات")}</th></tr></thead>
      <tbody>{rows.map(a => <tr key={a.id} className="border-b last:border-0"><td className="p-3 font-mono text-xs" dir="ltr">{a.reference.slice(0, 15)}…</td><td className="p-3">{pick(a.payload.name)}</td><td className="p-3 text-xs">{date(a.submitted_at, true)}</td><td className="p-3"><Badge variant={a.status === "approved" ? "verified" : a.status === "rejected" ? "suspicious" : "unverified"}>{pick(statusLabels[a.status as ApplicationStatus])}</Badge></td><td className="p-3"><Button size="sm" variant="outline" onClick={() => open(a.id)}>{tr("Review", "مراجعة")}</Button></td></tr>)}</tbody></table>
      {!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">{tr("No applications match these filters.", "لا توجد طلبات مطابقة.")}</p>}</div>
  </div>;
}
