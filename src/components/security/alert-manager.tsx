import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/common/native-select";
import { useI18n } from "@/lib/i18n/i18n";
import { useStaffSession } from "@/lib/security/session";
import { listManagedAlerts, manageAlert } from "@/lib/alerts/alerts.functions";
import { alertCategory, bulletinStatus } from "@/lib/alerts/labels";
import { mayManageAlert, type AlertContent, type ManagedAlert } from "@/lib/alerts/schema";
const empty: AlertContent = { title: { en: "", ar: "" }, category: "bank", severity: "high", explanation: { en: "", ar: "" }, safety: { en: "", ar: "" } };
export function AlertManager() {
  const { tr, pick, date } = useI18n(); const session = useStaffSession(); const qc = useQueryClient();
  const read = useServerFn(listManagedAlerts); const command = useServerFn(manageAlert);
  const query = useQuery({ queryKey: ["managed-bulletins", session.user?.id], queryFn: () => read(), enabled: session.securityAccess });
  const [selected, setSelected] = useState<ManagedAlert | null>(null); const [content, setContent] = useState<AlertContent>(empty); const [note, setNote] = useState(""); const [reviewed, setReviewed] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const editable = mayManageAlert(session.roles, "save", selected?.status);
  async function act(action: "save" | "approve" | "publish" | "reject" | "withdraw") {
    setBusy(true); setError("");
    try { await command({ data: { ...(selected ? { id: selected.id, revision: selected.revision } : {}), action, ...(action === "save" ? { content } : {}), note, privacyReviewed: reviewed } }); await query.refetch(); await qc.invalidateQueries({ queryKey: ["published-security-alerts"] }); setSelected(null); setContent(empty); setNote(""); setReviewed(false); }
    catch { setError(tr("Not saved. Check the required fields, permissions, independent review and current status. Public content must exclude personal contacts, links, private evidence and allegations.", "لم يُحفظ. تحقق من الحقول والصلاحيات والمراجعة المستقلة والحالة. يجب استبعاد بيانات الاتصال والروابط والأدلة الخاصة والادعاءات من المحتوى العام.")); } finally { setBusy(false); }
  }
  if (query.isError) return <p role="alert">{tr("Alert management could not load.", "تعذّر تحميل إدارة التنبيهات.")}</p>;
  return <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
    <div className="space-y-3"><Button onClick={() => { setSelected(null); setContent(empty); setNote(""); setReviewed(false); }}>{tr("New draft alert", "مسودة تنبيه جديدة")}</Button>{query.data?.alerts.map(row => <Button key={row.id} variant="outline" className="h-auto w-full flex-col items-start whitespace-normal text-start" onClick={() => { setSelected(row); setContent(row.content); setReviewed(false); setNote(""); }}>{pick(row.content.title)}<span className="text-xs text-muted-foreground">{pick(bulletinStatus[row.status])}</span></Button>)}</div>
    <form className="space-y-4 rounded-2xl border bg-card p-5 shadow-card" onSubmit={(e: FormEvent) => { e.preventDefault(); void act("save"); }}>
      <h2 className="text-lg font-semibold">{tr("Public alert review & publishing", "مراجعة ونشر التنبيهات العامة")}</h2>
      {(["title", "explanation", "safety"] as const).map(field => <div key={field} className="grid gap-3 sm:grid-cols-2">{(["en", "ar"] as const).map(lang => { const label = `${field === "title" ? tr("Warning title", "عنوان التحذير") : field === "explanation" ? tr("Scam explanation", "شرح الاحتيال") : tr("Safety action", "إجراء الأمان")} (${lang === "en" ? "English" : "العربية"})`; return <div key={lang} className="space-y-1"><Label htmlFor={`alert-${field}-${lang}`}>{label}</Label>{field === "title" ? <Input id={`alert-${field}-${lang}`} dir={lang === "ar" ? "rtl" : "ltr"} maxLength={500} value={content[field][lang]} disabled={!editable || busy} onChange={e => setContent({ ...content, [field]: { ...content[field], [lang]: e.target.value } })} /> : <Textarea id={`alert-${field}-${lang}`} dir={lang === "ar" ? "rtl" : "ltr"} maxLength={500} value={content[field][lang]} disabled={!editable || busy} onChange={e => setContent({ ...content, [field]: { ...content[field], [lang]: e.target.value } })} />}</div>; })}</div>)}
      <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1">{tr("Scam category", "نوع الاحتيال")}<NativeSelect aria-label={tr("Scam category", "نوع الاحتيال")} disabled={!editable || busy} value={content.category} onChange={e => setContent({ ...content, category: e.target.value as AlertContent["category"] })}>{Object.entries(alertCategory).map(([key,label]) => <option key={key} value={key}>{pick(label)}</option>)}</NativeSelect></label><label className="space-y-1">{tr("Severity", "الخطورة")}<NativeSelect aria-label={tr("Alert severity", "خطورة التنبيه")} value={content.severity} disabled={!editable || busy} onChange={e => setContent({ ...content, severity: e.target.value as AlertContent["severity"] })}>{(["low","medium","high","critical"] as const).map(value => <option key={value} value={value}>{tr(value, { low: "منخفضة", medium: "متوسطة", high: "مرتفعة", critical: "حرجة" }[value])}</option>)}</NativeSelect></label></div>
      <Label htmlFor="alert-note">{tr("Private decision note", "ملاحظة القرار الخاصة")}</Label><Textarea id="alert-note" dir="auto" value={note} maxLength={500} onChange={e => setNote(e.target.value)} />
      {session.roles.includes("security_supervisor") && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />{tr("I independently reviewed this warning: no personal information, private evidence, investigation details or unverified allegations.", "راجعت التحذير بشكل مستقل: لا يحتوي معلومات شخصية أو أدلة خاصة أو تفاصيل تحقيق أو ادعاءات غير موثقة.")}</label>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">{editable && <Button type="submit" disabled={busy}>{tr("Save draft", "حفظ المسودة")}</Button>}{(["approve","publish","reject","withdraw"] as const).filter(action => mayManageAlert(session.roles, action, selected?.status)).map(action => <Button type="button" key={action} variant={action === "withdraw" || action === "reject" ? "danger" : "outline"} disabled={busy} onClick={() => void act(action)}>{tr({ approve: "Approve alert", publish: "Publish alert", reject: "Reject alert", withdraw: "Withdraw alert" }[action], { approve: "اعتماد التنبيه", publish: "نشر التنبيه", reject: "رفض التنبيه", withdraw: "سحب التنبيه" }[action])}</Button>)}</div>
      {selected && <div className="border-t pt-3"><h3 className="text-sm font-semibold">{tr("Private audit history", "سجل الإجراءات الخاص")}</h3>{query.data?.audit.filter(event => event.bulletin_id === selected.id).map((event,index) => <div key={index} className="mt-2 text-xs"><p>{event.action === "save" ? tr("Draft saved", "حُفظت المسودة") : event.action === "approve" ? tr("Approved", "اعتُمد") : event.action === "publish" ? tr("Published", "نُشر") : event.action === "reject" ? tr("Rejected", "رُفض") : tr("Withdrawn", "سُحب")} · {date(event.at,true)}</p><p dir="auto">{event.note}</p></div>)}</div>}
    </form>
  </div>;
}