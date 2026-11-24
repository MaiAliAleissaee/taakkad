import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  header: vi.fn<(name: string) => string | undefined>(),
  rpc: vi.fn(),
  reset: vi.fn(),
  password: vi.fn(),
  lookup: vi.fn(),
  user: vi.fn(),
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: mocks.header }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  rpc: mocks.rpc,
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }) }),
  auth: { admin: { getUserById: mocks.user } },
} }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { resetPasswordForEmail: mocks.reset, signInWithPassword: mocks.password } }) }));
// Execute the real validator and handler, without the transport or any hosted email requests.
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({
  inputValidator: (validate: (input: unknown) => unknown) => ({
    handler: (handler: (input: { data: unknown }) => unknown) => (input: { data: unknown }) => handler({ data: validate(input.data) }),
  }),
}) }));

import { staffAttemptLimit } from "@/lib/security/staff-login.server";
import { requestStaffPasswordSetup, signInStaff } from "@/lib/security/staff-login.functions";

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
  mocks.lookup.mockResolvedValue({ data: { user_id: "fictional-staff" }, error: null });
  mocks.user.mockResolvedValue({ data: { user: { email: "staff@example.test", email_confirmed_at: "2026-11-24T00:00:00Z" } }, error: null });
  mocks.password.mockResolvedValue({ data: { session: null }, error: { code: "invalid_credentials" } });
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
  it("preserves caller and secret-specific limits for private links", async () => {
    const kind = "link";
    await staffAttemptLimit("HAM123", kind);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    for (const value of ["192.0.2.1", "HAM123"]) expect(mocks.rpc).toHaveBeenCalledWith("organization_rate_limit", {
      bucket_key: `staff-${kind}:${await digest(value)}`, max_requests: 10, window_seconds: 3600,
    });
  });
});

describe("both staff portals share caller-isolated sign-in protection", () => {
  it("allows ten attempts per caller per hour without charging HAM123", async () => {
    await staffAttemptLimit("HAM123", "login");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("organization_rate_limit", {
      bucket_key: `staff-login-caller:${await digest("192.0.2.1")}`, max_requests: 10, window_seconds: 3600,
    });
  });
  it("keeps a caller's budget unchanged when switching between HAM123 and HAM1234", async () => {
    await staffAttemptLimit("HAM123", "login");
    await staffAttemptLimit("HAM1234", "login");
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.rpc.mock.calls[0]).toEqual(mocks.rpc.mock.calls[1]);
  });
  it("blocks the eleventh guess before authentication but preserves another caller's successful login", async () => {
    const counts = new Map<string, number>();
    mocks.rpc.mockImplementation(async (_name: string, args: { bucket_key: string; max_requests: number }) => {
      const count = (counts.get(args.bucket_key) ?? 0) + 1;
      counts.set(args.bucket_key, count);
      return { data: count <= args.max_requests, error: null };
    });
    const data = { identifier: "HAM123", password: "fictional-test-password" };
    for (let attempt = 0; attempt < 10; attempt++) expect(await signInStaff({ data })).toEqual({ ok: false, reason: "credentials" });
    expect(await signInStaff({ data: { ...data, identifier: "HAM1234" } })).toEqual({ ok: false, reason: "rate_limit" });
    expect(mocks.password).toHaveBeenCalledTimes(10);
    caller("192.0.2.2");
    mocks.password.mockResolvedValue({ data: { session: { access_token: "mock-access", refresh_token: "mock-refresh" } }, error: null });
    expect(await signInStaff({ data })).toEqual({ ok: true, accessToken: "mock-access", refreshToken: "mock-refresh" });
    expect(mocks.password).toHaveBeenCalledTimes(11);
    expect(counts.size).toBe(2);
  });
  it("rejects a missing trusted caller address before counters, aliases or password checks", async () => {
    caller();
    expect(await signInStaff({ data: { identifier: "HAM123", password: "fictional-test-password" } })).toEqual({ ok: false, reason: "unavailable" });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.lookup).not.toHaveBeenCalled();
    expect(mocks.password).not.toHaveBeenCalled();
  });
  it("counter failure prevents password checks", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    expect(await signInStaff({ data: { identifier: "HAM123", password: "fictional-test-password" } })).toEqual({ ok: false, reason: "rate_limit" });
    expect(mocks.lookup).not.toHaveBeenCalled();
    expect(mocks.password).not.toHaveBeenCalled();
  });
});