import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n";
import { trackDemoOrganization } from "@/lib/organizations/demo.functions";
import { demoTrackingSchema, type DemoReceipt, type DemoStatus } from "@/lib/organizations/demo-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function ApplicationTracker({ receipt }: { receipt: DemoReceipt | null }) {
  const { tr } = useI18n();
  const track = useServerFn(trackDemoOrganization);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (receipt) { setCode(receipt.code); setStatus(receipt.status); setError(""); } }, [receipt]);
  const labels: Record<DemoStatus, string> = {
    pending: tr("Pending Review", "بانتظار المراجعة"), under_review: tr("Under Review", "قيد المراجعة"),
    needs_information: tr("Corrections Required", "مطلوب تصحيحات"), approved: tr("Approved — Simulated", "معتمد — تجريبي"), rejected: tr("Rejected", "مرفوض"),
  };
  async function retrieve(event: FormEvent) {
    event.preventDefault(); setStatus(null); setError("");
    const parsed = demoTrackingSchema.safeParse({ code });
    if (!parsed.success) { setError(tr("Enter your five-digit tracking number.", "أدخل رقم المتابعة المكوّن من خمسة أرقام.")); return; }
    setBusy(true);
    try { const result = await track({ data: parsed.data }); setStatus(result.status); if (!result.status) setError(tr("No status found for this number.", "لم تُعثر على حالة لهذا الرقم.")); }
    catch { setError(tr("Tracking is temporarily unavailable or the request limit was reached. Try later.", "المتابعة غير متاحة مؤقتاً أو تم بلوغ حد الطلبات. حاول لاحقاً.")); }
    finally { setBusy(false); }
  }
  return <div id="application-tracking" className="mb-8 scroll-mt-24 border-b pb-8"><h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Search className="size-5 text-emerald" />{tr("Track Application", "متابعة الطلب")}</h2>
    {receipt && <p className="mb-4 text-sm">{tr("Save your tracking number:", "احفظ رقم المتابعة:")} <strong dir="ltr" className="font-mono text-lg">{receipt.code}</strong></p>}
    <form onSubmit={retrieve} className="max-w-xl space-y-4"><div className="space-y-2"><Label htmlFor="tracking-reference">{tr("Five-digit tracking number", "رقم المتابعة من خمسة أرقام")}</Label><Input id="tracking-reference" dir="ltr" inputMode="numeric" autoComplete="off" maxLength={5} pattern="[1-9][0-9]{4}" required value={code} onChange={e => { setCode(e.target.value); setStatus(null); setError(""); }} /></div><Button type="submit" disabled={busy}><Search />{tr("View status", "عرض الحالة")}</Button></form>
    {status && <p role="status" className="mt-4"><Badge variant="unverified">{labels[status]}</Badge></p>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </div>;
}