import { z } from "zod";
import { officialReferences } from "@/lib/services/url/official-references";
import { analyzeUrl } from "@/lib/services/url/analyze";
export const targets = officialReferences;
export const targetSchema = z.string().refine(value => targets.some(t => t.domain === value), "Unknown target");
export const domainSchema = z.string().trim().toLowerCase().max(253).refine(value => { const a = analyzeUrl(value); return a.networkEligible && a.host === value && a.domain === value; }, "Enter a registrable public domain, not a URL");
export const indicatorSchema = z.object({ type: z.enum(["domain", "email", "phone", "url", "ip", "sms_sender", "social_handle"]), value: z.string().trim().min(1).max(2000) }).strict();
export const sources = ["manual", "search_result", "advertisement", "business_listing", "helpline"] as const;
export const importRowSchema = z.object({ title: z.string().trim().min(1).max(200), targetDomain: targetSchema, domain: domainSchema.nullable().default(null), source: z.enum(sources), sourceReference: z.string().trim().min(1).max(1000), sourceObservedAt: z.string().datetime().nullable().default(null), notes: z.string().max(4000).default(""), synthetic: z.boolean(), indicators: z.array(indicatorSchema).min(1).max(20) }).strict();
export const importSchema = z.array(importRowSchema).min(1).max(50);
export const observationSchema = z.object({ checkedAt: z.string().datetime(), dns: z.enum(["resolved", "no_records", "unavailable"]), dnsSource: z.string().max(1000), records: z.array(z.object({ name: z.string(), type: z.number(), data: z.string() })).max(100), addresses: z.array(z.string()).max(100), dnssecValidated: z.boolean(), nonPublicAnswers: z.boolean(), asns: z.array(z.number()).max(20), networkSource: z.string().nullable(), registration: z.enum(["confirmed", "not_found", "unsupported", "unavailable"]), rdapSource: z.string().nullable(), registeredAt: z.string().datetime().nullable(), ageDays: z.number().nonnegative().nullable() });
export const recordSchema = importRowSchema.extend({ id: z.string().uuid(), createdAt: z.string().datetime(), source: z.enum(["generated", ...sources]), observation: observationSchema.nullable() });
export const workspaceSchema = z.object({ records: z.array(recordSchema).max(500), revision: z.number().int().nonnegative() });
export const commandSchema = z.discriminatedUnion("action", [z.object({ action: z.literal("generate"), targetDomain: targetSchema, revision: z.number().int().nonnegative() }).strict(), z.object({ action: z.literal("import"), rows: importSchema, revision: z.number().int().nonnegative() }).strict(), z.object({ action: z.literal("verify"), ids: z.array(z.string().uuid()).min(1).max(4), revision: z.number().int().nonnegative() }).strict()]);
export type IntelligenceRecord = z.infer<typeof recordSchema>;
export type Observation = z.infer<typeof observationSchema>;
export type IntelligenceWorkspace = z.infer<typeof workspaceSchema>;
export function isAnalyst(roles: readonly string[]) { return roles.includes("security_analyst"); }
