import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle2, Clock3, XCircle, FileQuestion } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n";
import { trackPublicReference } from "@/lib/organizations/demo.functions";
import { publicReferenceSchema, type DemoReceipt, type DemoStatus } from "@/lib/organizations/demo-schema";
import { TrackingReceipt } from "./tracking-receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ApplicationTracker({ receipt }: { receipt: DemoReceipt | null }) {
  const { tr, date, pick } = useI18n();
  const track = useServerFn(trackPublicReference);
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [resultCode, setResultCode] = useState("");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<{ en: string; ar: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (receipt) { setCode(receipt.code); setStatus(null); setError(""); } }, [receipt]);
  const labels: Record<DemoStatus, string> = {
    pending: tr("Pending Review", "بانتظار المراجعة"), under_review: tr("Under Review", "قيد المراجعة"),
    needs_information: tr("Corrections Required", "مطلوب تصحيحات"), approved: tr("Approved — Simulated", "معتمد — تجريبي"), rejected: tr("Rejected", "مرفوض"),
  };
  const StatusIcon = status === "approved" ? CheckCircle2 : status === "rejected" ? XCircle : status === "needs_information" ? FileQuestion : Clock3;
  const tone = status === "approved" ? "text-verified" : status === "rejected" ? "text-suspicious" : "text-unverified";
  async function retrieve(event: FormEvent) {
    event.preventDefault(); setStatus(null); setError("");
    const parsed = publicReferenceSchema.safeParse({ code });
    if (!parsed.success) { setError(tr("Enter your five-digit reference number.", "أدخل الرقم المرجعي المكوّن من خمسة أرقام.")); return; }
    setBusy(true);
    try {
      const result = await track({ data: parsed.data });
      setResultCode(result.code); setStatus(result.status); setSubmittedAt(result.submittedAt); setMessage(result.message);
      if (!result.status) setError(pick(result.message));
      if (result.status === "approved") await queryClient.invalidateQueries({ queryKey: ["organization-demo-registry"] });
    }
    catch { setError(tr("Tracking is temporarily unavailable or the request limit was reached. Try later.", "المتابعة غير متاحة مؤقتاً أو تم بلوغ حد الطلبات. حاول لاحقاً.")); }
    finally { setBusy(false); }
  }
  return <div id="application-tracking" className="mb-8 scroll-mt-24 border-b pb-8"><h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Search className="size-5 text-emerald" />{tr("Track Application", "متابعة الطلب")}</h2>
    {receipt && <TrackingReceipt code={receipt.code} secret={receipt.secret} />}
    <form onSubmit={retrieve} className="max-w-xl space-y-4"><div className="space-y-2"><Label htmlFor="tracking-reference">{tr("Five-digit tracking number", "رقم المتابعة من خمسة أرقام")}</Label><Input id="tracking-reference" dir="ltr" inputMode="numeric" autoComplete="off" maxLength={5} pattern="[1-9][0-9]{4}" required value={code} onChange={e => { setCode(e.target.value); setStatus(null); setError(""); }} /></div><p className="text-xs text-muted-foreground">{tr("Only general status is public. Private information remains protected by your receipt and authorized identity checks.", "تُعرض الحالة العامة فقط. تبقى المعلومات الخاصة محمية بالإيصال والتحقق المصرّح به من الهوية.")}</p><Button type="submit" disabled={busy}><Search />{tr("View status", "عرض الحالة")}</Button></form>
    {status && <div role="status" className="mt-4 max-w-2xl space-y-3 rounded-lg border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3"><StatusIcon aria-hidden="true" className={`mt-1 size-6 shrink-0 ${tone}`} /><div className="min-w-0"><p className="text-sm text-muted-foreground">{tr("Tracking number", "رقم المتابعة")}</p><p dir="ltr" className="mt-1 text-start font-mono text-2xl font-bold">{resultCode}</p><h3 className="mt-2 font-semibold">{labels[status]}</h3></div></div>
      {message && <p className="text-sm leading-relaxed">{pick(message)}</p>}
      {submittedAt && <p className="text-xs text-muted-foreground">{tr("Submission date", "تاريخ تقديم الطلب")}: <time dateTime={submittedAt}>{date(submittedAt, true)}</time></p>}
      {status === "approved" && <p className="text-xs text-muted-foreground">{tr("Demo approval does not verify real-world identity or channel ownership.", "الاعتماد التجريبي لا يثبت الهوية الفعلية أو ملكية القنوات.")}</p>}
    </div>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </div>;
}