import { createServerFn } from "@tanstack/react-start";
import { messageSchema } from "@/lib/security/schema";
import type { AiOutcome } from "./ai-schema";

/** Public analysis returns interpretations only, never case records or identifiers. */
export const analyzePrivateMessage = createServerFn({ method: "POST" })
  .inputValidator(input => messageSchema.omit({ aiIndicators: true, claimedOrgId: true }).strict().refine(value => !!(value.sender.trim() || value.body.trim() || value.url?.trim()), "Empty message").parse(input))
  .handler(async ({ data }): Promise<AiOutcome> => {
    try {
      const { reserveAiUsage } = await import("./ai-usage.server");
      if (!await reserveAiUsage()) return { status: "unavailable", reason: "limited" };
      const { inferFraud } = await import("./ai-analysis.server");
      return await inferFraud(data);
    } catch { return { status: "unavailable", reason: "service" }; }
  });