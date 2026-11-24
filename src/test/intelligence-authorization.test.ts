import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
const mocks = vi.hoisted(() => ({ identity: vi.fn() }));
vi.mock("@/lib/security/authorization.server", () => ({ securityIdentity: mocks.identity }));
import { authorizeAnalyst } from "@/lib/intelligence/authorization.server";
function client(roles: string[], active: boolean): SupabaseClient<Database> {
  return { from: () => ({ select: () => ({ eq: async () => ({ data: roles.map(role => ({ role })), error: null }) }) }), rpc: async () => ({ data: active, error: null }) } as unknown as SupabaseClient<Database>;
}
describe("intelligence server authorization", () => {
  it("denies an officer before any intelligence operation", async () => { mocks.identity.mockResolvedValue({ id: "staff" }); await expect(authorizeAnalyst(client(["organization_verification_officer"], true))).rejects.toThrow("Forbidden"); });
  it("denies supervisors without Analyst role", async () => { mocks.identity.mockResolvedValue({ id: "staff" }); await expect(authorizeAnalyst(client(["security_supervisor"], true))).rejects.toThrow("Forbidden"); });
  it("denies a revoked or non-active analyst session", async () => { mocks.identity.mockResolvedValue({ id: "staff" }); await expect(authorizeAnalyst(client(["security_analyst"], false))).rejects.toThrow("Forbidden"); });
  it("allows an active Analyst without assigning any role", async () => { mocks.identity.mockResolvedValue({ id: "staff" }); await expect(authorizeAnalyst(client(["security_analyst"], true))).resolves.toEqual({ id: "staff" }); });
  it("preserves authentication failure", async () => { mocks.identity.mockRejectedValueOnce(new Error("Unauthorized")); await expect(authorizeAnalyst(client(["security_analyst"], true))).rejects.toThrow("Unauthorized"); });
});
