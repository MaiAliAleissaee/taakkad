import { describe, expect, it, vi } from "vitest";
import { groundedIndicators, minimizeAiInput, redactAiText } from "@/lib/services/ai-privacy";
import { combinedRiskScore, overallRisk } from "@/lib/services/hybrid-analysis";
import { aiFindingsSchema } from "@/lib/services/ai-schema";
import { assessMessage } from "@/lib/services/verification";
import { createSeedState } from "./fixtures/security-seed";
import { buildInvestigation, indicatorKey } from "@/lib/services/investigation";
import { correlateIndicators } from "@/lib/services/ai-correlation";
import { indicatorsFor } from "@/lib/services/reporting";

describe("AI privacy and hybrid rules", () => {
  it.each([["low", 0], ["medium", 40], ["high", 65], ["critical", 90]] as const)("maps %s AI severity to ordinal score %s without changing registry facts", (risk, score) => {
    const assessment = { state: "verified" as const, riskScore: 0, reasons: [] };
    expect(combinedRiskScore(assessment, { status: "performed", model: "openai/gpt-6.1-sol", findings: { risk, explanation: { en: "Review", ar: "مراجعة" }, warningSigns: [], indicators: [], safeActions: [{ en: "Verify independently", ar: "تحقق بشكل مستقل" }] } })).toBe(score);
    expect(assessment.state).toBe("verified");
  });
  it("bounds the combined score to 0–100", () => {
    expect(combinedRiskScore({ state: "unverified", riskScore: 150, reasons: [] }, null)).toBe(100);
    expect(combinedRiskScore({ state: "unverified", riskScore: -10, reasons: [] }, null)).toBe(0);
  });
  it("retains the deterministic score when AI is unavailable", () => {
    expect(combinedRiskScore({ state: "suspicious", riskScore: 80, reasons: [] }, { status: "unavailable", reason: "service" })).toBe(80);
  });
  it("does not lower deterministic evidence when AI reports low risk", () => {
    expect(combinedRiskScore({ state: "suspicious", riskScore: 90, reasons: [] }, { status: "performed", model: "openai/gpt-6.1-sol", findings: { risk: "low", explanation: { en: "Few signs", ar: "مؤشرات قليلة" }, warningSigns: [], indicators: [], safeActions: [{ en: "Verify", ar: "تحقق" }] } })).toBe(90);
  });
  it("sets a flagged-indicator floor without promoting a channel to verified", () => {
    const assessment = { state: "unverified" as const, riskScore: 5, reasons: [] };
    expect(combinedRiskScore(assessment, null, true)).toBe(65);
    expect(assessment.state).toBe("unverified");
  });
  it("does not send passwords, OTPs or identity numbers to inference", () => {
    const output = redactAiText("password: Hunter2 OTP: 123456 رمز التحقق: 654321 ID 784-1990-1234567-1");
    for (const secret of ["Hunter2", "123456", "654321", "784-1990-1234567-1"]) expect(output).not.toContain(secret);
  });
  it("strips URL secrets and excludes claimed organization metadata", () => {
    const output = minimizeAiInput({ channel: "email", sender: "fraud@example.test", url: "https://user:secret@bad.example/pay?otp=123456#private", body: "Hello", claimedOrgId: "private-id" });
    expect(output.url).toBe("https://bad.example/pay"); expect(output).not.toHaveProperty("claimedOrgId");
  });
  it("never lets AI mark a suspicious registered-sender message as safe", () => {
    const seed = createSeedState();
    const assessment = assessMessage({ channel: "sms", sender: "FALCONBANK", body: "Hello" }, { organizations: seed.organizations, blocklist: [] });
    expect(assessment.state).toBe("verified");
    expect(overallRisk(assessment, { status: "performed", model: "openai/gpt-6.1-sol", findings: { risk: "critical", explanation: { en: "Sensitive request", ar: "طلب حساس" }, warningSigns: [], indicators: [], safeActions: [{ en: "Contact the bank", ar: "اتصل بالبنك" }] } })).toBe("critical");
    expect(assessment.state).toBe("verified");
  });
  it("retains deterministic warning risk when AI is unavailable", () => {
    const seed = createSeedState();
    const result = assessMessage({ channel: "sms", sender: "", body: "", url: "https://fa1conbank.example" }, { organizations: seed.organizations, blocklist: [] });
    expect(overallRisk(result, { status: "unavailable", reason: "service" })).toBe("high");
  });
  it("rejects invented indicators and deduplicates actual IP matches", () => {
    expect(groundedIndicators([{ type: "ip", value: "203.0.113.45" }, { type: "ip", value: "203.0.113.45" }, { type: "domain", value: "invented.example" }], { channel: "other", sender: "", body: "Server 203.0.113.45" })).toEqual([{ type: "ip", value: "203.0.113.45" }]);
  });
  it("correlates shared IP only with actual type-aware existing case indicators", () => {
    const index = buildInvestigation(createSeedState().alerts);
    const match = index.indicators.find(indicator => indicator.id === indicatorKey("ip", "203.0.113.45"));
    expect(match?.cases.map(item => item.caseId).sort()).toEqual(["TZ-1042", "TZ-1043"]);
    expect(index.indicators.find(indicator => indicator.id === indicatorKey("phone", "203.0.113.45"))).toBeUndefined();
    expect(correlateIndicators(createSeedState().alerts, [{ type: "ip", value: "203.0.113.45" }])[0]?.cases.map(item => item.caseId).sort()).toEqual(["TZ-1042", "TZ-1043"]);
    expect(correlateIndicators(createSeedState().alerts, [{ type: "ip", value: "203.0.113.45" }])[0]?.requiresHumanReview).toBe(true);
  });
  it("does not mistake a suffix within another host for an extracted exact domain", () => {
    expect(groundedIndicators([{ type: "domain", value: "bank.example" }], { channel: "other", sender: "", body: "https://evil-bank.example" })).toEqual([]);
  });
  it("retains extracted indicators in explicit reports for existing graph correlation", () => {
    expect(indicatorsFor({ channel: "other", sender: "", body: "Contact 203.0.113.45", aiIndicators: [{ type: "ip", value: "203.0.113.45" }] })).toEqual([{ type: "ip", value: "203.0.113.45" }]);
  });
  it("raises overall risk for an actual flagged indicator without changing channel status", () => {
    expect(overallRisk({ state: "verified", riskScore: 5, reasons: [] }, null, true)).toBe("high");
  });
  it("rejects invented case records in a model response", () => {
    expect(aiFindingsSchema.safeParse({ risk: "low", explanation: { en: "Hello", ar: "مرحبا" }, warningSigns: [], indicators: [], safeActions: [{ en: "Stay cautious", ar: "كن حذراً" }], confirmedCaseId: "TZ-9999" }).success).toBe(false);
  });
});

vi.mock("@lovable.dev/ai-gateway", () => ({ generateResponse: vi.fn().mockRejectedValue(new Error("Service unavailable")), GatewayError: class extends Error {} }));
it("real service failure returns an explicit fallback rather than invented AI findings", async () => {
  const { inferFraud } = await import("@/lib/services/ai-analysis.server");
  expect(await inferFraud({ channel: "other", sender: "", body: "Hello" })).toEqual({ status: "unavailable", reason: "service" });
});