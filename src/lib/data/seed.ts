import type { DemoState, Organization, SampleMessage } from "@/lib/domain/types";
import { upgradeChannelRegistry } from "@/lib/services/channels";

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

export function createSeedState(): DemoState {
  return upgradeChannelRegistry(structuredClone({ version: SEED_VERSION, organizations, messages, alerts: [], lookalikes: [] }));
}
