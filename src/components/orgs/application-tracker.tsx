import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, LockKeyhole, RefreshCw, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n";
import { requestApplicationCode, verifyApplicationCode, readTrackedApplication } from "@/lib/organizations/tracking.functions";
import { documentsSchema, editingRemaining, type ApplicationReceipt } from "@/lib/organizations/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RegisterOrgDialog } from "./register-org-dialog";

export function ApplicationTracker({ receipt }: { receipt: ApplicationReceipt | null }) {
  const { tr, date } = useI18n();
  const requestCode = useServerFn(requestApplicationCode); const verifyCode = useServerFn(verifyApplicationCode); const read = useServerFn(readTrackedApplication);
  const [reference, setReference] = useState(""); const [secret, setSecret] = useState(""); const [code, setCode] = useState("");
  const [sent, setSent] = useState(false); const [showCredentials, setShowCredentials] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState<"" | "verification" | "expired" | "access">("");
  const [grant, setGrant] = useState<{ id: string; token: string; expiresAt: string } | null>(null);
  const [application, setApplication] = useState<Awaited<ReturnType<typeof readTrackedApplication>> | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (receipt) { setReference(receipt.reference); setSecret(receipt.secret); setShowCredentials(true); setApplication(null); setGrant(null); setSent(false); } }, [receipt]);
  useEffect(() => { if (grant && now > Date.parse(grant.expiresAt)) { setGrant(null); setApplication(null); setSent(false); setError("expired"); } }, [now, grant]);
  const submittedAt = application?.submittedAt ?? receipt?.submittedAt;
  const remaining = submittedAt ? editingRemaining(submittedAt, now) : 0;
  const editable = !!application && (remaining > 0 || application.status === "needs_information");
  const minutes = Math.ceil(remaining / 60000);
  const remainingText = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
  async function retrieve(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { if (!sent) { await requestCode({ data: { reference, secret } }); setSent(true); } else { const verified = await verifyCode({ data: { reference, secret, code } }); const result = await read({ data: { id: verified.id, token: verified.token } }); setGrant(verified); setApplication(result); setCode(""); setShowCredentials(false); } }
    catch { setError("verification"); }
    finally { setBusy(false); }
  }
  async function reload() { if (!grant) return; setBusy(true); try { setApplication(await read({ data: { id: grant.id, token: grant.token } })); } catch { setApplication(null); setGrant(null); setError("access"); } finally { setBusy(false); } }
  function saveReceipt() {
    if (!receipt) return;
    const text = `TRUST ZERO AI — private application receipt\nReference: ${receipt.reference}\nTracking secret: ${receipt.secret}\nSubmitted: ${receipt.submittedAt}\nKeep this file private. Email verification is also required.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" })); const link = document.createElement("a"); link.href = url; link.download = "trust-zero-application-receipt.txt"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div id="application-tracking" className="mb-8 scroll-mt-24 border-b pb-8">
    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><LockKeyhole className="size-5 text-emerald" />{tr("Track Application", "متابعة الطلب")}</h2>
    {(receipt || application) && <article className="mb-5 max-w-2xl space-y-3 rounded-lg border bg-card p-5 shadow-card" aria-label={tr("Application status", "حالة الطلب")}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">{tr("Application status", "حالة الطلب")}</h3><Badge variant={application?.status === "approved" ? "verified" : "unverified"}>{application?.status === "approved" ? tr("Approved", "معتمد") : application?.status === "needs_information" ? tr("Additional information requested", "مطلوب معلومات إضافية") : application?.status === "rejected" ? tr("Rejected", "مرفوض") : application?.status === "suspended" || application?.status === "removed" ? tr("Inactive", "غير نشط") : tr("Pending review", "قيد المراجعة")}</Badge></div>
      <p className="break-all font-mono text-xs" dir="ltr">{application?.reference ?? receipt?.reference}</p>
      {submittedAt && <p className="text-xs text-muted-foreground">{tr("Original submission", "الإرسال الأصلي")}: {date(submittedAt, true)} · {tr("Editing time remaining", "وقت التعديل المتبقي")}: <span dir="ltr">{remainingText}</span></p>}
      {receipt && showCredentials && <div className="space-y-2"><Label>{tr("Tracking secret — shown once", "سر التتبع — يُعرض مرة واحدة")}</Label><p dir="ltr" className="break-all font-mono text-sm">{receipt.secret}</p><p className="text-xs text-muted-foreground">{tr("Save both credentials privately. Returning access also requires an email code. We cannot show this secret again.", "احفظ بيانات التتبع بسرية. يتطلب الوصول لاحقاً رمزاً عبر البريد أيضاً. لا يمكن عرض هذا السر مجدداً.")}</p><Button variant="outline" size="sm" onClick={saveReceipt}><Download />{tr("Save private receipt", "حفظ الإيصال الخاص")}</Button><Button variant="ghost" size="sm" onClick={() => setShowCredentials(false)}>{tr("Hide secret", "إخفاء السر")}</Button></div>}
      {application?.correctionNote && <p className="text-sm" dir="auto">{application.correctionNote}</p>}
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => grant ? void reload() : document.getElementById("tracking-reference")?.focus()}><Search />{tr("Track Application", "متابعة الطلب")}</Button>
        {application && grant ? <RegisterOrgDialog key={`${application.id}:${application.revision}`} trackingToken={grant.token} onEdited={reload} application={{ id: application.id, revision: application.revision, payload: application.payload, documents: documentsSchema.parse(application.documents), reference: application.reference, editable }} trigger={<Button disabled={!editable}>{tr("Edit Application", "تعديل الطلب")}</Button>} /> : <Button disabled={remaining <= 0} onClick={() => document.getElementById("tracking-reference")?.focus()}>{tr("Edit Application", "تعديل الطلب")}</Button>}
      </div>
      {remaining <= 0 && application?.status !== "needs_information" && <p className="text-sm text-muted-foreground">{tr("Read only. The original 24-hour editing window has ended.", "للقراءة فقط. انتهت مهلة التعديل الأصلية البالغة 24 ساعة.")}</p>}
    </article>}
    {!grant ? <form onSubmit={retrieve} className="max-w-xl space-y-4">
      <div className="space-y-2"><Label htmlFor="tracking-reference">{tr("Application reference", "مرجع الطلب")}</Label><Input id="tracking-reference" dir="ltr" value={reference} required onChange={e => { setReference(e.target.value); setSent(false); setApplication(null); }} /></div>
      <div className="space-y-2"><Label htmlFor="tracking-secret">{tr("Tracking secret", "سر التتبع")}</Label><Input id="tracking-secret" type="password" dir="ltr" autoComplete="off" value={secret} required onChange={e => { setSecret(e.target.value); setSent(false); setApplication(null); }} /></div>
      {sent && <div className="space-y-2"><p role="status" className="text-sm text-muted-foreground">{tr("Enter the code sent to the application's verification email.", "أدخل الرمز المرسل إلى بريد التحقق الخاص بالطلب.")}</p><Label htmlFor="tracking-code">{tr("Email verification code", "رمز التحقق عبر البريد")}</Label><Input id="tracking-code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" value={code} required maxLength={8} onChange={e => setCode(e.target.value)} /></div>}
      <Button type="submit" disabled={busy}><LockKeyhole />{sent ? tr("Verify & view application", "التحقق وعرض الطلب") : tr("Send email verification code", "إرسال رمز التحقق عبر البريد")}</Button>
      {sent && <Button type="button" variant="ghost" onClick={() => { setSent(false); setCode(""); }}>{tr("Request another code", "طلب رمز آخر")}</Button>}
    </form> : <Button variant="ghost" onClick={() => { setGrant(null); setApplication(null); setSecret(""); setSent(false); }}><RefreshCw />{tr("Close private application", "إغلاق الطلب الخاص")}</Button>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error === "expired" ? tr("Verification expired. Request a new email code.", "انتهت صلاحية التحقق. اطلب رمزاً جديداً عبر البريد.") : error === "access" ? tr("Verify your email again to access this application.", "تحقق من بريدك مجدداً للوصول إلى هذا الطلب.") : tr("Unable to verify. Check the reference, tracking secret and email code; codes may expire or sending may be unavailable.", "تعذّر التحقق. راجع مرجع الطلب وسر التتبع ورمز البريد؛ قد تنتهي صلاحية الرموز أو يتعذر إرسالها.")}</p>}
  </div>;
}