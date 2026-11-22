import { describe, expect, it } from "vitest";
import { alertContentSchema, mayManageAlert } from "@/lib/alerts/schema";
describe("Authorized public alert publishing", () => {
  it("allows analysts to draft", () => expect(mayManageAlert(["security_analyst"], "save", "draft")).toBe(true));
  it.each(["approve", "publish", "reject", "withdraw"] as const)("denies analysts %s", action => expect(mayManageAlert(["security_analyst"], action, "approved")).toBe(false));
  it("allows supervisors to approve drafts", () => expect(mayManageAlert(["security_supervisor"], "approve", "draft")).toBe(true));
  it("allows publishing only after approval", () => { expect(mayManageAlert(["security_supervisor"], "publish", "approved")).toBe(true); expect(mayManageAlert(["security_supervisor"], "publish", "draft")).toBe(false); });
  it("allows supervisors to withdraw published alerts", () => expect(mayManageAlert(["security_supervisor"], "withdraw", "published")).toBe(true));
  it("denies anonymous management", () => expect(mayManageAlert([], "save", "draft")).toBe(false));
  it("disallows editing published content without withdrawal", () => expect(mayManageAlert(["security_analyst"], "save", "published")).toBe(false));
  it("rejects personal contact details in public content", () => {
    expect(alertContentSchema.safeParse({ title: { en: "Contact victim@example.com", ar: "تنبيه تجريبي" }, category: "bank", explanation: { en: "Fictional warning", ar: "تحذير افتراضي" }, safety: { en: "Verify independently", ar: "تحقق بشكل مستقل" }, severity: "high" }).success).toBe(false);
  });
});