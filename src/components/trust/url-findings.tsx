import { useI18n } from "@/lib/i18n/i18n";
import { Badge } from "@/components/ui/badge";
import { RiskMeter } from "@/components/common/bits";
import { officialReferences } from "@/lib/services/url/official-references";
import type { UrlAnalysis } from "@/lib/services/url/analyze";
import type { UrlIntelligence } from "@/lib/services/url/intelligence";

export function UrlFindings({ analysis, intelligence, score }: { analysis: UrlAnalysis; intelligence: UrlIntelligence | null; score: number }) {
  const { tr, pick, date } = useI18n();
  const reference = officialReferences.find(r => r.domain === analysis.officialDomain);
  const rdap = intelligence?.rdap;
  const unavailable = {
    unsupported: tr("RDAP is not supported for this domain suffix.", "RDAP غير مدعوم لامتداد هذا النطاق."),
    not_found: tr("The RDAP provider returned no registration record; this does not prove fraud.", "لم يُرجع مزود RDAP سجل تسجيل؛ هذا لا يثبت الاحتيال."),
    limited: tr("Domain lookup limits reached or usage checks unavailable.", "تم بلوغ حدود استعلام النطاق أو تعذّر فحص الاستخدام."),
    timeout: tr("The RDAP provider did not respond within the time limit.", "لم يستجب مزود RDAP ضمن المهلة."),
    service: tr("Domain registration information is unavailable.", "معلومات تسجيل النطاق غير متاحة."),
    blocked: tr("Domain lookup blocked for a local, reserved or invalid destination.", "حُظر استعلام النطاق لوجهة محلية أو محجوزة أو غير صالحة."),
  };
  return <section className="space-y-3 border-t pt-4" aria-label={tr("URL technical analysis", "التحليل التقني للرابط")}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{tr("URL technical analysis", "التحليل التقني للرابط")}</h3><Badge variant={analysis.classification === "suspicious" ? "suspicious" : "secondary"}>{analysis.classification === "suspicious" ? tr("Suspicious indicators", "مؤشرات مشبوهة") : analysis.classification === "caution" ? tr("Caution", "الحذر") : tr("Few visible indicators", "مؤشرات ظاهرة قليلة")}</Badge></div>
    {analysis.host && <dl className="grid min-w-0 gap-1 text-sm"><dt className="text-muted-foreground">{tr("Parsed host / registrable domain", "المضيف المحلل / النطاق القابل للتسجيل")}</dt><dd dir="ltr" className="break-all font-mono">{analysis.host} / {analysis.domain ?? tr("Unavailable", "غير متاح")}</dd></dl>}
    {reference && <p className="text-sm">{tr("Documented official domain reference", "مرجع نطاق رسمي موثّق")}: <a className="text-primary underline" href={reference.source} target="_blank" rel="noreferrer noopener">{reference.domain}</a>. {tr("Domain boundary match only; not a registry approval or authentication of this message. Redirects and page content are unverified.", "مطابقة حدود النطاق فقط؛ ليست اعتماداً في السجل أو توثيقاً لهذه الرسالة. التحويلات ومحتوى الصفحة غير متحقق منها.")}</p>}
    <ul className="list-disc space-y-2 ps-5 text-sm">{analysis.signals.map(s => <li key={s.code}><span className="font-medium">{s.kind === "suspicious" ? tr("Suspicious indicator", "مؤشر اشتباه") : tr("Technical observation", "ملاحظة تقنية")}: </span>{pick(s)}</li>)}</ul>
    {analysis.signals.length === 0 && <p className="text-sm text-muted-foreground">{tr("No configured technical warning was found. This does not establish that the site or request is safe.", "لم يُكتشف تحذير تقني وفق القواعد الحالية. هذا لا يثبت أمان الموقع أو الطلب.")}</p>}
    <p className="text-sm text-muted-foreground">{tr("Redirect destination: unverified. Safe expansion is unavailable; no submitted URL was opened. Cloaking, scripts, page content, DNS and hosting were not inspected.", "وجهة التحويل: غير متحقق منها. التوسيع الآمن غير متاح؛ لم يُفتح أي رابط مُرسل. لم تُفحص تقنيات إخفاء المحتوى أو النصوص البرمجية أو محتوى الصفحة أو DNS أو الاستضافة.")}</p>
    {rdap?.status === "available" ? <div className="space-y-1 text-sm"><h4 className="font-semibold">{tr("Live RDAP registration record", "سجل تسجيل RDAP فعلي")}</h4><p>{tr("Registration date", "تاريخ التسجيل")}: {rdap.registeredAt ? date(rdap.registeredAt) : tr("Unavailable / redacted", "غير متاح / محجوب")}</p><p>{tr("Domain age (days)", "عمر النطاق (أيام)")}: {rdap.ageDays ?? tr("Unavailable", "غير متاح")}</p><p dir="auto" className="break-words">{tr("Registrar", "المسجّل")}: {rdap.registrar ?? tr("Unavailable / redacted", "غير متاح / محجوب")}</p><p dir="auto">{tr("Registry status", "حالة التسجيل")}: {rdap.domainStatus.join(", ") || tr("Unavailable", "غير متاح")}</p><p>{tr("Checked", "وقت الفحص")}: {date(rdap.checkedAt, true)}</p><a className="break-all text-primary underline" href={rdap.source} rel="noreferrer noopener" target="_blank">{tr("RDAP source", "مصدر RDAP")}</a><p className="text-muted-foreground">{tr("Registration age is context, not proof of fraud or authenticity, and does not raise the risk score by itself.", "عمر التسجيل سياق وليس دليلاً على الاحتيال أو الأصالة، ولا يرفع درجة الخطورة بمفرده.")}</p></div> : <p role="status" className="text-sm text-muted-foreground">{rdap?.status === "unavailable" ? unavailable[rdap.reason] : tr("External registration lookup was not requested; no domain age is inferred.", "لم يُطلب استعلام التسجيل الخارجي؛ لا يُستنتج عمر للنطاق.")}</p>}
    <div><p className="mb-1 text-xs text-muted-foreground">{tr("Combined risk score / 100 — rules, registry and optional AI; not a fraud probability", "درجة الخطورة المجمّعة / 100 — القواعد والسجل والذكاء الاصطناعي الاختياري؛ ليست احتمال احتيال")}</p><RiskMeter score={score} /></div>
  </section>;
}
