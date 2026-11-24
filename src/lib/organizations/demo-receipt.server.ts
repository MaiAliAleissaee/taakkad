import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { hashTrackingSecret, randomTrackingSecret } from "./tracking.server";

export async function newDemoReceiptSecret() {
  const secret = randomTrackingSecret();
  return { secret, hash: await hashTrackingSecret(secret) };
}

export async function authorizeReceiptRecovery(client: SupabaseClient<Database>, id: string) {
  const access = await client.rpc("has_private_evidence_access", { subject_kind: "application" });
  if (access.error || access.data !== true) throw new Error("Recovery denied");
  const row = await client.from("organization_applications").select("id,demo_registration").eq("id", id).single();
  if (row.error || !row.data?.demo_registration) throw new Error("Recovery denied");
}