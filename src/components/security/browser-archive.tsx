import { Download } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readBrowserArchives } from "@/lib/security/workspace.functions";
import { useI18n } from "@/lib/i18n/i18n";
export function BrowserArchive() {
  const read = useServerFn(readBrowserArchives); const { tr } = useI18n(); const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const copies = await read();
      if (!copies.length) { toast(tr("No browser copies have been imported for this account.", "لم تُنقل أي نسخة من المتصفح إلى هذا الحساب.")); return; }
      const url = URL.createObjectURL(new Blob([JSON.stringify(copies, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "trust-zero-preserved-browser-copies.json"; link.click(); URL.revokeObjectURL(url);
    } catch { toast.error(tr("Saved copies could not be downloaded.", "تعذّر تنزيل النسخ المحفوظة.")); }
    finally { setBusy(false); }
  }
  return <Button variant="outline" size="icon" disabled={busy} onClick={download} title={tr("Download preserved browser copies", "تنزيل نسخ المتصفح المحفوظة")} aria-label={tr("Download preserved browser copies", "تنزيل نسخ المتصفح المحفوظة")}><Download /></Button>;
}