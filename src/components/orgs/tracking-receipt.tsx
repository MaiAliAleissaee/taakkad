import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n";

export function TrackingReceipt({ code, secret }: { code: string; secret: string }) {
  const { tr } = useI18n();
  function download() {
    const blob = new Blob([JSON.stringify({ brand: "Taakkad / تأكّد", reference: code, trackingSecret: secret }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `Taakkad-private-receipt-${code}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="my-4 space-y-2">
    <p className="text-sm">{tr("Private tracking receipt", "إيصال متابعة خاص")}: <strong dir="ltr" className="font-mono">{code}</strong></p>
    <Button type="button" variant="outline" size="sm" onClick={download}><Download />{tr("Save private receipt", "حفظ الإيصال الخاص")}</Button>
    <p className="text-xs text-muted-foreground">{tr("Keep the receipt private. Lost receipts require an officer's independent identity check; the reference alone grants no access.", "احتفظ بالإيصال بشكل خاص. يتطلب فقدانه تحققاً مستقلاً من الهوية لدى الموظف؛ لا يمنح الرقم وحده صلاحية الوصول.")}</p>
  </div>;
}