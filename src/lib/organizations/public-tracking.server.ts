import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { demoStatus, publicReferenceSchema, publicTrackingResultSchema, type DemoStatus } from "./demo-schema";
import { trackingRateLimit } from "./tracking.server";

const messages: Record<DemoStatus, { en: string; ar: string }> = {
  pending: { en: "The application is awaiting review.", ar: "الطلب بانتظار المراجعة." },
  under_review: { en: "The application is under review.", ar: "الطلب قيد المراجعة." },
  needs_information: { en: "The application requires additional information. Contact the designated authority privately.", ar: "يتطلب الطلب معلومات إضافية. تواصل مع الجهة المختصة بشكل خاص." },
  approved: { en: "The application is approved in the prototype; this is not real-world identity or channel verification.", ar: "تم اعتماد الطلب في النموذج التجريبي؛ لا يعني ذلك توثيق الهوية أو القنوات فعلياً." },
  rejected: { en: "The application has not been approved.", ar: "لم يتم اعتماد الطلب." },
};

/** Privileged read of deliberately public metadata only; never fetch payloads or receipt hashes. */
export async function readPublicReference(db: SupabaseClient<Database>, input: unknown) {
  const { code } = publicReferenceSchema.parse(input);
  // Existing durable custom budgets apply to successes and misses, across all references.
  await trackingRateLimit("demo-public-status", 20);
  const budget = await db.rpc("organization_rate_limit", { bucket_key: "demo-public-status-global", max_requests: 1000, window_seconds: 3600 });
  if (budget.error || !budget.data) throw new Error("Status lookup temporarily unavailable");
  const result = await db.from("organization_demo_tracking")
    .select("organization_applications(status,demo_under_review,submitted_at)")
    .eq("code", code).maybeSingle();
  if (result.error) throw new Error("Status lookup temporarily unavailable");
  const row = result.data?.organization_applications;
  const status = row ? demoStatus(row) : null;
  return publicTrackingResultSchema.parse({
    code, submittedAt: row?.submitted_at ?? null, status,
    message: status ? messages[status] : { en: "No application status is available for this reference.", ar: "لا تتوفر حالة طلب لهذا الرقم المرجعي." },
  });
}