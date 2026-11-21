import type { Lang } from "./i18n";

const notes: Record<string, string> = {
  "Your card is blocked. Log in to unlock.": "بطاقتك موقوفة. سجّل الدخول لإعادة تفعيلها.",
  "Your document is ready for collection.": "وثيقتك جاهزة للاستلام.",
  "New arrivals this week.": "منتجات جديدة هذا الأسبوع.",
  "Escalated to bank security liaison (simulated). Awaiting takedown confirmation.": "أُحيلت إلى مسؤول التنسيق الأمني بالبنك (محاكاة). بانتظار تأكيد إيقاف الموقع.",
  "Organization confirmed ownership. Closed as false positive.": "أكدت الجهة الملكية. أُغلقت القضية بوصفها إنذاراً خاطئاً.",
  "Pending fictional registration; not approved.": "طلب تسجيل خيالي قيد المراجعة؛ لم يتم اعتماده.",
};
export function demoText(text: string, lang: Lang): string {
  return lang === "ar" ? notes[text] ?? text : text;
}
export function analystName(name: string, lang: Lang): string {
  return lang === "ar" ? name.replace(/^Analyst (\d+)$/, "المحلل $1") : name;
}
export function registrarName(name: string, lang: Lang): string {
  const names: Record<string, string> = { "Demo Registrar Ltd.": "مسجّل العرض التجريبي", "Sandbox Domains Inc.": "شركة نطاقات التجربة", "Example Names LLC": "شركة أسماء افتراضية", "Simulated (not observed online)": "افتراضي (لم يُرصد على الإنترنت)" };
  return lang === "ar" ? names[name] ?? name : name;
}