import { Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePublicWorkspace } from "@/lib/data/hooks";
import { useI18n } from "@/lib/i18n/i18n";
import { messageSchema } from "@/lib/security/schema";
import type { Assessment, MessageInput } from "@/lib/services/verification";

export function ReportButton({ input, assessment }: { input: MessageInput; assessment: Assessment }) {
  const { tr } = useI18n();
  const workspace = usePublicWorkspace();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const key = JSON.stringify(input);
  if (assessment.state === "verified") return null;
  return (
    <Button
      variant="danger"
      size="sm"
      disabled={busy || submitted.includes(key)}
      onClick={async () => {
        setBusy(true);
        try {
          const validated = messageSchema.parse(input);
          const report = await supabase.rpc("submit_security_report", { report_input: JSON.parse(JSON.stringify(validated)), ...(workspace ? { workspace_user: workspace } : {}) });
          if (report.error) throw report.error;
          setSubmitted(values => [...values, key]);
          toast.success(tr("Sent to the demo security team", "أُرسل إلى فريق الأمن التجريبي"), { description: tr("No real authority is contacted. Case details are restricted.", "لا يتم التواصل مع أي جهة فعلية. تفاصيل القضايا مقيّدة.") });
        } catch { toast.error(tr("Report could not be sent. Please try again.", "تعذّر إرسال البلاغ. حاول مجدداً.")); }
        finally { setBusy(false); }
      }}
    >
      <Flag />{submitted.includes(key) ? tr("Report received", "تم استلام البلاغ") : tr("Report to security team", "إبلاغ فريق الأمن")}
    </Button>
  );
}
