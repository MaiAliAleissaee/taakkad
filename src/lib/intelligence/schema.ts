import { z } from "zod";
import { officialReferences } from "@/lib/services/url/official-references";
import { analyzeUrl } from "@/lib/services/url/analyze";
export const targets = officialReferences;
export const targetSchema = z.string().refine(value => targets.some(t => t.domain === value), "Unknown target");
export const domainSchema = z.string().trim().toLowerCase().max(253).refine(value => { const a = analyzeUrl(value); return a.networkEligible && a.host === value && a.domain === value; }, "Enter a registrable public domain, not a URL");
// Storage-only fictional domains; the network domainSchema stays unchanged.
const fictionalDomainSchema = z.string().trim().toLowerCase().max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+example$/);
export const indicatorSchema = z.object({ type: z.enum(["domain", "email", "phone", "url", "ip", "sms_sender", "social_handle"]), value: z.string().trim().min(1).max(2000) }).strict();
export const sources = ["manual", "search_result", "advertisement", "business_listing", "helpline"] as const;
const importRowBase = z.object({ title: z.string().trim().min(1).max(200), targetDomain: targetSchema, domain: z.union([domainSchema, fictionalDomainSchema]).nullable().default(null), source: z.enum(sources), sourceReference: z.string().trim().min(1).max(1000), sourceObservedAt: z.string().datetime().nullable().default(null), notes: z.string().max(4000).default(""), synthetic: z.boolean(), indicators: z.array(indicatorSchema).min(1).max(20) }).strict();
function validateFictionalDomain(row: { domain: string | null; synthetic: boolean }, ctx: z.RefinementCtx) {
  if (row.domain?.endsWith(".example") && !row.synthetic) ctx.addIssue({ code: "custom", path: ["domain"], message: "fictional_domain_requires_synthetic" });
}
export const importRowSchema = importRowBase.superRefine(validateFictionalDomain);
export const importSchema = z.array(importRowSchema).min(1).max(50);
export const observationSchema = z.object({ checkedAt: z.string().datetime(), dns: z.enum(["resolved", "no_records", "unavailable"]), dnsSource: z.string().max(1000), records: z.array(z.object({ name: z.string(), type: z.number(), data: z.string() })).max(100), addresses: z.array(z.string()).max(100), dnssecValidated: z.boolean(), nonPublicAnswers: z.boolean(), asns: z.array(z.number()).max(20), networkSource: z.string().nullable(), registration: z.enum(["confirmed", "not_found", "unsupported", "unavailable"]), rdapSource: z.string().nullable(), registeredAt: z.string().datetime().nullable(), ageDays: z.number().nonnegative().nullable() });
export const recordSchema = importRowBase.extend({ id: z.string().uuid(), createdAt: z.string().datetime(), source: z.enum(["generated", ...sources]), observation: observationSchema.nullable() }).superRefine(validateFictionalDomain);
export const workspaceSchema = z.object({ records: z.array(recordSchema).max(500), revision: z.number().int().nonnegative() });
export const commandSchema = z.discriminatedUnion("action", [z.object({ action: z.literal("generate"), targetDomain: targetSchema, revision: z.number().int().nonnegative() }).strict(), z.object({ action: z.literal("import"), rows: importSchema, revision: z.number().int().nonnegative() }).strict(), z.object({ action: z.literal("verify"), ids: z.array(z.string().uuid()).min(1).max(4), revision: z.number().int().nonnegative() }).strict()]);
export type IntelligenceRecord = z.infer<typeof recordSchema>;
export type Observation = z.infer<typeof observationSchema>;
export type IntelligenceWorkspace = z.infer<typeof workspaceSchema>;
export function isAnalyst(roles: readonly string[]) { return roles.includes("security_analyst"); }

export function importFieldErrors(issues: readonly z.core.$ZodIssue[]) {
  return issues.map(issue => {
    const field = String(issue.path[1] ?? "batch");
    const row = typeof issue.path[0] === "number" ? issue.path[0] + 1 : null;
    const messages: Record<string, [string, string]> = {
      title: ["Title must contain 1–200 characters.", "يجب أن يحتوي العنوان على 1–200 حرف."],
      targetDomain: ["Select a supported targeted entity / service.", "اختر جهة أو خدمة مستهدفة مدعومة."],
      domain: issue.message === "fictional_domain_requires_synthetic"
        ? [".example domains require the fictional demonstration checkbox.", "تتطلب نطاقات .example تحديد مربع السجل التجريبي الخيالي."]
        : ["Enter a bare registrable public domain (no URL or path), or a valid .example name with the fictional checkbox.", "أدخل نطاقاً عاماً قابلاً للتسجيل دون رابط أو مسار، أو اسماً صالحاً ينتهي بـ .example مع تحديد مربع السجل الخيالي."],
      source: ["Select a supported detection source.", "اختر مصدر رصد مدعوماً."],
      sourceReference: ["Source reference must contain 1–1000 characters.", "يجب أن يحتوي مرجع المصدر على 1–1000 حرف."],
      sourceObservedAt: ["Use an ISO UTC observation timestamp or null.", "استخدم وقت رصد بصيغة ISO UTC أو null."],
      notes: ["Evidence / notes must not exceed 4000 characters.", "يجب ألا تتجاوز الأدلة أو الملاحظات 4000 حرف."],
      synthetic: ["Specify whether this is a fictional demonstration record.", "حدد ما إذا كان هذا سجلاً تجريبياً خيالياً."],
      indicators: ["Enter 1–20 indicators as type:value, with a value of 1–2000 characters. Types: domain, email, phone, url, ip, sms_sender, social_handle.", "أدخل 1–20 مؤشراً بصيغة نوع:قيمة، بقيمة من 1–2000 حرف. الأنواع: domain, email, phone, url, ip, sms_sender, social_handle."],
      batch: ["Import 1–50 records with only supported fields.", "استورد 1–50 سجلاً بالحقول المدعومة فقط."],
    };
    const pair = messages[field] ?? messages["batch"];
    return { field, row, en: pair?.[0] ?? "Invalid field.", ar: pair?.[1] ?? "حقل غير صالح." };
  });
}
