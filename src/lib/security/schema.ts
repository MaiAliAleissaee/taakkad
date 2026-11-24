import { z } from "zod";
import { aiIndicatorSchema } from "@/lib/services/ai-schema";
const bi = z.object({ en: z.string(), ar: z.string() });
export const messageSchema = z.object({
  channel: z.enum(["email", "sms", "phone", "website", "social", "other"]),
  sender: z.string().max(500), url: z.string().max(2000).optional(), body: z.string().max(10000), claimedOrgId: z.string().max(200).optional(),
  aiIndicators: z.array(aiIndicatorSchema).max(20).optional(),
});
export const snapshotSchema = z.object({
  alerts: z.array(z.object({
    id: z.string(), caseId: z.string(), reportNumber: z.string().regex(/^\d+\/\d{4}$/).optional(), title: bi, summary: bi, targetOrgId: z.string().optional(),
    severity: z.enum(["critical", "high", "medium", "low"]), riskScore: z.number().min(0).max(100),
    status: z.enum(["new", "investigating", "escalated", "confirmed", "false_positive"]),
    source: z.enum(["simulated_detection", "public_report", "lookalike_scan"]), detectedAt: z.string(), assignee: z.string().optional(),
    indicators: z.array(z.object({ type: z.enum(["domain", "url", "ip", "sms_sender", "phone", "social_handle", "email"]), value: z.string() })),
    evidence: z.array(z.object({ id: z.string(), kind: z.enum(["message", "whois", "dns", "screenshot", "report"]), description: bi, capturedAt: z.string() })),
    notes: z.array(z.object({ id: z.string(), at: z.string(), author: z.string(), text: z.string() })),
  })).max(5000),
  lookalikes: z.array(z.object({
    id: z.string(), domain: z.string(), targetDomain: z.string(), targetOrgId: z.string(), technique: z.enum(["substitution", "keyword", "typo", "combo", "tld_swap"]),
    similarity: z.number(), firstSeen: z.string(), registrar: z.string(), status: z.enum(["monitoring", "flagged", "takedown_requested", "cleared"]), source: z.enum(["seed", "simulated_scan"]),
  })).max(5000),
});
export type SecuritySnapshot = z.infer<typeof snapshotSchema>;
export const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id: z.string(), status: z.enum(["new", "investigating", "escalated", "confirmed", "false_positive"]), confirmed: z.boolean().optional() }).superRefine((data, ctx) => { if ((data.status === "escalated" || data.status === "confirmed") && data.confirmed !== true) ctx.addIssue({ code: "custom", path: ["confirmed"], message: "Human confirmation required" }); }),
  z.object({ action: z.literal("assign"), id: z.string(), assignee: z.string().max(120) }),
  z.object({ action: z.literal("note"), id: z.string(), text: z.string().trim().min(1).max(10000) }),
  z.object({ action: z.literal("lookalike_status"), id: z.string(), status: z.enum(["monitoring", "flagged", "takedown_requested", "cleared"]), confirmed: z.boolean().optional() }).superRefine((data, ctx) => { if (data.status === "takedown_requested" && data.confirmed !== true) ctx.addIssue({ code: "custom", path: ["confirmed"], message: "Human confirmation required" }); }),
  z.object({ action: z.literal("scan"), items: snapshotSchema.shape.lookalikes }),
  z.object({ action: z.literal("reset") }),
]);