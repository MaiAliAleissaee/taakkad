import { useI18n } from "@/lib/i18n/i18n";
import type { AiOutcome } from "@/lib/services/ai-schema";
import type { Severity } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";

export function AiFindings({ outcome, risk, flaggedValues }: { outcome: AiOutcome | null; risk: Severity; flaggedValues: string[] }) {
  const { tr, pick } = useI18n();
  const labels = { low: tr("Low", "منخفض"), medium: tr("Medium", "متوسط"), high: tr("High", "مرتفع"), critical: tr("Critical", "حرج") };
  return <section className="space-y-3 border-t pt-4" aria-label={tr("AI risk assessment", "تقييم الخطورة بالذكاء الاصطناعي")}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{tr("Overall risk", "الخطورة الإجمالية")}</h3><Badge variant={risk === "critical" || risk === "high" ? "suspicious" : "secondary"}>{labels[risk]}</Badge></div>
    {outcome?.status === "performed" ? <>
      <p className="text-xs font-medium text-primary">{tr("Real AI analysis · OpenAI GPT-6.1 Sol", "تحليل فعلي بالذكاء الاصطناعي · OpenAI GPT-6.1 Sol")}</p>
      <p className="text-sm" dir="auto">{pick(outcome.findings.explanation)}</p>
      {outcome.findings.warningSigns.length > 0 && <div className="space-y-1"><h4 className="text-sm font-semibold">{tr("AI interpretations — warning signs", "تفسيرات الذكاء الاصطناعي — علامات التحذير")}</h4><ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">{outcome.findings.warningSigns.map((item, index) => <li key={index}>{pick(item)}</li>)}</ul></div>}
      {outcome.findings.indicators.length > 0 && <div className="space-y-1"><h4 className="text-sm font-semibold">{tr("Extracted indicators — not verified identities", "المؤشرات المستخرجة — ليست هويات موثّقة")}</h4><ul className="space-y-1 text-sm">{outcome.findings.indicators.map(item => <li key={`${item.type}:${item.value}`} className="break-all font-mono" dir="ltr">{item.value}</li>)}</ul></div>}
      <div className="space-y-1"><h4 className="text-sm font-semibold">{tr("AI-recommended safe actions", "إجراءات الأمان المقترحة بالذكاء الاصطناعي")}</h4><ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">{outcome.findings.safeActions.map((item, index) => <li key={index}>{pick(item)}</li>)}</ul></div>
    </> : <p role="status" className="text-sm text-muted-foreground">{outcome ? (outcome.reason === "limited" ? tr("AI usage limit reached or usage checks unavailable. Rule-based fallback was used.", "تم بلوغ حد استخدام الذكاء الاصطناعي أو تعذّر فحص الاستخدام. استُخدم التقييم القائم على القواعد.") : tr("AI analysis was unavailable. Rule-based fallback was used.", "تعذّر تحليل الذكاء الاصطناعي. استُخدم التقييم القائم على القواعد.")) : tr("Rule-based assessment only; AI analysis was not requested.", "تقييم قائم على القواعد فقط؛ لم يُطلب تحليل بالذكاء الاصطناعي.")}</p>}
    {flaggedValues.length > 0 && <p className="text-sm text-destructive">{tr("Database match: a submitted indicator is flagged for safety review. Confidential case information is not disclosed.", "مطابقة في قاعدة البيانات: أحد المؤشرات المُرسلة معلَّم للمراجعة الأمنية. لا تُكشف معلومات القضايا السرية.")}</p>}
    <p className="text-xs text-muted-foreground">{tr("This assessment is not proof of criminal conduct. Risk categories are not calibrated fraud probabilities; human review is required.", "هذا التقييم ليس دليلاً على سلوك إجرامي. فئات الخطورة ليست احتمالات احتيال محسوبة إحصائياً؛ وتلزم مراجعة بشرية.")}</p>
  </section>;
}