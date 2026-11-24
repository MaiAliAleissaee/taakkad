import { Copy, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { demoExamples } from "@/lib/services/demo-examples";
import { useI18n } from "@/lib/i18n/i18n";

export function DemoExamples() {
  const { tr, pick } = useI18n();
  return <details className="mt-8 border-t pt-5">
    <summary className="cursor-pointer text-sm font-semibold"><FlaskConical className="me-2 inline size-4 text-info" />{tr(`Fictional demonstration examples (${demoExamples.length})`, `أمثلة عرض خيالية (${demoExamples.length})`)}</summary>
    <p className="mt-3 text-sm text-muted-foreground">{tr("Reserved example domains only. Expectations are guidance, not predetermined AI output; registry status can change after officer review.", "نطاقات أمثلة محجوزة فقط. التوقعات إرشادية وليست نتائج ذكاء اصطناعي محددة مسبقاً؛ قد تتغير حالة السجل بعد مراجعة الموظف.")}</p>
    <div className="mt-4 grid gap-4 md:grid-cols-2">{demoExamples.map(example => <article key={example.id} className="min-w-0 rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold">{example.id}. {pick(example.title)}</h3>
      <p className="mt-2 break-all font-mono text-xs" dir="ltr">{example.channel} · {example.sender || "—"}</p>
      {example.url && <p dir="ltr" className="mt-1 break-all font-mono text-xs text-muted-foreground">{example.url}</p>}
      <p className="mt-2 text-sm">{pick(example.body)}</p><p className="mt-2 text-xs text-muted-foreground">{pick(example.expectation)}</p>
      <div className="mt-3 flex flex-wrap gap-2">{(["sender", "url", "body"] as const).filter(field => field === "body" || example[field]).map(field => <Button key={field} size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(field === "body" ? pick(example.body) : example[field]); toast.success(tr("Copied", "تم النسخ")); } catch { toast.error(tr("Copy unavailable. Select the text instead.", "النسخ غير متاح. حدد النص يدوياً.")); } }}><Copy />{field === "sender" ? tr("Sender", "المرسل") : field === "url" ? tr("Link", "الرابط") : tr("Message", "الرسالة")}</Button>)}</div>
    </article>)}</div>
  </details>;
}