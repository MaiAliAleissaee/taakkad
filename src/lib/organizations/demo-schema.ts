import { z } from "zod";
import type { Organization } from "@/lib/domain/types";

const websiteSchema = z.string().trim().max(200).url().refine(value => {
  const url = new URL(value);
  return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
}, "Use a valid HTTP(S) website without embedded credentials.");
export const demoRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  website: websiteSchema,
  email: z.string().trim().email().max(200),
  social: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(7).max(30).regex(/^\+?[\d\s()-]+$/),
  sms: z.string().trim().min(2).max(30).regex(/^[\p{L}\p{N} _-]+$/u),
}).strict();
export type DemoRegistration = z.infer<typeof demoRegistrationSchema>;
export const demoTrackingSecretSchema = z.string().trim().regex(/^[a-f0-9]{64}$/);
export const demoTrackingSchema = z.object({ code: z.string().trim().regex(/^[1-9]\d{4}$/), secret: demoTrackingSecretSchema }).strict();
export const demoRecoverySchema = z.object({ id: z.string().uuid(), note: z.string().trim().min(10).max(1000), confirmed: z.literal(true) }).strict();
export type DemoReceipt = { code: string; secret: string; status: "pending"; updatedAt: string };
export type DemoStatus = "pending" | "under_review" | "needs_information" | "approved" | "rejected";
export const demoTrackingResultSchema = z.object({ status: z.enum(["pending", "under_review", "needs_information", "approved", "rejected"]), updatedAt: z.string().datetime({ offset: true }) }).strict();
export function canReviewDemo(status: string, decision: string) {
  return ["pending", "needs_information"].includes(status) || (status === "approved" && decision === "approved");
}
export function matchesDemoRegistry(org: { name: { ar: string; en: string }; channels: Array<{ value: string }> }, query: string) {
  const term = query.trim().toLowerCase();
  return !term || [org.name.ar, org.name.en, ...org.channels.map(c => c.value)].some(value => value.toLowerCase().includes(term));
}
/** Display filters only: prototype approval never becomes a trusted Organization. */
export function matchesPrototypeRegistry(org: Parameters<typeof matchesDemoRegistry>[0], query: string, type: string, status: string) {
  return (type === "all" || type === "business") && (status === "all" || status === "verified") && matchesDemoRegistry(org, query);
}
export function demoPayload(input: DemoRegistration): Organization {
  const data = demoRegistrationSchema.parse(input);
  const at = new Date().toISOString();
  return {
    id: crypto.randomUUID(), name: { en: data.name, ar: data.name }, type: "business",
    domains: [new URL(data.website).hostname.toLowerCase()], contactEmail: data.email,
    status: "pending", registeredAt: at, keyFingerprint: "SIMULATED",
    channels: ([['website', data.website], ['email', data.email], ['social', data.social], ['phone', data.phone], ['sms', data.sms]] as const)
      .map(([type, value]) => ({ id: crypto.randomUUID(), type, value, status: "pending", addedAt: at, submittedAt: at })),
  };
}
export function demoStatus(row: { status: string; demo_under_review?: boolean }): DemoStatus {
  if (row.status === "pending") return row.demo_under_review ? "under_review" : "pending";
  if (["approved", "rejected", "needs_information"].includes(row.status)) return row.status as DemoStatus;
  return "rejected";
}
export function demoDecisionReady(note: string) { return note.trim().length > 0 && note.trim().length <= 1000; }