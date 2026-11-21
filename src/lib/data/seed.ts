import type { DemoState, ImpersonationAlert, LookalikeDomain, LookalikeStatus, Organization, SampleMessage } from "@/lib/domain/types";
import { detectLookalike } from "@/lib/services/lookalike";

/** Bump when the seed shape changes so stale browser data is replaced. */
export const SEED_VERSION = 1;

// Entirely fictional organizations. Domains use the reserved ".example" TLD.
const organizations: Organization[] = [
  {
    id: "org-alnoor",
    name: { en: "Al Noor Civil Registry Authority", ar: "هيئة النور للسجل المدني" },
    type: "government",
    domains: ["alnoor.gov.example"],
    channels: [
      { id: "ch-an-1", type: "email", value: "notices@alnoor.gov.example" },
      { id: "ch-an-2", type: "website", value: "services.alnoor.gov.example" },
      { id: "ch-an-3", type: "sms", value: "ALNOOR-GOV" },
      { id: "ch-an-4", type: "phone", value: "+971 2 000 0101" },
    ],
    status: "verified",
    registeredAt: "2026-09-02T08:00:00Z",
    verifiedAt: "2026-09-05T10:30:00Z",
    contactEmail: "trust@alnoor.gov.example",
    keyFingerprint: "SHA256:4F:9A:21:C7:0B:E3:5D:88:12:AF:6C:3E",
  },
  {
    id: "org-falcon",
    name: { en: "Falcon National Bank", ar: "بنك الصقر الوطني" },
    type: "bank",
    domains: ["falconbank.example"],
    channels: [
      { id: "ch-fb-1", type: "email", value: "alerts@falconbank.example" },
      { id: "ch-fb-2", type: "sms", value: "FALCONBANK" },
      { id: "ch-fb-3", type: "phone", value: "+971 4 000 0200" },
      { id: "ch-fb-4", type: "social", value: "@FalconNationalBank" },
      { id: "ch-fb-5", type: "website", value: "www.falconbank.example" },
    ],
    status: "verified",
    registeredAt: "2026-08-14T09:15:00Z",
    verifiedAt: "2026-08-18T13:00:00Z",
    contactEmail: "security@falconbank.example",
    keyFingerprint: "SHA256:B2:07:EE:41:9C:D0:73:1A:5F:64:AB:90",
  },
  {
    id: "org-oasis",
    name: { en: "Oasis Traffic Services Department", ar: "إدارة خدمات المرور – الواحة" },
    type: "government",
    domains: ["oasis-traffic.gov.example"],
    channels: [
      { id: "ch-ot-1", type: "sms", value: "OASIS-TRF" },
      { id: "ch-ot-2", type: "website", value: "oasis-traffic.gov.example" },
      { id: "ch-ot-3", type: "email", value: "fines@oasis-traffic.gov.example" },
    ],
    status: "verified",
    registeredAt: "2026-09-20T07:45:00Z",
    verifiedAt: "2026-09-24T11:10:00Z",
    contactEmail: "digital@oasis-traffic.gov.example",
    keyFingerprint: "SHA256:7C:55:A9:03:FE:12:48:B6:D1:29:0E:C4",
  },
  {
    id: "org-saqr",
    name: { en: "Saqr Express Logistics", ar: "صقر إكسبريس للخدمات اللوجستية" },
    type: "business",
    domains: ["saqrexpress.example"],
    channels: [
      { id: "ch-sx-1", type: "email", value: "tracking@saqrexpress.example" },
      { id: "ch-sx-2", type: "sms", value: "SAQREXPRESS" },
      { id: "ch-sx-3", type: "website", value: "saqrexpress.example" },
    ],
    status: "verified",
    registeredAt: "2026-10-01T10:00:00Z",
    verifiedAt: "2026-10-03T15:20:00Z",
    contactEmail: "abuse@saqrexpress.example",
    keyFingerprint: "SHA256:E1:3B:90:6D:24:C8:F7:05:AA:5E:71:BD",
  },
  {
    id: "org-dunepay",
    name: { en: "Dune Digital Payments", ar: "الكثبان للمدفوعات الرقمية" },
    type: "business",
    domains: ["dunepay.example"],
    channels: [
      { id: "ch-dp-1", type: "email", value: "hello@dunepay.example" },
      { id: "ch-dp-2", type: "social", value: "@DunePay" },
      { id: "ch-dp-3", type: "website", value: "dunepay.example" },
    ],
    status: "verified",
    registeredAt: "2026-10-11T12:30:00Z",
    verifiedAt: "2026-10-12T09:00:00Z",
    contactEmail: "trust@dunepay.example",
    keyFingerprint: "SHA256:09:D4:6A:B8:31:EF:C2:57:80:1D:9B:66",
  },
  {
    id: "org-pearl",
    name: { en: "Pearl Coast Utilities", ar: "مرافق ساحل اللؤلؤ" },
    type: "business",
    domains: ["pearlcoast-utilities.example"],
    channels: [
      { id: "ch-pc-1", type: "email", value: "billing@pearlcoast-utilities.example" },
      { id: "ch-pc-2", type: "phone", value: "+971 6 000 0300" },
    ],
    status: "pending",
    registeredAt: "2026-11-17T08:20:00Z",
    contactEmail: "it@pearlcoast-utilities.example",
    keyFingerprint: "SHA256:A7:62:1F:D3:0C:95:E8:4B:27:B0:5A:13",
  },
  {
    id: "org-meridian",
    name: { en: "Gulf Meridian Insurance", ar: "الخليج ميريديان للتأمين" },
    type: "business",
    domains: ["gulfmeridian.example"],
    channels: [{ id: "ch-gm-1", type: "email", value: "info@gulfmeridian.example" }],
    status: "suspended",
    registeredAt: "2026-07-03T11:00:00Z",
    verifiedAt: "2026-07-06T08:40:00Z",
    contactEmail: "compliance@gulfmeridian.example",
    keyFingerprint: "SHA256:3D:C1:88:5B:E0:47:2A:F9:66:0D:B3:71",
  },
];

