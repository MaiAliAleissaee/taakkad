import { describe, expect, it } from "vitest";
import { demoRegistrationSchema, demoTrackingSchema, demoPayload, demoStatus, demoDecisionReady } from "@/lib/organizations/demo-schema";

const input = { name: "شركة المرجان التجريبية", website: "https://coral-demo.example/path", email: "contact@coral-demo.example", social: "@CoralDemo", phone: "+971 50 000 0000", sms: "CORAL-DEMO" };
describe("six-field simulated organization registration", () => {
  it("accepts exactly six submitted fields without OTP or tracking secrets", () => {
    expect(demoRegistrationSchema.parse(input)).toEqual(input);
    expect(demoRegistrationSchema.safeParse({ ...input, trackingSecret: "abc" }).success).toBe(false);
  });
  it("supports an English organization name in the same form", () => {
    expect(demoRegistrationSchema.parse({ ...input, name: "Coral Demo Company" }).name).toBe("Coral Demo Company");
  });
  it("automatically extracts the domain from the official URL", () => {
    expect(demoPayload(input).domains).toEqual(["coral-demo.example"]);
  });
  it("creates the five submitted channels without granting verification", () => {
    const payload = demoPayload(input);
    expect(payload.status).toBe("pending");
    expect(payload.channels.map(c => [c.type, c.value, c.status])).toEqual([
      ["website", input.website, "pending"], ["email", input.email, "pending"], ["social", input.social, "pending"], ["phone", input.phone, "pending"], ["sms", input.sms, "pending"],
    ]);
  });
  it("requires only a five-digit tracking number", () => {
    expect(demoTrackingSchema.parse({ code: "12345" })).toEqual({ code: "12345" });
    for (const code of ["1234", "123456", "00001", "abcde"]) expect(demoTrackingSchema.safeParse({ code }).success).toBe(false);
  });
  it("maps every requested general status", () => {
    expect(demoStatus({ status: "pending" })).toBe("pending");
    expect(demoStatus({ status: "pending", demo_under_review: true })).toBe("under_review");
    expect(demoStatus({ status: "needs_information" })).toBe("needs_information");
    expect(demoStatus({ status: "approved" })).toBe("approved");
    expect(demoStatus({ status: "rejected" })).toBe("rejected");
  });
  it("requires a private audit note, not individual domain confirmations", () => {
    expect(demoDecisionReady("Simulated review completed")).toBe(true);
    expect(demoDecisionReady(" ")).toBe(false);
  });
  it("rejects unsafe website schemes and non-fictional domains", () => {
    for (const website of ["javascript:alert(1)", "https://real-bank.com", "https://user:pass@demo.example"]) expect(demoRegistrationSchema.safeParse({ ...input, website }).success).toBe(false);
  });
});