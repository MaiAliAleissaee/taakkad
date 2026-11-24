import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle2, Clock3, XCircle, FileQuestion } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n";
import { trackDemoOrganization } from "@/lib/organizations/demo.functions";
import { demoTrackingSchema, type DemoReceipt, type DemoStatus } from "@/lib/organizations/demo-schema";
import { TrackingReceipt } from "./tracking-receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ApplicationTracker({ receipt }: { receipt: DemoReceipt | null }) {
  const { tr, date } = useI18n();
  const track = useServerFn(trackDemoOrganization);
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [resultCode, setResultCode] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (receipt) { setCode(receipt.code); setSecret(receipt.secret); setResultCode(receipt.code); setStatus(receipt.status); setUpdatedAt(receipt.updatedAt); setError(""); } }, [receipt]);
  const labels: Record<DemoStatus, string> = {
    pending: tr("Pending Review", "بانتظار المراجعة"), under_review: tr("Under Review", "قيد المراجعة"),
    needs_information: tr("Corrections Required", "مطلوب تصحيحات"), approved: tr("Approved — Simulated", "معتمد — تجريبي"), rejected: tr("Rejected", "مرفوض"),
  };
  const messages: Record<DemoStatus, string> = {
    approved: tr(`Application ${resultCode} has been approved in the prototype. Its simulated registration is available to authorized officers, not the genuine public trust registry.`, `تم اعتماد طلبكم رقم ${resultCode} في النموذج الأولي. يتاح التسجيل التجريبي للموظفين المصرّح لهم، وليس سجل الثقة العام الفعلي.`),
    pending: tr(`Application ${resultCode} has been received successfully and is awaiting review by the designated officer.`, `تم استلام طلبكم رقم ${resultCode} بنجاح، وهو حالياً بانتظار المراجعة من الموظف المختص.`),
    under_review: tr(`Application ${resultCode} is currently under review. Its status will be updated once a decision has been made.`, `طلبكم رقم ${resultCode} قيد المراجعة حالياً، وسيتم تحديث حالة الطلب بعد اتخاذ القرار.`),
    needs_information: tr(`Application ${resultCode} requires additional or corrected information before approval. Please contact the designated authority for instructions; private review notes are not available through this tracker.`, `طلبكم رقم ${resultCode} يحتاج إلى استكمال أو تعديل بعض البيانات قبل الاعتماد. يرجى التواصل مع الجهة المختصة للحصول على التعليمات؛ لا تُعرض ملاحظات المراجعة الخاصة عبر المتابعة.`),
    rejected: tr(`We regret to inform you that application ${resultCode} has not been approved. You may contact the designated authority to ask about the next steps.`, `نأسف لإبلاغكم بعدم الموافقة على طلبكم رقم ${resultCode}. يمكنكم التواصل مع الجهة المختصة للاستفسار عن الخطوات التالية.`),
  };
  const StatusIcon = status === "approved" ? CheckCircle2 : status === "rejected" ? XCircle : status === "needs_information" ? FileQuestion : Clock3;
  const tone = status === "approved" ? "text-verified" : status === "rejected" ? "text-suspicious" : "text-unverified";
  async function retrieve(event: FormEvent) {
    event.preventDefault(); setStatus(null); setError("");
    const parsed = demoTrackingSchema.safeParse({ code, secret });
    if (!parsed.success) { setError(tr("Enter your five-digit reference and the private secret from your receipt.", "أدخل الرقم المكوّن من خمسة أرقام والسر الخاص من إيصالك.")); return; }
    setBusy(true);
    try {
      const result = await track({ data: parsed.data });
      setResultCode(result.code); setStatus(result.status); setUpdatedAt(result.updatedAt);
      if (!result.status) setError(tr("The reference or private secret is invalid. Lost or older receipts require officer-assisted recovery.", "الرقم أو السر الخاص غير صحيح. تتطلب الإيصالات المفقودة أو السابقة استعادة بمساعدة الموظف."));
      if (result.status === "approved") await queryClient.invalidateQueries({ queryKey: ["organization-demo-registry"] });
    }
    catch { setError(tr("Tracking is temporarily unavailable or the request limit was reached. Try later.", "المتابعة غير متاحة مؤقتاً أو تم بلوغ حد الطلبات. حاول لاحقاً.")); }
    finally { setBusy(false); }
  }
  return <div id="application-tracking" className="mb-8 scroll-mt-24 border-b pb-8"><h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Search className="size-5 text-emerald" />{tr("Track Application", "متابعة الطلب")}</h2>
    {receipt && <TrackingReceipt code={receipt.code} secret={receipt.secret} />}
    <form onSubmit={retrieve} className="max-w-xl space-y-4"><div className="space-y-2"><Label htmlFor="tracking-reference">{tr("Five-digit tracking number", "رقم المتابعة من خمسة أرقام")}</Label><Input id="tracking-reference" dir="ltr" inputMode="numeric" autoComplete="off" maxLength={5} pattern="[1-9][0-9]{4}" required value={code} onChange={e => { setCode(e.target.value); setStatus(null); setError(""); }} /></div><div className="space-y-2"><Label htmlFor="tracking-secret">{tr("Private tracking secret", "سر المتابعة الخاص")}</Label><Input id="tracking-secret" type="password" dir="ltr" autoComplete="off" maxLength={64} required value={secret} onChange={e => { setSecret(e.target.value); setStatus(null); setError(""); }} /></div><p className="text-xs text-muted-foreground">{tr("Older or lost receipts: ask the verification officer for private recovery after an independent identity check.", "الإيصالات السابقة أو المفقودة: اطلب استعادة خاصة من موظف التحقق بعد التحقق المستقل من الهوية.")}</p><Button type="submit" disabled={busy}><Search />{tr("View status", "عرض الحالة")}</Button></form>
    {status && <div role="status" className="mt-4 max-w-2xl space-y-3 rounded-lg border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3"><StatusIcon aria-hidden="true" className={`mt-1 size-6 shrink-0 ${tone}`} /><div className="min-w-0"><p className="text-sm text-muted-foreground">{tr("Tracking number", "رقم المتابعة")}</p><p dir="ltr" className="mt-1 text-start font-mono text-2xl font-bold">{resultCode}</p><h3 className="mt-2 font-semibold">{labels[status]}</h3></div></div>
      <p className="text-sm leading-relaxed">{messages[status]}</p>
      {updatedAt && <p className="text-xs text-muted-foreground">{tr("Latest status update", "آخر تحديث للحالة")}: <time dateTime={updatedAt}>{date(updatedAt, true)}</time></p>}
      {status === "approved" && <p className="text-xs text-muted-foreground">{tr("Demo approval does not verify real-world identity or channel ownership.", "الاعتماد التجريبي لا يثبت الهوية الفعلية أو ملكية القنوات.")}</p>}
    </div>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </div>;
}