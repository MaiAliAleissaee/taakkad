import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requestRecipientOwnedCode } from "@/lib/organizations/email-request.server";

const receipt = { reference: "TZ-ORG-00000000-0000-4000-8000-000000000001", secret: "a".repeat(64) };
function fixture(options: { active?: boolean; confirmed?: boolean; email?: string; recipient?: string; userId?: string; begin?: boolean; send?: boolean; authError?: boolean } = {}) {
  const rpc = vi.fn(async () => ({ data: options.active ?? true, error: null }));
  const getUser = vi.fn(async () => ({ data: { user: { id: options.userId ?? "owner", email: options.email ?? "owner@example.test", email_confirmed_at: options.confirmed === false ? null : "2026-11-24T10:00:00Z" } }, error: options.authError ? new Error("Invalid token") : null }));
  const services = {
    receiptIdentity: vi.fn(async () => ({ application_id: "application", email: options.recipient ?? "owner@example.test" })),
    beginCode: vi.fn(async () => options.begin ?? true),
    sendCode: vi.fn(async () => options.send ?? true),
  };
  return { client: { rpc, auth: { getUser } } as unknown as SupabaseClient<Database>, rpc, getUser, services };
}
describe("legacy email verification: confirmed recipient ownership before any outbound action", () => {
  it("rejects a missing bearer before inspecting the receipt or sending email", async () => {
    const f = fixture(); await expect(requestRecipientOwnedCode(f.client, "", "owner", receipt, f.services)).rejects.toThrow("Verified recipient sign-in required");
    expect(f.rpc).not.toHaveBeenCalled(); expect(f.services.receiptIdentity).not.toHaveBeenCalled(); expect(f.services.sendCode).not.toHaveBeenCalled();
  });
  it("rejects a revoked session before private receipt reads and email requests", async () => {
    const f = fixture({ active: false }); await expect(requestRecipientOwnedCode(f.client, "test-session", "owner", receipt, f.services)).rejects.toThrow("Verified recipient sign-in required");
    expect(f.rpc).toHaveBeenCalledWith("has_active_app_session"); expect(f.getUser).not.toHaveBeenCalled(); expect(f.services.receiptIdentity).not.toHaveBeenCalled(); expect(f.services.sendCode).not.toHaveBeenCalled();
  });
  it("rejects an unconfirmed email even when a visitor owns the receipt", async () => {
    const f = fixture({ confirmed: false }); await expect(requestRecipientOwnedCode(f.client, "test-session", "owner", receipt, f.services)).rejects.toThrow("Verified recipient sign-in required");
    expect(f.services.receiptIdentity).not.toHaveBeenCalled(); expect(f.services.beginCode).not.toHaveBeenCalled(); expect(f.services.sendCode).not.toHaveBeenCalled();
  });
  it("rejects an invalid identity response before receipt or outbound effects", async () => {
    const f = fixture({ authError: true }); await expect(requestRecipientOwnedCode(f.client, "test-session", "owner", receipt, f.services)).rejects.toThrow("Verified recipient sign-in required");
    expect(f.services.receiptIdentity).not.toHaveBeenCalled(); expect(f.services.sendCode).not.toHaveBeenCalled();
  });
  it("rejects a user identity inconsistent with the authenticated caller", async () => {
    const f = fixture({ userId: "other" }); await expect(requestRecipientOwnedCode(f.client, "test-session", "owner", receipt, f.services)).rejects.toThrow("Verified recipient sign-in required");
    expect(f.services.receiptIdentity).not.toHaveBeenCalled(); expect(f.services.sendCode).not.toHaveBeenCalled();
  });
  it("rejects a third-party address despite an active session and valid receipt", async () => {
    const f = fixture({ recipient: "victim@example.test" }); await expect(requestRecipientOwnedCode(f.client, "test-session", "owner", receipt, f.services)).rejects.toThrow("Verified recipient sign-in required");
    expect(f.services.beginCode).not.toHaveBeenCalled(); expect(f.services.sendCode).not.toHaveBeenCalled();
  });
  it("preserves legitimate matching-recipient code verification and the application cooldown", async () => {
    const f = fixture({ email: "Owner@EXAMPLE.test", recipient: "owner@example.test" }); await expect(requestRecipientOwnedCode(f.client, "test-session", "owner", receipt, f.services)).resolves.toEqual({ sent: true });
    expect(f.getUser).toHaveBeenCalledWith("test-session"); expect(f.services.receiptIdentity).toHaveBeenCalledWith(receipt.reference, receipt.secret); expect(f.services.beginCode).toHaveBeenCalledWith("application"); expect(f.services.sendCode).toHaveBeenCalledOnce(); expect(f.services.sendCode).toHaveBeenCalledWith("owner@example.test");
  });
  it("rejects an invalid receipt before requesting or sending a code", async () => {
    const f = fixture(); f.services.receiptIdentity.mockRejectedValueOnce(new Error("Tracking credentials invalid")); await expect(requestRecipientOwnedCode(f.client, "test-session", "owner", receipt, f.services)).rejects.toThrow("Tracking credentials invalid");
    expect(f.services.beginCode).not.toHaveBeenCalled(); expect(f.services.sendCode).not.toHaveBeenCalled();
  });
  it("never sends when the existing code cooldown denies the request", async () => {
    const f = fixture({ begin: false }); await expect(requestRecipientOwnedCode(f.client, "test-session", "owner", receipt, f.services)).rejects.toThrow("Wait before requesting another code"); expect(f.services.sendCode).not.toHaveBeenCalled();
  });
  it("does not claim delivery when hosted email sending fails", async () => {
    const f = fixture({ send: false }); await expect(requestRecipientOwnedCode(f.client, "test-session", "owner", receipt, f.services)).rejects.toThrow("Email code unavailable");
  });
});