import { describe, expect, it } from "vitest";
import { directPasswordSetupSchema, passwordSetupSchema, setupTokenSchema, staffIdentifierSchema, staffLoginSchema } from "@/lib/security/staff-login-schema";
import { canAccessSecurity } from "@/lib/security/access";
import { isVerificationOfficer } from "@/lib/organizations/schema";

describe("approved staff login rules", () => {
  it("accepts HAM123 as the staff identifier", () => expect(staffLoginSchema.parse({ identifier: "ham123", password: "owner-password" }).identifier).toBe("HAM123"));
  it("preserves existing email sign-in", () => expect(staffIdentifierSchema.parse("staff@example.com")).toBe("staff@example.com"));
  it("rejects invalid identifiers", () => expect(staffIdentifierSchema.safeParse("HAM 123").success).toBe(false));
  it("requires a nonempty password", () => expect(staffLoginSchema.safeParse({ identifier: "HAM123", password: "" }).success).toBe(false));
  it("analyst approval grants security access alongside preserved visitor role", () => expect(canAccessSecurity(["public_visitor", "security_analyst"])).toBe(true));
  it("an identifier alone never authorizes access", () => expect(canAccessSecurity(["HAM123", "public_visitor"])).toBe(false));
  it("preserves Analyst access when Officer is added", () => expect(canAccessSecurity(["public_visitor", "security_analyst", "organization_verification_officer"])).toBe(true));
  it("the same dual-role account can review organizations", () => expect(isVerificationOfficer(["public_visitor", "security_analyst", "organization_verification_officer"])).toBe(true));
  it("Analyst alone cannot approve organizations", () => expect(isVerificationOfficer(["security_analyst"])).toBe(false));
  it("requires matching privately chosen passwords", () => expect(passwordSetupSchema.safeParse({ password: "long-private-password", confirmation: "different-password" }).success).toBe(false));
  it("rejects setup passwords shorter than twelve characters", () => expect(passwordSetupSchema.safeParse({ password: "12345678901", confirmation: "12345678901" }).success).toBe(false));
});
describe("single-use staff setup links", () => {
  it("accepts a 256-bit link secret", () => expect(setupTokenSchema.safeParse("A".repeat(43)).success).toBe(true));
  it("rejects short or malformed link secrets", () => expect(setupTokenSchema.safeParse("short-token").success).toBe(false));
  it("requires twelve-character matching passwords", () => expect(directPasswordSetupSchema.safeParse({ token: "A".repeat(43), password: "12345678901", confirmation: "12345678901" }).success).toBe(false));
  it("rejects mismatched confirmation", () => expect(directPasswordSetupSchema.safeParse({ token: "A".repeat(43), password: "long-private-password", confirmation: "long-private-passwordX" }).success).toBe(false));
});
