import { describe, expect, it } from "vitest";
import { canEditApplication, isVerificationOfficer } from "@/lib/organizations/schema";
const submitted = "2026-11-22T03:00:00.000Z";
describe("Organization application access rules", () => {
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
});