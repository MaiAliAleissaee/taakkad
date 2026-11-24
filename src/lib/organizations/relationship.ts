import { z } from "zod";
import type { Bi } from "@/lib/domain/types";

export const relationshipKinds = ["none", "parent", "subsidiary", "sister", "common_ownership", "shared_channels", "shared_provider", "other"] as const;
export const relationshipSchema = z.object({
  kind: z.enum(relationshipKinds),
  organization: z.string().trim().max(200),
  explanation: z.string().trim().max(2000),
  evidence: z.string().trim().max(2000),
}).strict().superRefine((value, ctx) => {
  if (value.kind !== "none") {
    if (value.organization.length < 2) ctx.addIssue({ code: "custom", path: ["organization"], message: "Specify the related organization" });
    if (value.explanation.length < 10) ctx.addIssue({ code: "custom", path: ["explanation"], message: "Explain the relationship" });
  }
});
export type Relationship = z.infer<typeof relationshipSchema>;
export const emptyRelationship: Relationship = { kind: "none", organization: "", explanation: "", evidence: "" };
export const relationshipLabels: Record<Relationship["kind"], Bi> = {
  none: { en: "Independent organization", ar: "جهة مستقلة" },
  parent: { en: "Parent company", ar: "شركة أم" },
  subsidiary: { en: "Subsidiary", ar: "شركة تابعة" },
  sister: { en: "Sister company", ar: "شركة شقيقة" },
  common_ownership: { en: "Corporate group / common ownership", ar: "مجموعة شركات / ملكية مشتركة" },
  shared_channels: { en: "Shared communication channels", ar: "قنوات تواصل مشتركة" },
  shared_provider: { en: "Shared service or hosting provider", ar: "مزود خدمة أو استضافة مشترك" },
  other: { en: "Other relationship", ar: "علاقة أخرى" },
};
export const conflictSchema = z.object({
  organizationId: z.string(), name: z.object({ en: z.string(), ar: z.string() }),
  indicator: z.string(), value: z.string(), matchedValue: z.string(),
  match: z.enum(["exact", "approximate"]), severity: z.enum(["high", "medium", "low"]),
  reason: z.enum(["channel_overlap", "domain_overlap", "similar_identity", "shared_infrastructure"]),
  provenance: z.enum(["application", "registry", "technical_snapshot"]),
});
export type IdentityConflict = z.infer<typeof conflictSchema>;
export const identityIndicatorLabels: Record<string, Bi> = {
  domain: { en: "Domain / website", ar: "النطاق / الموقع" },
  phone: { en: "Phone number", ar: "رقم الهاتف" },
  email: { en: "Email address", ar: "البريد الإلكتروني" },
  social: { en: "Social account", ar: "حساب التواصل" },
  sms: { en: "SMS sender ID", ar: "معرّف مرسل الرسائل" },
  name: { en: "Organization name", ar: "اسم الجهة" },
  ip: { en: "Hosting IP", ar: "عنوان IP للاستضافة" },
  dns_ns: { en: "DNS nameserver", ar: "خادم أسماء DNS" },
  dns_mx: { en: "Mail infrastructure", ar: "البنية التقنية للبريد" },
  dns_caa: { en: "Certificate authority policy", ar: "سياسة جهة إصدار الشهادات" },
  asn: { en: "Network provider ASN", ar: "رقم شبكة المزود ASN" },
};
export const conflictReviewSchema = z.object({
  id: z.string().uuid(), revision: z.number().int().nonnegative(),
  note: z.string().trim().min(20).max(2000), explanationReviewed: z.literal(true), evidenceReviewed: z.literal(true),
}).strict();
export function similarityAdvisories(conflicts: IdentityConflict[]) {
  // A name alone is not a matching channel or technical indicator. No advisory is an approval condition.
  return conflicts.filter(c => c.indicator !== "name");
}