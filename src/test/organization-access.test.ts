import { describe, expect, it } from "vitest";
import { canEditApplication, documentsSchema, editingRemaining, isVerificationOfficer, trackingCredentialsSchema } from "@/lib/organizations/schema";
const submitted = "2026-11-22T03:00:00.000Z";
describe("Organization application access rules", () => {
  it("requires a separate 256-bit tracking secret, never the reference alone", () => {
    const reference = "TZ-ORG-00000000-0000-4000-8000-000000000001";
    expect(trackingCredentialsSchema.safeParse({ reference }).success).toBe(false);
    expect(trackingCredentialsSchema.safeParse({ reference, secret: "a".repeat(64) }).success).toBe(true);
    expect(trackingCredentialsSchema.safeParse({ reference, secret: "a".repeat(32) }).success).toBe(false);
  });
  it("calculates the countdown from the original submission, with zero at 24 hours", () => {
    expect(editingRemaining(submitted, Date.parse("2026-11-22T04:00:00.000Z"))).toBe(23 * 3600000);
    expect(editingRemaining(submitted, Date.parse("2026-11-23T03:00:00.000Z"))).toBe(0);
  });
  it("allows the original owner to edit within 24 hours", () => {
    expect(canEditApplication("owner", "owner", submitted, "pending", Date.parse("2026-11-23T02:59:59.999Z"))).toBe(true);
  });
  it("blocks editing at the original 24-hour deadline", () => {
    expect(canEditApplication("owner", "owner", submitted, "pending", Date.parse("2026-11-23T03:00:00.000Z"))).toBe(false);
  });
  it("does not grant another applicant access within the window", () => {
    expect(canEditApplication("owner", "other", submitted, "pending", Date.parse("2026-11-22T04:00:00.000Z"))).toBe(false);
  });
  it("allows requested corrections after the original deadline", () => {
    expect(canEditApplication("owner", "owner", submitted, "needs_information", Date.parse("2026-11-25T04:00:00.000Z"))).toBe(true);
  });
  it("does not let another applicant use the correction exception", () => {
    expect(canEditApplication("owner", "other", submitted, "needs_information", Date.parse("2026-11-25T04:00:00.000Z"))).toBe(false);
  });
  it("requires the assigned verification officer role, not public or organization administrator roles", () => {
    expect(isVerificationOfficer(["organization_verification_officer"])).toBe(true);
    expect(isVerificationOfficer(["public_visitor", "organization_administrator", "security_supervisor"])).toBe(false);
  });
  it("does not reopen the original deadline after a correction has been submitted", () => {
    expect(canEditApplication("owner", "owner", submitted, "pending", Date.parse("2026-11-25T04:00:00.000Z"))).toBe(false);
  });
  it("limits private supporting documents to three files", () => {
    const document = { id: "00000000-0000-4000-8000-000000000001", name: "fictional.txt", type: "text/plain", content: "ZGVtbw==" };
    expect(documentsSchema.safeParse([document, document, document]).success).toBe(true);
    expect(documentsSchema.safeParse([document, document, document, document]).success).toBe(false);
  });
});