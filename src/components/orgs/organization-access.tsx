import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, LogIn, LogOut, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffSession } from "@/lib/security/session";
import { useI18n } from "@/lib/i18n/i18n";
import { readOrganizationApplications, reviewOrganizationApplication, changeOrganizationChannel } from "@/lib/organizations/applications.functions";
import { documentsSchema, type ApplicationStatus } from "@/lib/organizations/schema";
import { refreshOrganizationRegistry } from "@/lib/data/local-store";
import type { Bi, ChannelAuditEvent } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/common/native-select";
import { ChannelManager } from "./channel-manager";
import { RegisterOrgDialog, downloadApplicationDocument } from "./register-org-dialog";

const statusLabels: Record<ApplicationStatus, Bi> = {
  pending: { en: "Pending review", ar: "قيد المراجعة" }, approved: { en: "Approved", ar: "معتمد" }, rejected: { en: "Rejected", ar: "مرفوض" }, needs_information: { en: "Additional information requested", ar: "مطلوب معلومات إضافية" }, suspended: { en: "Suspended", ar: "موقوف" }, removed: { en: "Removed from registry", ar: "مزال من السجل" },
};

export function OrganizationAccess() {
  const { tr, pick, date, dir, num } = useI18n();
  const session = useStaffSession();
  const queryClient = useQueryClient();
  const readApplications = useServerFn(readOrganizationApplications);
  const reviewApplication = useServerFn(reviewOrganizationApplication);
  const changeChannel = useServerFn(changeOrganizationChannel);
  const query = useQuery({ queryKey: ["organization-applications", session.user?.id], queryFn: () => readApplications(), enabled: session.ready && !!session.user, retry: false });
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(""); const [reference, setReference] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected" | "needs_information" | "suspended" | "removed">("approved");
  const [note, setNote] = useState(""); const [confirmed, setConfirmed] = useState<string[]>([]);
  const data = session.user && query.data?.officer ? query.data : undefined;
  const selected = data?.applications.find(a => a.id === selectedId) ?? data?.applications[0];
  const owned = selected?.owner_id === session.user?.id;
  const officer = data?.officer === true;
  const documents = selected ? documentsSchema.parse(selected.documents) : [];
  const audit = selected && Array.isArray(selected.audit) ? selected.audit as Array<Record<string, unknown>> : [];
  const channelAudit = audit.flatMap(event => Array.isArray(event['details']) ? event['details'] as ChannelAuditEvent[] : []);

  async function login(e: FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      const checked = await supabase.auth.getUser();
      if (!checked.data.user) throw new Error("Session unavailable");
      await queryClient.invalidateQueries({ queryKey: ["organization-applications"] });
      setPassword("");
    } catch { setError(tr("Unable to sign in. Check your officer account details and try again.", "تعذّر الدخول. تحقق من بيانات حساب الموظف المخوّل ثم حاول مجدداً.")); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); await queryClient.cancelQueries(); queryClient.clear();
    const result = await supabase.auth.signOut();
    if (result.error) setError(tr("Sign out failed. Please try again.", "تعذّر تسجيل الخروج. حاول مجدداً."));
    else { setSelectedId(""); setReference(""); setNote(""); setConfirmed([]); }
    setBusy(false);
  }
  async function changed() { await queryClient.invalidateQueries({ queryKey: ["organization-applications"] }); await refreshOrganizationRegistry(); }
  async function review(e: FormEvent) {
    e.preventDefault(); if (!selected) return; setBusy(true); setError("");
    try {
      await reviewApplication({ data: { id: selected.id, revision: selected.revision, decision, note, domainsConfirmed: selected.payload.domains.every(d => confirmed.includes(d)) } });
      await changed(); setNote(""); setConfirmed([]);
    } catch { setError(tr("Review denied or the application changed. Reload and verify your assigned role and independence.", "رُفضت المراجعة أو تغيّر الطلب. أعد التحميل وتحقق من دورك المعيّن واستقلالية المراجعة.")); }
    finally { setBusy(false); }
  }

  return <div id="organization-access" dir={dir} className="mb-8 scroll-mt-24 border-b pb-8">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="size-5 text-emerald" />{tr("Authorized Officer Login", "دخول الموظف المخوّل")}</h2>{session.user && <Button variant="outline" size="sm" onClick={signOut} disabled={busy}><LogOut />{tr("Logout", "تسجيل الخروج")}</Button>}</div>
    {!session.user ? <form onSubmit={login} className="max-w-xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="organization-login-email">{tr("Email", "البريد الإلكتروني")}</Label><Input id="organization-login-email" type="email" dir="ltr" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="organization-login-password">{tr("Password", "كلمة المرور")}</Label><Input id="organization-login-password" type="password" dir="ltr" autoComplete="current-password" minLength={1} required value={password} onChange={e => setPassword(e.target.value)} /></div></div>
      <Button type="submit" disabled={busy || !session.ready}><LogIn />{tr("Login", "تسجيل الدخول")}</Button>
      <p className="text-xs text-muted-foreground">{tr("Officer access requires an independently assigned verification-officer role.", "يتطلب دخول الموظفين دور مراجع مُعيّناً بشكل مستقل.")}</p>
    </form> : <>
      {query.isPending && <p role="status" className="text-sm text-muted-foreground">{tr("Checking account access…", "جارٍ التحقق من صلاحيات الحساب…")}</p>}
      {query.isError && <div className="space-y-2"><p role="alert" className="text-sm text-destructive">{tr("Verification officer access is required to view internal applications.", "يلزم دور موظف التحقق لعرض الطلبات الداخلية.")}</p><Button variant="outline" onClick={() => query.refetch()}>{tr("Retry", "إعادة المحاولة")}</Button></div>}
      {data && <div className="space-y-5">
        <h3 className="text-lg font-semibold">{tr("Officer review & approval", "مراجعة واعتماد الموظف المخوّل")}</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{tr("Registered", "مسجّلة")}</p><p className="mt-1 text-2xl font-semibold">{num(data.applications.length)}</p></div>
          <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{tr("Verified", "موثّقة")}</p><p className="mt-1 text-2xl font-semibold text-verified">{num(data.applications.filter(a => a.status === "approved").length)}</p></div>
          <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{tr("Pending review", "قيد المراجعة")}</p><p className="mt-1 text-2xl font-semibold text-unverified">{num(data.applications.filter(a => a.status === "pending" || a.status === "needs_information").length)}</p></div>
          <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{tr("Suspended", "موقوفة")}</p><p className="mt-1 text-2xl font-semibold text-suspicious">{num(data.applications.filter(a => a.status === "suspended").length)}</p></div>
        </div>
        <form className="flex max-w-xl gap-2" onSubmit={e => { e.preventDefault(); const found = data.applications.find(a => a.reference.toLowerCase() === reference.trim().toLowerCase()); if (found) { setSelectedId(found.id); setError(""); } else setError(tr("No application with this reference is available to your account.", "لا يوجد طلب بهذا المرجع متاح لحسابك.")); }}><Input aria-label={tr("Application reference", "مرجع الطلب")} dir="ltr" value={reference} onChange={e => setReference(e.target.value)} placeholder="TZ-ORG-…" /><Button type="submit" variant="outline"><Search />{tr("Track", "متابعة")}</Button></form>
        {data.applications.length > 0 ? <div className="space-y-5">
          <NativeSelect aria-label={tr("Saved application", "الطلب المحفوظ")} value={selected?.id ?? ""} onChange={e => { setSelectedId(e.target.value); setConfirmed([]); setNote(""); }}>{data.applications.map(a => <option key={a.id} value={a.id}>{pick(a.payload.name)} · {pick(statusLabels[a.status as ApplicationStatus])}</option>)}</NativeSelect>
          {selected && <>
            <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 space-y-2"><h4 className="text-lg font-semibold">{pick(selected.payload.name)}</h4><p className="break-all font-mono text-xs" dir="ltr">{selected.reference}</p><Badge variant={selected.status === "approved" ? "verified" : "unverified"}>{pick(statusLabels[selected.status as ApplicationStatus])}</Badge><p className="text-xs text-muted-foreground">{tr("Original submission", "الإرسال الأصلي")}: {date(selected.submitted_at, true)} · {tr("Edit deadline", "موعد انتهاء التعديل")}: {date(new Date(Date.parse(selected.submitted_at) + 86400000).toISOString(), true)}</p></div>
            <RegisterOrgDialog key={`${selected.id}:${selected.revision}`} application={{ id: selected.id, revision: selected.revision, payload: selected.payload, documents, reference: selected.reference, editable: false }} trigger={<Button variant="outline">{tr("Review saved application", "مراجعة الطلب المحفوظ")}</Button>} /></div>
            {selected.correction_note && <p dir="auto" className="border-s-4 border-emerald bg-accent p-3 text-sm">{selected.correction_note}</p>}
            {documents.map(d => <div key={d.id} className="flex items-center gap-2"><span className="min-w-0 break-all text-sm" dir="auto">{d.name}</span><Button size="icon" variant="ghost" title={tr("Download document", "تنزيل المستند")} aria-label={tr("Download document", "تنزيل المستند")} onClick={() => downloadApplicationDocument(d)}><Download /></Button></div>)}
            {officer && !owned && <form onSubmit={review} className="max-w-xl space-y-3">
              <Label htmlFor="organization-decision">{tr("Review decision", "قرار المراجعة")}</Label><NativeSelect id="organization-decision" value={decision} onChange={e => setDecision(e.target.value as typeof decision)}>{(["approved", "rejected", "needs_information", "suspended", "removed"] as const).map(s => <option key={s} value={s}>{pick(statusLabels[s])}</option>)}</NativeSelect>
              {decision === "approved" && <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">{tr("Domain ownership review (fictional prototype)", "مراجعة ملكية النطاق (نموذج خيالي)")}</legend>{selected.payload.domains.map(domain => <label key={domain} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-emerald" checked={confirmed.includes(domain)} onChange={e => setConfirmed(list => e.target.checked ? [...list, domain] : list.filter(d => d !== domain))} /><span dir="ltr" className="break-all font-mono">{domain}</span></label>)}</fieldset>}
              <Label htmlFor="organization-review-note">{tr("Evidence / decision / requested corrections", "الدليل / القرار / التصحيحات المطلوبة")}</Label><Textarea id="organization-review-note" dir="auto" maxLength={1000} required value={note} onChange={e => setNote(e.target.value)} />
              <Button type="submit" disabled={busy || !note.trim() || (decision === "approved" && !selected.payload.domains.every(d => confirmed.includes(d)))}><ShieldCheck />{tr("Save review decision", "حفظ قرار المراجعة")}</Button>
            </form>}
            <ChannelManager key={`${selected.id}:${selected.revision}:channels`} org={selected.payload} actor={officer && !owned ? { role: "verifier" } : { role: "viewer" }} auditEvents={channelAudit} onCommand={async command => { await changeChannel({ data: { id: selected.id, revision: selected.revision, command } }); await changed(); }} />
            <details className="border-t pt-3"><summary className="cursor-pointer text-sm font-medium">{tr("Application change history", "سجل تغييرات الطلب")}</summary><ol className="mt-3 space-y-3">{audit.map((event, index) => <li key={index} className="border-s ps-3 text-xs"><p>{typeof event['at'] === "string" ? date(event['at'], true) : tr("Original fictional record", "سجل خيالي أصلي")}</p><p>{event['operation'] === "create" ? tr("Application submitted", "تم إرسال الطلب") : event['operation'] === "edit" ? tr("Original application edited", "تم تعديل الطلب الأصلي") : tr("Review / channel event", "حدث مراجعة / قناة")}</p>{typeof event['note'] === "string" && <p dir="auto" className="mt-1">{event['operation'] === "legacy_fictional_record" ? tr("Preserved fictional sample", "عينة خيالية محفوظة") : event['note']}</p>}</li>)}</ol></details>
          </>}
        </div> : <p className="text-sm text-muted-foreground">{tr("No saved applications for this account.", "لا توجد طلبات محفوظة لهذا الحساب.")}</p>}
      </div>}
    </>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
  </div>;
}