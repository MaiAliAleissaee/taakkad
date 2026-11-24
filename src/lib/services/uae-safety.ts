import type { Bi } from "@/lib/domain/types";
import type { MessageInput } from "./verification";
import { asciiDigits, normalizeUaePhone } from "./uae-phone";
import { hostFromUrl } from "./lookalike";
import { officialReferences, isDomainBoundary } from "./url/official-references";

export function normalizeArabicText(value: string): string {
  return asciiDigits(value.normalize("NFKC")).replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, "").replace(/[أإآٱ]/g, "ا").toLowerCase();
}

export const uaeSources = {
  identity: { title: { en: "UAE Government: UAE PASS", ar: "حكومة الإمارات: الهوية الرقمية" }, url: "https://u.ae/en/about-the-uae/digital-uae/digital-transformation/platforms-and-apps/the-uae-pass-app" },
  tamm: { title: { en: "UAE Government: TAMM", ar: "حكومة الإمارات: تم" }, url: "https://u.ae/en/about-the-uae/digital-uae/digital-cities/smart-abu-dhabi" },
  traffic: { title: { en: "UAE Government: traffic services", ar: "حكومة الإمارات: الخدمات المرورية" }, url: "https://u.ae/en/information-and-services/justice-safety-and-the-law/safety/road-safety" },
  banking: { title: { en: "ADCB: fraud awareness", ar: "بنك أبوظبي التجاري: التوعية بالاحتيال" }, url: "https://www.adcb.com/en/consumer-education-awareness/fraud-awareness/protecting-your-banking-information" },
  phone: { title: { en: "TDRA: number portability", ar: "تدرا: نقل الأرقام" }, url: "https://tdra.gov.ae/en/consumer-tool-hub/topics/porting-numbers" },
} satisfies Record<string, { title: Bi; url: string }>;

export const uaeScenarios = [
  { id: "identity", label: { en: "UAE PASS / identity", ar: "الهوية الرقمية / UAE PASS" }, pattern: /\buae\s*pass\b|الهوية الرقمية|هويه رقميه|هوية رقمية/, guidance: { en: "Open UAE PASS independently. Reject any sign-in or approval request you did not initiate; never give a caller your PIN or code.", ar: "افتح تطبيق الهوية الرقمية بشكل مستقل. ارفض أي طلب دخول أو موافقة لم تبدأه؛ لا تعطِ المتصل رقمك السري أو رمزك." }, sources: [uaeSources.identity] },
  { id: "tamm", label: { en: "TAMM services", ar: "خدمات تم" }, pattern: /\btamm\b|منصة تم|تطبيق تم|خدمات تم/, guidance: { en: "Check the request inside TAMM through its independently opened official app or website, not the message link.", ar: "تحقق من الطلب داخل تم عبر تطبيقه أو موقعه الرسمي المفتوح بشكل مستقل، وليس رابط الرسالة." }, sources: [uaeSources.tamm] },
  { id: "traffic", label: { en: "Traffic fine", ar: "مخالفة مرورية" }, pattern: /traffic|\bfines?\b|مخالف|غرام|المرور|شرطة/, guidance: { en: "Look up fines through the official police, MOI or RTA service for the relevant emirate. A threatening message is not proof of a fine.", ar: "استعلم عن المخالفات عبر خدمات الشرطة أو وزارة الداخلية أو هيئة الطرق الرسمية للإمارة المعنية. رسالة التهديد ليست إثباتاً لمخالفة." }, sources: [uaeSources.traffic] },
  { id: "delivery", label: { en: "Delivery / customs fee", ar: "توصيل / رسوم جمركية" }, pattern: /delivery|parcel|courier|customs|توصيل|شحن|طرد|جمرك/, guidance: { en: "Confirm the parcel and any fee in the courier's independently opened app or known website. Do not disclose card details through unsolicited links.", ar: "تحقق من الطرد وأي رسوم عبر تطبيق شركة التوصيل أو موقعها المعروف المفتوح بشكل مستقل. لا تكشف بيانات البطاقة عبر روابط غير متوقعة." }, sources: [uaeSources.banking] },
  { id: "banking", label: { en: "Bank / payment", ar: "بنك / دفع" }, pattern: /\bbank(?:ing)?\b|\badcb\b|\benbd\b|emirates\s*nbd|\bpayment\b|\brefund\b|بنك|مصرف|بطاق|دفعة|دفع|تحويل|استرداد/, guidance: { en: "Use the bank's official app or the number on your card. If money or credentials were exposed, contact the bank promptly and preserve the message for police review.", ar: "استخدم تطبيق البنك الرسمي أو الرقم على بطاقتك. إذا انكشفت بيانات أو أموال، تواصل مع البنك سريعاً واحفظ الرسالة لمراجعة الشرطة." }, sources: [uaeSources.banking] },
] as const;

