import type {
  AlertSource, AlertStatus, Bi, ChannelType, EvidenceKind, IndicatorType, LookalikeStatus, LookalikeTechnique,
  OrgStatus, OrgType, Severity, TrustState,
} from "@/lib/domain/types";
import type { ReasonCode } from "@/lib/services/verification";

export const orgTypeLabel: Record<OrgType, Bi> = {
  government: { en: "Government", ar: "جهة حكومية" },
  bank: { en: "Bank", ar: "بنك" },
  business: { en: "Business", ar: "شركة" },
};

export const orgStatusLabel: Record<OrgStatus, Bi> = {
  verified: { en: "Verified", ar: "موثّقة" },
  pending: { en: "Pending review", ar: "قيد المراجعة" },
  suspended: { en: "Suspended", ar: "موقوفة" },
};

export const channelLabel: Record<ChannelType, Bi> = {
  email: { en: "Email", ar: "بريد إلكتروني" },
  sms: { en: "SMS sender ID", ar: "معرّف الرسائل النصية" },
  phone: { en: "Phone", ar: "هاتف" },
  website: { en: "Website", ar: "موقع إلكتروني" },
  social: { en: "Social account", ar: "حساب تواصل اجتماعي" },
  other: { en: "Other digital channel", ar: "قناة رقمية أخرى" },
};

export const trustStateLabel: Record<TrustState, Bi> = {
  verified: { en: "Registered channel", ar: "قناة مسجّلة" },
  unverified: { en: "Unverified", ar: "غير موثّق" },
  suspicious: { en: "Suspicious", ar: "مشبوه" },
};

export const trustStateHelp: Record<TrustState, Bi> = {
  verified: {
    en: "This channel matches an active approved registry entry. This does not authenticate the individual message or its sender.",
    ar: "تطابق هذه القناة سجلاً معتمداً ونشطاً. هذا لا يثبت أصالة الرسالة الفردية أو هوية مرسلها.",
  },
  unverified: {
    en: "We could not confirm the sender. This is not proof of fraud — check with the organization directly.",
    ar: "لم نتمكن من تأكيد المرسل. هذا ليس دليلاً على الاحتيال — تحقّق مع الجهة مباشرة.",
  },
  suspicious: {
    en: "We found specific evidence of impersonation, such as a lookalike domain or a confirmed case.",
    ar: "وجدنا دليلاً محدداً على الانتحال، مثل نطاق مشابه أو قضية مؤكدة.",
  },
};

export const alertStatusLabel: Record<AlertStatus, Bi> = {
  new: { en: "New", ar: "جديد" },
  investigating: { en: "Under review", ar: "قيد المراجعة" },
  escalated: { en: "Escalated", ar: "مُصعّد" },
  confirmed: { en: "Confirmed impersonation", ar: "انتحال مؤكد" },
  false_positive: { en: "False positive", ar: "إنذار خاطئ" },
};

export const severityLabel: Record<Severity, Bi> = {
  critical: { en: "Critical", ar: "حرج" },
  high: { en: "High", ar: "مرتفع" },
  medium: { en: "Medium", ar: "متوسط" },
  low: { en: "Low", ar: "منخفض" },
};

export const sourceLabel: Record<AlertSource, Bi> = {
  simulated_detection: { en: "Simulated detection", ar: "رصد افتراضي" },
  public_report: { en: "Public report", ar: "بلاغ عام" },
  lookalike_scan: { en: "Lookalike scan", ar: "فحص النطاقات المشابهة" },
};

export const indicatorLabel: Record<IndicatorType, Bi> = {
  domain: { en: "Domain", ar: "نطاق" },
  url: { en: "URL", ar: "رابط" },
  ip: { en: "IP address", ar: "عنوان IP" },
  sms_sender: { en: "SMS sender", ar: "مرسل نصي" },
  phone: { en: "Phone", ar: "هاتف" },
  social_handle: { en: "Social handle", ar: "حساب تواصل" },
  email: { en: "Email", ar: "بريد" },
};

export const evidenceLabel: Record<EvidenceKind, Bi> = {
  message: { en: "Message sample", ar: "عيّنة رسالة" },
  whois: { en: "Registration record", ar: "سجل التسجيل" },
  dns: { en: "DNS record", ar: "سجل DNS" },
  screenshot: { en: "Page capture", ar: "لقطة صفحة" },
  report: { en: "Public report", ar: "بلاغ عام" },
};