const messages: SampleMessage[] = [
  {
    id: "msg-1",
    channel: "email",
    sender: "notices@alnoor.gov.example",
    subject: { en: "ID renewal appointment confirmed", ar: "تأكيد موعد تجديد الهوية" },
    body: {
      en: "Your appointment on 3 December at 10:00 is confirmed. Bring your current ID card.",
      ar: "تم تأكيد موعدك يوم 3 ديسمبر الساعة 10:00. يرجى إحضار بطاقة الهوية الحالية.",
    },
    url: "https://services.alnoor.gov.example/appointments/confirm",
    receivedAt: "2026-11-21T07:12:00Z",
  },
  {
    id: "msg-2",
    channel: "sms",
    sender: "FALCONBANK",
    body: {
      en: "Your Falcon National Bank one-time code is 482915. Bank staff will never ask for this code.",
      ar: "رمزك لمرة واحدة من بنك الصقر الوطني هو 482915. لن يطلب منك موظفو البنك هذا الرمز أبداً.",
    },
    receivedAt: "2026-11-21T06:40:00Z",
  },
  {
    id: "msg-3",
    channel: "sms",
    sender: "FALC0NBANK",
    claimedOrgId: "org-falcon",
    body: {
      en: "URGENT: Your account has been suspended. Verify within 24 hours to restore access.",
      ar: "عاجل: تم تعليق حسابك. قم بالتحقق خلال 24 ساعة لاستعادة الوصول.",
    },
    url: "https://falconbank-secure-login.example/verify",
    receivedAt: "2026-11-20T21:03:00Z",
  },
  {
    id: "msg-4",
    channel: "email",
    sender: "support@saqrexpress-delivery.example",
    claimedOrgId: "org-saqr",
    subject: { en: "Your parcel is on hold", ar: "شحنتك معلّقة" },
    body: {
      en: "Pay a 12.50 AED customs fee today to release your parcel.",
      ar: "ادفع رسوم جمركية قدرها 12.50 درهم اليوم للإفراج عن شحنتك.",
    },
    url: "https://saqrexpress-delivery.example/pay",
    receivedAt: "2026-11-20T15:47:00Z",
  },
  {
    id: "msg-5",
    channel: "email",
    sender: "hello@dunepay.example",
    subject: { en: "New cashback offers this weekend", ar: "عروض استرداد نقدي جديدة هذا الأسبوع" },
    body: {
      en: "Enjoy up to 5% cashback at participating stores. Offers are listed in your app.",
      ar: "استمتع باسترداد نقدي حتى 5% لدى المتاجر المشاركة. العروض متاحة في تطبيقك.",
    },
    url: "https://dunepay.example/offers",
    receivedAt: "2026-11-20T12:00:00Z",
  },
  {
    id: "msg-6",
    channel: "email",
    sender: "billing@pearlcoast-utilities.example",
    subject: { en: "Your November statement is ready", ar: "كشف حساب نوفمبر جاهز" },
    body: {
      en: "Your monthly statement is available. No action is required if you use auto-pay.",
      ar: "كشف حسابك الشهري متاح. لا يلزم أي إجراء إذا كنت تستخدم الدفع التلقائي.",
    },
    url: "https://pearlcoast-utilities.example/billing",
    receivedAt: "2026-11-19T09:30:00Z",
  },
  {
    id: "msg-7",
    channel: "email",
    sender: "newsletter@gulfmarket-deals.example",
    subject: { en: "Weekend sale: up to 40% off electronics", ar: "تخفيضات نهاية الأسبوع: حتى 40% على الإلكترونيات" },
    body: {
      en: "Shop our weekend sale on laptops, phones and accessories.",
      ar: "تسوّق تخفيضات نهاية الأسبوع على الحواسيب والهواتف والإكسسوارات.",
    },
    url: "https://gulfmarket-deals.example/sale",
    receivedAt: "2026-11-19T08:05:00Z",
  },
  {
    id: "msg-8",
    channel: "sms",
    sender: "+971 50 000 0333",
    claimedOrgId: "org-oasis",
    body: {
      en: "Unpaid traffic fine of 500 AED. Pay immediately to avoid penalties.",
      ar: "مخالفة مرورية غير مدفوعة بقيمة 500 درهم. ادفع فوراً لتجنب الغرامات.",
    },
    url: "https://oasis-traffic-fines.example",
    receivedAt: "2026-11-18T18:22:00Z",
  },
  {
    id: "msg-9",
    channel: "social",
    sender: "@FalconNationalBank",
    body: {
      en: "Branch opening hours are extended during the holiday week.",
      ar: "تم تمديد ساعات عمل الفروع خلال أسبوع العطلة.",
    },
    url: "https://www.falconbank.example/branches",
    receivedAt: "2026-11-18T10:00:00Z",
  },
  {
    id: "msg-10",
    channel: "phone",
    sender: "+971 4 555 0199",
    claimedOrgId: "org-falcon",
    body: {
      en: "Caller says they are from the bank's fraud team and asks you to read out your card PIN.",
      ar: "يدّعي المتصل أنه من فريق مكافحة الاحتيال في البنك ويطلب منك قراءة الرقم السري لبطاقتك.",
    },
    receivedAt: "2026-11-17T14:35:00Z",
  },
  {
    id: "msg-11",
    channel: "sms",
    sender: "OASIS-TRF",
    body: {
      en: "Reminder: your vehicle registration expires in 30 days. Renew through the official portal.",
      ar: "تذكير: تنتهي صلاحية تسجيل مركبتك خلال 30 يوماً. جدّد عبر البوابة الرسمية.",
    },
    url: "https://oasis-traffic.gov.example/renew",
    receivedAt: "2026-11-17T07:00:00Z",
  },
  {
    id: "msg-12",
    channel: "email",
    sender: "info@gulfmeridian.example",
    subject: { en: "Policy renewal reminder", ar: "تذكير بتجديد الوثيقة" },
    body: {
      en: "Your motor policy renews next month. Review your cover in your account.",
      ar: "تتجدد وثيقة تأمين مركبتك الشهر القادم. راجع التغطية من حسابك.",
    },
    receivedAt: "2026-11-16T11:15:00Z",
  },
];

