import { Link } from "@tanstack/react-router";
import { Flag, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { repository, useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { buildPublicReport, findLinkedCase } from "@/lib/services/reporting";
import type { Assessment, MessageInput } from "@/lib/services/verification";

export function ReportButton({ input, assessment }: { input: MessageInput; assessment: Assessment }) {
  const { tr } = useI18n();
  const { alerts } = useDemoState();
  if (assessment.state === "verified") return null;
  const linked = findLinkedCase(alerts, input);
  if (linked) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link to="/security" search={{ case: linked.id }}>
          <Link2 />{tr(`Linked to case ${linked.caseId}`, `مرتبط بالقضية ${linked.caseId}`)}
        </Link>
      </Button>
    );
  }
  return (
    <Button
      variant="danger"
      size="sm"
      onClick={() => {
        const alert = repository.addAlert(buildPublicReport(input, assessment));
        toast.success(tr(`Sent to the security team as case ${alert.caseId}`, `أُرسل إلى فريق الأمن كقضية ${alert.caseId}`), {
          description: tr("Simulated — no real authority is contacted.", "محاكاة — لا يتم التواصل مع أي جهة فعلية."),
        });
      }}
    >
      <Flag />{tr("Report to security team", "إبلاغ فريق الأمن")}
    </Button>
  );
}
