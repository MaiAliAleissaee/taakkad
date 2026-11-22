import { z } from "zod";

export const aiIndicatorSchema = z.object({
  type: z.enum(["domain", "url", "ip", "phone", "social_handle", "email"]),
  value: z.string().min(1).max(2000),
}).strict();
const text = z.string().min(1).max(1200);
const bilingual = z.object({ en: text, ar: text }).strict();
export const aiFindingsSchema = z.object({
  risk: z.enum(["low", "medium", "high", "critical"]),
  explanation: bilingual,
  warningSigns: z.array(bilingual).max(8),
  indicators: z.array(aiIndicatorSchema).max(20),
  safeActions: z.array(bilingual).min(1).max(6),
}).strict();
export type AiFindings = z.infer<typeof aiFindingsSchema>;
export type AiOutcome =
  | { status: "performed"; model: "openai/gpt-6.1-sol"; findings: AiFindings }
  | { status: "unavailable"; reason: "disabled" | "service" | "limited" | "refused" };

// Explicit strict JSON schema is validated again with Zod before display.
const biJson = { type: "object", additionalProperties: false, properties: { en: { type: "string" }, ar: { type: "string" } }, required: ["en", "ar"] };
export const aiJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    risk: { type: "string", enum: ["low", "medium", "high", "critical"] },
    explanation: biJson,
    warningSigns: { type: "array", items: biJson },
    indicators: { type: "array", items: { type: "object", additionalProperties: false, properties: { type: { type: "string", enum: ["domain", "url", "ip", "phone", "social_handle", "email"] }, value: { type: "string" } }, required: ["type", "value"] } },
    safeActions: { type: "array", items: biJson },
  },
  required: ["risk", "explanation", "warningSigns", "indicators", "safeActions"],
};