const alerts: ImpersonationAlert[] = [
  {
    id: "al-1042",
    caseId: "TZ-1042",
    title: { en: "SMS phishing campaign imitating Falcon National Bank", ar: "حملة تصيّد عبر الرسائل النصية تنتحل بنك الصقر الوطني" },
    summary: {
      en: "Lookalike sender ID and cloned login page asking customers to 'verify' suspended accounts.",
      ar: "معرّف مرسل مشابه وصفحة دخول مستنسخة تطلب من العملاء «التحقق» من حسابات معلّقة.",
    },
    targetOrgId: "org-falcon",
    severity: "critical",
    riskScore: 92,
    status: "escalated",
    source: "simulated_detection",
    detectedAt: "2026-11-20T21:30:00Z",
    assignee: "Analyst 07",
    indicators: [
      { type: "domain", value: "falconbank-secure-login.example" },
      { type: "url", value: "https://falconbank-secure-login.example/verify" },
      { type: "sms_sender", value: "FALC0NBANK" },
      { type: "ip", value: "203.0.113.45" },
    ],
    evidence: [
      { id: "ev-1", kind: "message", capturedAt: "2026-11-20T21:05:00Z", description: { en: "SMS sample submitted by 37 simulated recipients within 2 hours.", ar: "عيّنة رسالة نصية أبلغ عنها 37 مستلماً افتراضياً خلال ساعتين." } },
      { id: "ev-2", kind: "whois", capturedAt: "2026-11-20T21:20:00Z", description: { en: "Domain registered 2 days before the campaign via a privacy-protected registrar (simulated record).", ar: "تم تسجيل النطاق قبل يومين من الحملة عبر مسجّل يحجب الهوية (سجل افتراضي)." } },
      { id: "ev-3", kind: "screenshot", capturedAt: "2026-11-20T21:25:00Z", description: { en: "Login page copies the bank's logo and colours and requests card number and PIN.", ar: "صفحة الدخول تنسخ شعار البنك وألوانه وتطلب رقم البطاقة والرقم السري." } },
      { id: "ev-4", kind: "dns", capturedAt: "2026-11-20T21:26:00Z", description: { en: "A record resolves to 203.0.113.45, shared with case TZ-1043.", ar: "سجل A يشير إلى 203.0.113.45، وهو مشترك مع القضية TZ-1043." } },
    ],
    notes: [{ id: "n-1", at: "2026-11-21T06:00:00Z", author: "Analyst 07", text: "Escalated to bank security liaison (simulated). Awaiting takedown confirmation." }],
  },
  {
    id: "al-1043",
    caseId: "TZ-1043",
    title: { en: "Parcel customs-fee scam imitating Saqr Express", ar: "احتيال رسوم جمركية لشحنات ينتحل صقر إكسبريس" },
    summary: {
      en: "Emails ask recipients to pay a small fee on a lookalike delivery domain.",
      ar: "رسائل بريد تطلب دفع رسوم صغيرة عبر نطاق توصيل مشابه.",
    },
    targetOrgId: "org-saqr",
    severity: "high",
    riskScore: 81,
    status: "investigating",
    source: "simulated_detection",
    detectedAt: "2026-11-20T16:10:00Z",
    assignee: "Analyst 12",
    indicators: [
      { type: "domain", value: "saqrexpress-delivery.example" },
      { type: "email", value: "support@saqrexpress-delivery.example" },
      { type: "ip", value: "203.0.113.45" },
    ],
    evidence: [
      { id: "ev-5", kind: "message", capturedAt: "2026-11-20T15:50:00Z", description: { en: "Email requesting 12.50 AED customs fee with payment link.", ar: "بريد يطلب رسوماً جمركية بقيمة 12.50 درهم مع رابط دفع." } },
      { id: "ev-6", kind: "dns", capturedAt: "2026-11-20T16:05:00Z", description: { en: "Hosted on the same IP as TZ-1042 (simulated).", ar: "مستضاف على عنوان IP نفسه للقضية TZ-1042 (افتراضي)." } },
    ],
    notes: [],
  },
  {
    id: "al-1044",
    caseId: "TZ-1044",
    title: { en: "Fake traffic-fine payment site", ar: "موقع مزيّف لدفع المخالفات المرورية" },
    summary: {
      en: "SMS from a mobile number links to a domain imitating Oasis Traffic Services.",
      ar: "رسالة من رقم جوال تحتوي رابطاً لنطاق ينتحل خدمات المرور – الواحة.",
    },
    targetOrgId: "org-oasis",
    severity: "high",
    riskScore: 77,
    status: "new",
    source: "simulated_detection",
    detectedAt: "2026-11-18T18:40:00Z",
    indicators: [
      { type: "domain", value: "oasis-traffic-fines.example" },
      { type: "phone", value: "+971 50 000 0333" },
      { type: "ip", value: "198.51.100.23" },
    ],
    evidence: [
      { id: "ev-7", kind: "message", capturedAt: "2026-11-18T18:25:00Z", description: { en: "SMS claiming an unpaid 500 AED fine.", ar: "رسالة تدّعي وجود مخالفة غير مدفوعة بقيمة 500 درهم." } },
    ],
    notes: [],
  },
  {
    id: "al-1045",
    caseId: "TZ-1045",
    title: { en: "ID renewal lure imitating Al Noor Civil Registry", ar: "استدراج لتجديد الهوية ينتحل هيئة النور للسجل المدني" },
    summary: {
      en: "Lookalike renewal portal collects personal details and passport scans.",
      ar: "بوابة تجديد مشابهة تجمع البيانات الشخصية وصور جوازات السفر.",
    },
    targetOrgId: "org-alnoor",
    severity: "medium",
    riskScore: 64,
    status: "new",
    source: "lookalike_scan",
    detectedAt: "2026-11-19T10:15:00Z",
    indicators: [
      { type: "domain", value: "alnoor-gov-renew.example" },
      { type: "url", value: "https://alnoor-gov-renew.example/id-renewal" },
      { type: "ip", value: "198.51.100.23" },
    ],
    evidence: [
      { id: "ev-8", kind: "screenshot", capturedAt: "2026-11-19T10:20:00Z", description: { en: "Form requests ID number, date of birth and passport upload.", ar: "نموذج يطلب رقم الهوية وتاريخ الميلاد ورفع صورة الجواز." } },
    ],
    notes: [],
  },
  {
    id: "al-1046",
    caseId: "TZ-1046",
    title: { en: "Social media 'support' account imitating Falcon National Bank", ar: "حساب «دعم» على وسائل التواصل ينتحل بنك الصقر الوطني" },
    summary: {
      en: "Account replies to customer complaints and moves conversations to a phone number.",
      ar: "حساب يرد على شكاوى العملاء وينقل المحادثات إلى رقم هاتف.",
    },
    targetOrgId: "org-falcon",
    severity: "medium",
    riskScore: 58,
    status: "investigating",
    source: "public_report",
    detectedAt: "2026-11-17T15:00:00Z",
    assignee: "Analyst 07",
    indicators: [
      { type: "social_handle", value: "@FalconBank_Support" },
      { type: "phone", value: "+971 4 555 0199" },
    ],
    evidence: [
      { id: "ev-9", kind: "report", capturedAt: "2026-11-17T14:50:00Z", description: { en: "Public report: caller asked for card PIN after social media contact.", ar: "بلاغ عام: طلب المتصل الرقم السري للبطاقة بعد التواصل عبر وسائل التواصل." } },
    ],
    notes: [],
  },
  {
    id: "al-1047",
    caseId: "TZ-1047",
    title: { en: "Careers domain resembling Dune Digital Payments", ar: "نطاق توظيف يشبه الكثبان للمدفوعات الرقمية" },
    summary: {
      en: "Flagged by lookalike scan; later confirmed as legitimately operated by the company's HR vendor (simulated).",
      ar: "رُصد عبر فحص النطاقات المشابهة، ثم تبيّن أنه يُدار بشكل مشروع من مزوّد الموارد البشرية للشركة (افتراضي).",
    },
    targetOrgId: "org-dunepay",
    severity: "low",
    riskScore: 22,
    status: "false_positive",
    source: "lookalike_scan",
    detectedAt: "2026-11-12T09:00:00Z",
    assignee: "Analyst 12",
    indicators: [{ type: "domain", value: "dunepay-careers.example" }],
    evidence: [
      { id: "ev-10", kind: "whois", capturedAt: "2026-11-12T09:30:00Z", description: { en: "Registrant matches the organization's declared HR vendor (simulated).", ar: "المسجِّل يطابق مزوّد الموارد البشرية المعلن للجهة (افتراضي)." } },
    ],
    notes: [{ id: "n-2", at: "2026-11-13T08:00:00Z", author: "Analyst 12", text: "Organization confirmed ownership. Closed as false positive." }],
  },
];

