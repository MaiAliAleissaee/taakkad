import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  header: vi.fn<(name: string) => string | undefined>(),
  rpc: vi.fn(),
  reset: vi.fn(),
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: mocks.header }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { resetPasswordForEmail: mocks.reset } }) }));
// Execute the real validator and handler, without the transport or any hosted email requests.
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({
  inputValidator: (validate: (input: unknown) => unknown) => ({
    handler: (handler: (input: { data: unknown }) => unknown) => (input: { data: unknown }) => handler({ data: validate(input.data) }),
  }),
}) }));

import { staffAttemptLimit } from "@/lib/security/staff-login.server";
import { requestStaffPasswordSetup } from "@/lib/security/staff-login.functions";

const origin = "https://taakkad.lovable.app";
function caller(address?: string, requestOrigin = origin) {
  mocks.header.mockImplementation(name => name === "cf-connecting-ip" ? address : name === "origin" ? requestOrigin : undefined);
}
async function digest(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("crypto", webcrypto);
  caller("192.0.2.1");
  mocks.rpc.mockResolvedValue({ data: true, error: null });
  mocks.reset.mockResolvedValue({ error: null });
  vi.stubEnv("SUPABASE_URL", "https://auth.example.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-public-key");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("staff recovery cannot charge another staff member's allowance", () => {
  it("charges only one caller bucket, never HAM123's identifier bucket", async () => {
    await staffAttemptLimit("HAM123", "setup");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("organization_rate_limit", {
      bucket_key: `staff-setup-caller:${await digest("192.0.2.1")}`, max_requests: 3, window_seconds: 3600,
    });
  });
  it("changing the target username cannot bypass the caller's recovery allowance", async () => {
    await staffAttemptLimit("HAM123", "setup");
    await staffAttemptLimit("HAM1234", "setup");
    expect(mocks.rpc.mock.calls[0]).toEqual(mocks.rpc.mock.calls[1]);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });
  it("attacker exhaustion cannot block a legitimate caller targeting the same recipient", async () => {
    const counts = new Map<string, number>();
    mocks.rpc.mockImplementation(async (_name: string, args: { bucket_key: string; max_requests: number }) => {
      const count = (counts.get(args.bucket_key) ?? 0) + 1;
      counts.set(args.bucket_key, count);
      return { data: count <= args.max_requests, error: null };
    });
    const data = { identifier: "staff@example.test", origin };
    for (let attempt = 0; attempt < 3; attempt++) expect(await requestStaffPasswordSetup({ data })).toEqual({ ok: true });
    expect(await requestStaffPasswordSetup({ data })).toEqual({ ok: false });
    caller("192.0.2.2");
    expect(await requestStaffPasswordSetup({ data })).toEqual({ ok: true });
    expect(mocks.reset).toHaveBeenCalledTimes(4);
    expect(mocks.reset).toHaveBeenLastCalledWith("staff@example.test", { redirectTo: `${origin}/reset-password` });
    expect(counts.size).toBe(2);
  });
  it("never shares a fallback recovery allowance when the trusted caller address is absent", async () => {
    caller();
    expect(await requestStaffPasswordSetup({ data: { identifier: "staff@example.test", origin } })).toEqual({ ok: false });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.reset).not.toHaveBeenCalled();
  });
  it("rejects mismatched origins before any counter or email effects", async () => {
    caller("192.0.2.1", "https://other.example.test");
    expect(await requestStaffPasswordSetup({ data: { identifier: "staff@example.test", origin } })).toEqual({ ok: false });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.reset).not.toHaveBeenCalled();
  });
  it("fails closed on counter errors before sending recovery email", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    expect(await requestStaffPasswordSetup({ data: { identifier: "staff@example.test", origin } })).toEqual({ ok: false });
    expect(mocks.reset).not.toHaveBeenCalled();
  });
  it.each(["login", "link"])("preserves caller and identifier limits for %s", async kind => {
    await staffAttemptLimit("HAM123", kind);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    for (const value of ["192.0.2.1", "HAM123"]) expect(mocks.rpc).toHaveBeenCalledWith("organization_rate_limit", {
      bucket_key: `staff-${kind}:${await digest(value)}`, max_requests: 10, window_seconds: 3600,
    });
  });
});