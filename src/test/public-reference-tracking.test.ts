import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { demoTrackingSchema, publicReferenceSchema, publicTrackingResultSchema } from "@/lib/organizations/demo-schema";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), lookup: vi.fn(), select: vi.fn(), eq: vi.fn(), from: vi.fn(), header: vi.fn(), responseHeader: vi.fn() }));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: mocks.header, setResponseHeader: mocks.responseHeader }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mocks.rpc, from: mocks.from } }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => {
  const builder = (validate: (input: unknown) => unknown = input => input) => ({
    middleware: () => builder(validate),
    inputValidator: (next: (input: unknown) => unknown) => builder(next),
    handler: (handler: (args: { data: unknown }) => unknown) => (args: { data: unknown }) => handler({ data: validate(args.data) }),
  });
  return { createServerFn: () => builder() };
});
import { readPublicReference } from "@/lib/organizations/public-tracking.server";
import { trackPublicReference } from "@/lib/organizations/demo.functions";

const submittedAt = "2026-11-20T10:00:00+00:00";
const db = { rpc: mocks.rpc, from: mocks.from } as unknown as SupabaseClient<Database>;
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal("crypto", webcrypto);
  mocks.header.mockReturnValue("192.0.2.50");
  mocks.rpc.mockResolvedValue({ data: true, error: null });
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.lookup });
  mocks.lookup.mockResolvedValue({ data: { organization_applications: { status: "approved", demo_under_review: false, submitted_at: submittedAt, payload: { name: "PRIVATE NAME", email: "private@example.test" }, correction_note: "PRIVATE REJECTION", documents: ["PRIVATE FILE"], audit: ["PRIVATE NOTE"], status_updated_at: "2026-11-24T16:00:00Z" }, secret_hash: "PRIVATE HASH", application_id: "PRIVATE ID" }, error: null });
});
afterEach(() => vi.unstubAllGlobals());

describe("reference-only tracking privacy and enumeration boundaries", () => {
  it("accepts only the existing five-digit reference, with no password or applicant fields", () => {
    expect(publicReferenceSchema.parse({ code: "12345" })).toEqual({ code: "12345" });
    for (const value of ["1234", "123456", "00001", "abcde"]) expect(publicReferenceSchema.safeParse({ code: value }).success).toBe(false);
    for (const key of ["secret", "email", "application_id"]) expect(publicReferenceSchema.safeParse({ code: "12345", [key]: "private" }).success).toBe(false);
  });
  it("returns exactly reference, original submission date, status and a fixed bilingual message", async () => {
    const result = await readPublicReference(db, { code: "12345" });
    expect(Object.keys(result).sort()).toEqual(["code", "message", "status", "submittedAt"]);
    expect(result).toMatchObject({ code: "12345", status: "approved", submittedAt });
    expect(Object.keys(result.message).sort()).toEqual(["ar", "en"]);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    expect(mocks.select).toHaveBeenCalledExactlyOnceWith("organization_applications(status,demo_under_review,submitted_at)");
    expect(mocks.eq).toHaveBeenCalledWith("code", "12345");
  });
  it.each(["pending", "under_review", "needs_information", "approved", "rejected"])("returns general %s status without decision details", async status => {
    mocks.lookup.mockResolvedValue({ data: { organization_applications: { status: status === "under_review" ? "pending" : status, demo_under_review: status === "under_review", submitted_at: submittedAt, correction_note: "PRIVATE" } }, error: null });
    const result = await readPublicReference(db, { code: "12345" });
    expect(result.status).toBe(status);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });
  it("uses the same safe result shape for missing and unlinked references", async () => {
    const expected = { code: "12345", status: null, submittedAt: null, message: { en: "No application status is available for this reference.", ar: "لا تتوفر حالة طلب لهذا الرقم المرجعي." } };
    for (const data of [null, { organization_applications: null }]) {
      mocks.lookup.mockResolvedValue({ data, error: null });
      expect(await readPublicReference(db, { code: "12345" })).toEqual(expected);
    }
  });
  it("charges successes and misses to the same caller budget across all references", async () => {
    await readPublicReference(db, { code: "12345" });
    mocks.lookup.mockResolvedValue({ data: null, error: null });
    await readPublicReference(db, { code: "54321" });
    const calls = mocks.rpc.mock.calls.filter(call => (call[1] as { bucket_key: string }).bucket_key.startsWith("demo-public-status:"));
    expect(calls).toHaveLength(2); expect(calls[0]).toEqual(calls[1]);
    expect(calls[0]?.[1]).toMatchObject({ max_requests: 20, window_seconds: 3600 });
    expect(mocks.rpc).toHaveBeenCalledWith("organization_rate_limit", { bucket_key: "demo-public-status-global", max_requests: 1000, window_seconds: 3600 });
  });
  it("blocks the twenty-first caller lookup before reading records", async () => {
    let count = 0;
    mocks.rpc.mockImplementation(async (_name: string, args: { bucket_key: string }) => ({ data: args.bucket_key === "demo-public-status-global" || ++count <= 20, error: null }));
    for (let i = 0; i < 20; i++) await readPublicReference(db, { code: String(12345 + i) });
    await expect(readPublicReference(db, { code: "54321" })).rejects.toThrow("Too many requests");
    expect(mocks.lookup).toHaveBeenCalledTimes(20);
  });
  it("blocks distributed guessing after the shared ceiling", async () => {
    mocks.rpc.mockImplementation(async (_name: string, args: { bucket_key: string }) => ({ data: args.bucket_key !== "demo-public-status-global", error: null }));
    await expect(readPublicReference(db, { code: "12345" })).rejects.toThrow("temporarily unavailable");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("fails closed if a budget is unavailable", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "PRIVATE DATABASE ERROR" } });
    await expect(readPublicReference(db, { code: "12345" })).rejects.toThrow("Too many requests");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("does not relay database errors or sensitive fields through the public endpoint", async () => {
    mocks.lookup.mockResolvedValue({ data: null, error: { message: "PRIVATE ERROR" } });
    await expect(readPublicReference(db, { code: "12345" })).rejects.toThrow("Status lookup temporarily unavailable");
    const safe = { code: "12345", submittedAt, status: "approved", message: { en: "General status", ar: "حالة عامة" } };
    for (const key of ["name", "payload", "documents", "notes", "email", "rejection_details", "secret_hash", "application_id"])
      expect(publicTrackingResultSchema.safeParse({ ...safe, [key]: "PRIVATE" }).success).toBe(false);
  });
  it("keeps public responses out of shared caches", async () => {
    const result = await trackPublicReference({ data: { code: "12345" } });
    expect(result.status).toBe("approved");
    expect(mocks.responseHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
  });
  it("retains secret-required private tracking rather than granting private access with a reference", () => {
    expect(demoTrackingSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(demoTrackingSchema.safeParse({ code: "12345", secret: "a".repeat(64) }).success).toBe(true);
  });
});