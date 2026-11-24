import { useI18n } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import type { MessageInput } from "@/lib/services/verification";
import { uaeContext, uaeRequestSignals, uaeSources } from "@/lib/services/uae-safety";

export function UaeFindings({ input }: { input: MessageInput }) {
  const { tr, pick } = useI18n();
  const context = uaeContext(input);
  const signals = uaeRequestSignals(input.body);
  if (!context.scenarios.length && !context.reference && !context.phone && !signals.length) return null;
  const sources = [...new Map(context.scenarios.flatMap(scenario => scenario.sources).map(source => [source.url, source])).values()];
  return <section className="space-y-3 border-t pt-3" aria-label={tr("UAE safety context", "السياق الأمني الإماراتي")}>
    <h3 className="text-sm font-semibold">{tr("UAE safety context", "السياق الأمني الإماراتي")}</h3>
    {context.scenarios.map(scenario => <div key={scenario.id} className="space-y-1 text-sm"><h4 className="font-medium">{pick(scenario.label)}</h4><p className="text-muted-foreground">{pick(scenario.guidance)}</p></div>)}
    {signals.length > 0 && <p className="text-sm text-unverified">{tr("Local language cues: ", "مؤشرات لغوية محلية: ")}{signals.map(signal => `«${signal.matched}»`).join(" · ")}</p>}
    {context.phone && <div className="text-xs"><p>{tr("Normalized phone: ", "الرقم بعد توحيد الصيغة: ")}<bdi className="font-mono">{context.phone}</bdi></p><p className="text-muted-foreground">{tr("Format matching does not prove caller identity. Caller ID can be spoofed; number portability prevents carrier attribution from the prefix.", "مطابقة الصيغة لا تثبت هوية المتصل. يمكن تزوير هوية المتصل؛ ونقل الأرقام يمنع استنتاج المشغل من بادئة الرقم.")}</p><Button asChild variant="link" size="sm"><a href={uaeSources.phone.url} target="_blank" rel="noopener noreferrer">{pick(uaeSources.phone.title)}</a></Button></div>}
    {context.publishedContact && <p className="text-xs">{tr("Matches a published contact reference: ", "يطابق مرجع اتصال منشوراً: ")}{pick(context.publishedContact.name)}. {tr("Not an approved registry channel or proof of this caller.", "ليست قناة معتمدة في السجل ولا إثباتاً لهوية هذا المتصل.")} <a className="underline" href={context.publishedContact.source.url} target="_blank" rel="noopener noreferrer">{tr("Source", "المصدر")}</a></p>}
    {context.reference && <p className="text-xs">{tr("URL host is within the documented reference domain: ", "مضيف الرابط ضمن نطاق المرجع الموثق: ")}<bdi>{context.reference.domain}</bdi>. {tr("This does not authenticate the sender or message.", "هذا لا يصادق على المرسل أو الرسالة.")} <a className="underline" href={context.reference.source} target="_blank" rel="noopener noreferrer">{tr("Source", "المصدر")}</a></p>}
    {sources.length > 0 && <details className="text-xs"><summary className="cursor-pointer font-medium">{tr("Official source references", "مراجع المصادر الرسمية")}</summary><ul className="mt-2 space-y-2">{sources.map(source => <li key={source.url}><a className="underline" href={source.url} target="_blank" rel="noopener noreferrer">{pick(source.title)}</a></li>)}</ul></details>}
    <p className="text-xs text-muted-foreground">{tr("Scenario and language cues are rule-based guidance, not confirmed fraud or official endorsement. Logos and screenshots are not analyzed automatically.", "مؤشرات السيناريو واللغة إرشادات قائمة على القواعد، وليست احتيالاً مؤكداً أو اعتماداً رسمياً. لا تُحلل الشعارات ولقطات الشاشة تلقائياً.")}</p>
  </section>;
}