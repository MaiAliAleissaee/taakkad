import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { aiIndicatorSchema } from "./ai-schema";
import { snapshotSchema } from "@/lib/security/schema";
import { correlateIndicators } from "./ai-correlation";

export const correlatePrivateIndicators = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.array(aiIndicatorSchema).max(20).parse(input))
  .handler(async ({ data, context }) => {
    const { securityIdentity } = await import("@/lib/security/authorization.server");
    const user = await securityIdentity(context.supabase);
    const result = await context.supabase.from("security_workspaces").select("payload").eq("user_id", user.id).maybeSingle();
    if (result.error) throw new Error("Correlation unavailable");
    return result.data ? correlateIndicators(snapshotSchema.parse(result.data.payload).alerts, data) : [];
  });