function lookalike(id: string, domain: string, orgId: string, target: string, firstSeen: string, registrar: string, status: LookalikeStatus): LookalikeDomain {
  const m = detectLookalike(domain, target);
  return {
    id, domain, targetDomain: target, targetOrgId: orgId,
    technique: m?.technique ?? "typo", similarity: m?.similarity ?? 70,
    firstSeen, registrar, status, source: "seed",
  };
}

const lookalikes: LookalikeDomain[] = [
  lookalike("lk-1", "falconbank-secure-login.example", "org-falcon", "falconbank.example", "2026-11-18T03:00:00Z", "Demo Registrar Ltd.", "flagged"),
  lookalike("lk-2", "fa1conbank.example", "org-falcon", "falconbank.example", "2026-11-10T12:00:00Z", "Sandbox Domains Inc.", "takedown_requested"),
  lookalike("lk-3", "falc0nbank-support.example", "org-falcon", "falconbank.example", "2026-11-19T22:00:00Z", "Example Names LLC", "monitoring"),
  lookalike("lk-4", "saqrexpress-delivery.example", "org-saqr", "saqrexpress.example", "2026-11-19T08:00:00Z", "Demo Registrar Ltd.", "flagged"),
  lookalike("lk-5", "oasis-traffic-fines.example", "org-oasis", "oasis-traffic.gov.example", "2026-11-16T05:00:00Z", "Sandbox Domains Inc.", "monitoring"),
  lookalike("lk-6", "alnoor-gov-renew.example", "org-alnoor", "alnoor.gov.example", "2026-11-18T14:00:00Z", "Example Names LLC", "monitoring"),
  lookalike("lk-7", "a1noor-gov.example", "org-alnoor", "alnoor.gov.example", "2026-11-20T09:00:00Z", "Demo Registrar Ltd.", "monitoring"),
  lookalike("lk-8", "dunepay-careers.example", "org-dunepay", "dunepay.example", "2026-11-11T10:00:00Z", "Example Names LLC", "cleared"),
];

export function createSeedState(): DemoState {
  return structuredClone({ version: SEED_VERSION, organizations, messages, alerts, lookalikes });
}