export const lookalikeStatusLabel: Record<LookalikeStatus, Bi> = {
  monitoring: { en: "Monitoring", ar: "تحت المراقبة" },
  flagged: { en: "Flagged", ar: "مُعلَّم" },
  takedown_requested: { en: "Takedown requested", ar: "طُلب الإيقاف" },
  cleared: { en: "Cleared", ar: "سليم" },
};

export const techniqueLabel: Record<LookalikeTechnique, Bi> = {
  substitution: { en: "character substitution", ar: "استبدال أحرف" },
  keyword: { en: "added lure keyword", ar: "إضافة كلمة استدراج" },
  typo: { en: "typo variant", ar: "خطأ إملائي مقصود" },
  combo: { en: "substitution + keyword", ar: "استبدال + كلمة استدراج" },
  tld_swap: { en: "different domain ending", ar: "امتداد نطاق مختلف" },
};

export const reasonTemplate: Record<ReasonCode, Bi> = {
  channel_not_active: { en: "A record for {value} exists under {org}, but this channel is not currently approved and active. It cannot produce a Verified registry match.", ar: "يوجد سجل لـ{value} لدى {org}، لكن هذه القناة ليست معتمدة ونشطة حالياً. لا يمكنها إنتاج مطابقة موثّقة في السجل." },
  sender_registered: { en: "{value} is a registered {channel} of {org}.", ar: "{value} هو {channel} مسجّل لدى {org}." },
  domain_registered: { en: "Link domain {domain} is registered to {org}.", ar: "نطاق الرابط {domain} مسجّل باسم {org}." },
  org_verified: { en: "{org} completed simulated organization review. Individual message identity remains unauthenticated.", ar: "أكملت {org} مراجعة الجهة الافتراضية. تبقى هوية الرسالة الفردية دون توثيق." },
  org_pending: { en: "{org} is registered, but verification is still pending.", ar: "{org} مسجّلة، لكن التوثيق ما زال قيد المراجعة." },
  org_suspended: { en: "{org}'s verification is currently suspended.", ar: "توثيق {org} موقوف حالياً." },
  no_match: {
    en: "No registered organization uses this sender or link. That alone is not evidence of fraud.",
    ar: "لا توجد جهة مسجّلة تستخدم هذا المرسل أو الرابط. وهذا وحده ليس دليلاً على الاحتيال.",
  },
  link_mismatch: { en: "The sender is registered, but link domain {domain} is not registered to {org}.", ar: "المرسل مسجّل، لكن نطاق الرابط {domain} غير مسجّل باسم {org}." },
  link_registered_sender_unknown: { en: "The link goes to {org}'s registered domain {domain}, but sender {value} is not a registered channel.", ar: "الرابط يؤدي إلى نطاق {org} المسجّل {domain}، لكن المرسل {value} ليس قناة مسجّلة." },
  claimed_unregistered: { en: "Claims to be {org}, but {value} is not one of its registered channels.", ar: "يدّعي أنه {org}، لكن {value} ليس من قنواتها المسجّلة." },
  lookalike_domain: { en: "{domain} imitates {target} ({org}) — {technique}, {similarity}% similar.", ar: "{domain} يقلّد {target} ({org}) — {technique}، تشابه {similarity}%." },
  lookalike_sender: { en: "Sender {value} imitates {target}, registered by {org} ({similarity}% similar).", ar: "المرسل {value} يقلّد {target} المسجّل لدى {org} (تشابه {similarity}%)." },
  blocklisted: { en: "{value} appears in security case {caseId} (escalated or confirmed).", ar: "{value} ظاهر في القضية الأمنية {caseId} (مُصعّدة أو مؤكدة)." },
  content_urgency: { en: "Uses urgent or threatening language (\"{matched}\").", ar: "يستخدم لغة استعجال أو تهديد («{matched}»)." },
  content_credentials: { en: "Asks for passwords, PINs or card details (\"{matched}\").", ar: "يطلب كلمات مرور أو أرقاماً سرية أو بيانات بطاقة («{matched}»)." },
  content_payment: { en: "Requests a payment or fee (\"{matched}\").", ar: "يطلب دفعة أو رسوماً («{matched}»)." },
  caution: {
    en: "Before acting, contact the organization through a channel you already trust.",
    ar: "قبل اتخاذ أي إجراء، تواصل مع الجهة عبر قناة تثق بها مسبقاً.",
  },
};