/** Explainable local pattern cues, not an AI model or a dialect-accuracy claim. */
export function uaeRequestSignals(text: string): Array<{ code: "content_credentials" | "content_payment" | "content_urgency"; matched: string }> {
  const out: Array<{ code: "content_credentials" | "content_payment" | "content_urgency"; matched: string }> = [];
  const normalized = normalizeArabicText(text.slice(0, 10000));
  const clauses = normalized.split(/[.!?؟؛\n]+/).filter(clause => !/(?:\b(?:never|do not|don't)\b|لا\s+(?:تشارك|ترسل|تعط|تعطي|تحول|تدفع)|لازم ما)/i.test(clause));
  const rules = [
    { code: "content_credentials" as const, pattern: /(?:طرش(?:لي|وا|ي)?|ارسل|عط(?:ني|نا)|عطني|اعط|شارك|send|share|give|tell|enter)[\s\S]{0,65}(?:\botp\b|\bpin\b|\bcvv\b|verification code|الكود|كود|رمز|باسورد|باسوورد|كلمة السر)/i },
    { code: "content_credentials" as const, pattern: /(?:وافق|اضغط موافق|approve)[\s\S]{0,65}(?:uae\s*pass|الهوية الرقمية|طلب الدخول|login)/i },
    { code: "content_payment" as const, pattern: /(?:حو[ّ]?ل|سدد|ادفع|pay|transfer)[\s\S]{0,65}(?:درهم|aed|رسوم|غرامة|حساب|iban|fee)/i },
    { code: "content_urgency" as const, pattern: /الحين|بسرعة|بيسكر|بيتوقف|بنوقف|بنحظر|اخر فرصة|\b(?:right now|last chance|arrest)\b/i },
  ];
  for (const rule of rules) {
    const matched = clauses.map(clause => clause.match(rule.pattern)?.[0]).find(Boolean);
    if (matched && !out.some(item => item.code === rule.code)) out.push({ code: rule.code, matched });
  }
  return out;
}

export function uaeContext(input: Pick<MessageInput, "body" | "sender" | "url">) {
  const text = normalizeArabicText(`${input.body} ${input.sender} ${input.url ?? ""}`).slice(0, 12000);
  const scenarios = uaeScenarios.filter(scenario => scenario.pattern.test(text));
  const host = hostFromUrl(input.url);
  const reference = host ? officialReferences.find(item => isDomainBoundary(host, item.domain)) ?? null : null;
  const phone = normalizeUaePhone(input.sender);
  const publishedContact = phone === "600561111" ? { name: { en: "UAE PASS help desk", ar: "مكتب مساعدة الهوية الرقمية" }, source: uaeSources.identity } : null;
  return { scenarios, reference, phone, publishedContact };
}

export const policeUaeGuidance: Bi[] = [
  { en: "Preserve the original message, recipient-supplied sender, URL and payment receipt; compare normalized phone/email/domain indicators only within authorized reports. A shared indicator is a review lead, not an identified offender.", ar: "احفظ الرسالة الأصلية والمرسل كما قدمه المستلم والرابط وإيصال الدفع؛ قارن مؤشرات الهاتف والبريد والنطاق بعد توحيدها داخل البلاغات المصرح بها فقط. المؤشر المشترك خيط مراجعة وليس تحديداً لمرتكب." },
  { en: "Independently confirm the claimed UAE entity and any financial loss. Route preparation through the existing human-approved review; Taakkad does not file a police report, contact banks or request removal automatically.", ar: "تحقق بشكل مستقل من الجهة الإماراتية المدعاة وأي خسارة مالية. مرّر الإعداد عبر المراجعة البشرية المعتمدة القائمة؛ لا يقدم تأكّد بلاغ شرطة ولا يتواصل مع البنوك ولا يطلب الإزالة تلقائياً." },
];