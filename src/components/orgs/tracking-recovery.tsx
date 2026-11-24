import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound } from "lucide-react";
import { recoverDemoReceipt } from "@/lib/organizations/demo.functions";
import { useI18n } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrackingReceipt } from "./tracking-receipt";

export function TrackingRecovery({ id }: { id: string }) {
  const { tr } = useI18n(); const recover = useServerFn(recoverDemoReceipt);
  const [confirmed, setConfirmed] = useState(false); const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  const [receipt, setReceipt] = useState<{ code: string; secret: string } | null>(null);
  return <section className="space-y-3 border-b py-4">
    <h3 className="font-semibold">{tr("Private tracking receipt recovery", "استعادة إيصال المتابعة الخاص")}</h3>
    <form className="max-w-xl space-y-3" onSubmit={async event => {
      event.preventDefault(); if (!confirmed || note.trim().length < 10 || busy) return;
      setBusy(true); setError(false); setReceipt(null);
      try { setReceipt(await recover({ data: { id, note, confirmed: true } })); setNote(""); setConfirmed(false); }
      catch { setError(true); } finally { setBusy(false); }
    }}>
      <div className="flex items-start gap-2"><Checkbox id={`receipt-confirm-${id}`} checked={confirmed} onCheckedChange={v => setConfirmed(v === true)} /><Label htmlFor={`receipt-confirm-${id}`}>{tr("I independently checked the applicant's identity and will deliver the receipt privately. The old secret will stop working.", "تحققت بشكل مستقل من هوية مقدم الطلب وسأُسلّم الإيصال بشكل خاص. سيتوقف السر السابق عن العمل.")}</Label></div>
      <Label htmlFor={`receipt-note-${id}`}>{tr("Private identity-check record", "سجل التحقق الخاص من الهوية")}</Label>
      <Textarea id={`receipt-note-${id}`} dir="auto" minLength={10} maxLength={1000} required value={note} onChange={e => setNote(e.target.value)} />
      <Button type="submit" variant="outline" disabled={busy || !confirmed || note.trim().length < 10}><KeyRound />{tr("Issue replacement receipt", "إصدار إيصال بديل")}</Button>
    </form>
    {error && <p role="alert" className="text-sm text-destructive">{tr("Recovery denied or temporarily unavailable.", "رُفضت الاستعادة أو أنها غير متاحة مؤقتاً.")}</p>}
    {receipt && <TrackingReceipt {...receipt} />}
  </section>;
}