import { Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePublicWorkspace } from "@/lib/data/hooks";
import { useI18n } from "@/lib/i18n/i18n";
import { messageSchema } from "@/lib/security/schema";
import type { Assessment, MessageInput } from "@/lib/services/verification";
import type { AiFindings } from "@/lib/services/ai-schema";
import { groundedIndicators } from "@/lib/services/ai-privacy";

export function ReportButton({ input, assessment, aiIndicators, allowVerifiedReport = false }: { input: MessageInput; assessment: Assessment; aiIndicators?: AiFindings["indicators"] | undefined; allowVerifiedReport?: boolean | undefined }) {
  const { tr } = useI18n();
  const workspace = usePublicWorkspace();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const key = JSON.stringify(input);
  if (assessment.state === "verified" && !allowVerifiedReport) return null;
  return (
    <Button
      variant="danger"
      size="sm"
      disabled={busy || submitted.includes(key)}
      onClick={async () => {
        setBusy(true);
        try {
          const validated = messageSchema.parse(input);
          const report = await supabase.rpc("submit_ai_security_report", { report_input: JSON.parse(JSON.stringify({ ...validated, aiIndicators: groundedIndicators(aiIndicators ?? [], validated) })), ...(workspace ? { workspace_user: workspace } : {}) });
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
