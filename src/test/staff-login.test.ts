import { describe, expect, it } from "vitest";
import { passwordSetupSchema, staffIdentifierSchema, staffLoginSchema } from "@/lib/security/staff-login-schema";
import { canAccessSecurity } from "@/lib/security/access";

describe("approved staff login rules", () => {
  it("accepts HAM123 as the staff identifier", () => expect(staffLoginSchema.parse({ identifier: "ham123", password: "owner-password" }).identifier).toBe("HAM123"));
  it("preserves existing email sign-in", () => expect(staffIdentifierSchema.parse("staff@example.com")).toBe("staff@example.com"));
  it("rejects invalid identifiers", () => expect(staffIdentifierSchema.safeParse("HAM 123").success).toBe(false));
  it("requires a nonempty password", () => expect(staffLoginSchema.safeParse({ identifier: "HAM123", password: "" }).success).toBe(false));
  it("analyst approval grants security access alongside preserved visitor role", () => expect(canAccessSecurity(["public_visitor", "security_analyst"])).toBe(true));
  it("an identifier alone never authorizes access", () => expect(canAccessSecurity(["HAM123", "public_visitor"])).toBe(false));
  it("requires matching privately chosen passwords", () => expect(passwordSetupSchema.safeParse({ password: "long-private-password", confirmation: "different-password" }).success).toBe(false));
  it("rejects setup passwords shorter than twelve characters", () => expect(passwordSetupSchema.safeParse({ password: "12345678901", confirmation: "12345678901" }).success).toBe(false));
});