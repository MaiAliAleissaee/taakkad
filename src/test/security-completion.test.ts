import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { publicWorkspaceTarget } from "@/lib/security/workspace-target";
import { requireActiveAiSession } from "@/lib/services/authenticated-ai.server";
import { authorizeReceiptRecovery } from "@/lib/organizations/demo-receipt.server";
import { demoRecoverySchema, demoTrackingSchema } from "@/lib/organizations/demo-schema";

function client(active: boolean, demo = true) {
  const rpc = vi.fn(async () => ({ data: active, error: null }));
  const from = vi.fn(() => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { id: "application", demo_registration: demo }, error: null }) }) }) }));
  return { db: { rpc, from } as unknown as SupabaseClient<Database>, rpc, from };
}
describe("approved security boundaries", () => {
  it("uses a private workspace only for its current authenticated analyst", () => {
    expect(publicWorkspaceTarget("owner", "owner", true, true)).toBe("owner");
  });
  it("drops private targeting immediately after logout", () => {
    expect(publicWorkspaceTarget("owner", undefined, true, false)).toBeNull();
  });
  it("drops another account's saved workspace after switching accounts", () => {
    expect(publicWorkspaceTarget("owner", "other", true, true)).toBeNull();
  });
  it("does not target private workspaces while loading or for an officer", () => {
    expect(publicWorkspaceTarget("owner", "owner", false, true)).toBeNull();
    expect(publicWorkspaceTarget("owner", "owner", true, false)).toBeNull();
  });
  it("rejects inactive sessions before paid inference", async () => {
    const c = client(false); await expect(requireActiveAiSession(c.db)).rejects.toThrow("Unauthorized");
    expect(c.rpc).toHaveBeenCalledWith("has_active_app_session");
  });
  it("allows active authentication without requiring an analyst role for paid AI", async () => {
    const c = client(true); await expect(requireActiveAiSession(c.db)).resolves.toBeUndefined();
    expect(c.from).not.toHaveBeenCalled();
  });
  it("denies wrong-institution or inactive recovery before reading applications", async () => {
    const c = client(false); await expect(authorizeReceiptRecovery(c.db,"application")).rejects.toThrow("Recovery denied");
    expect(c.from).not.toHaveBeenCalled();
  });
  it("allows an active officer to recover a demo receipt without changing a decision", async () => {
    const c = client(true); await expect(authorizeReceiptRecovery(c.db,"application")).resolves.toBeUndefined();
    expect(c.rpc).toHaveBeenCalledWith("has_private_evidence_access", { subject_kind: "application" });
  });
  it("does not change legacy non-demo tracking through demo recovery", async () => {
    await expect(authorizeReceiptRecovery(client(true,false).db,"application")).rejects.toThrow("Recovery denied");
  });
  it("requires explicit human confirmation and a recovery record", () => {
    const input = { id: "00000000-0000-4000-8000-000000000001", note: "Independent identity check completed", confirmed: true };
    expect(demoRecoverySchema.safeParse(input).success).toBe(true);
    expect(demoRecoverySchema.safeParse({ ...input, confirmed: false }).success).toBe(false);
    expect(demoRecoverySchema.safeParse({ ...input, note: "" }).success).toBe(false);
  });
  it("does not allow contact information to act as tracking proof", () => {
    expect(demoTrackingSchema.safeParse({ code: "12345", email: "demo@example.test" }).success).toBe(false);
  });
});