import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { setResponseHeader } from "@tanstack/react-start/server";
import { messageSchema } from "@/lib/security/schema";
import type { AiOutcome } from "./ai-schema";

/** Only paid semantic inference requires authentication; local/public checks are separate. */
export const analyzePrivateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => messageSchema.omit({ aiIndicators: true, claimedOrgId: true }).strict().refine(value => !!(value.sender.trim() || value.body.trim() || value.url?.trim()), "Empty message").parse(input))
  .handler(async ({ data, context }): Promise<AiOutcome> => {
    setResponseHeader("Cache-Control", "no-store");
    const { requireActiveAiSession } = await import("./authenticated-ai.server");
    await requireActiveAiSession(context.supabase);
    try {
      const { reserveAiUsage } = await import("./ai-usage.server");
      if (!await reserveAiUsage(context.userId)) return { status: "unavailable", reason: "limited" };
      const { inferFraud } = await import("./ai-analysis.server");
      return await inferFraud(data);
    } catch { return { status: "unavailable", reason: "service" }; }
  });