import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookie: vi.fn(), set: vi.fn(), request: vi.fn(), rpc: vi.fn() }));
vi.mock("@tanstack/react-start/server", () => ({ getCookie: mocks.cookie, setCookie: mocks.set, getRequest: mocks.request }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));
import { reserveAiUsage } from "@/lib/services/ai-usage.server";

beforeEach(() => { vi.clearAllMocks(); mocks.cookie.mockReturnValue("a11c0099-1111-4111-8111-111111111111"); mocks.request.mockReturnValue({ url: "https://trust.example" }); mocks.rpc.mockResolvedValue({ data: true, error: null }); });

it("uses a secure HttpOnly visitor cookie, not a message or IP address", async () => {
  expect(await reserveAiUsage()).toBe(true);
  expect(mocks.set).toHaveBeenCalledWith("trust-ai-visitor", "a11c0099-1111-4111-8111-111111111111", { httpOnly: true, sameSite: "strict", secure: true, path: "/", maxAge: 86400 });
  expect(mocks.rpc.mock.calls[0]?.[1]?.visitor_hash).toMatch(/^[a-f0-9]{64}$/);
  expect(mocks.rpc.mock.calls[0]?.[1]?.visitor_hash).not.toContain("a11c0099-");
});
it("fails closed when the durable reservation is denied", async () => {
  mocks.rpc.mockResolvedValue({ data: false, error: null });
  expect(await reserveAiUsage()).toBe(false);
});
it("fails closed when the durable counter service is unavailable", async () => {
  mocks.rpc.mockResolvedValue({ data: true, error: { message: "Unavailable" } });
  expect(await reserveAiUsage()).toBe(false);
});
it("keeps different visitors in different durable budget buckets", async () => {
  await reserveAiUsage(); const first = mocks.rpc.mock.calls[0]?.[1]?.visitor_hash;
  mocks.cookie.mockReturnValue("b22c0099-2222-4222-8222-222222222222");
  await reserveAiUsage(); expect(mocks.rpc.mock.calls[1]?.[1]?.visitor_hash).not.toBe(first);
});