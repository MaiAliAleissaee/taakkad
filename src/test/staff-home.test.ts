import { describe, expect, it } from "vitest";
import { staffHome } from "@/lib/security/staff-home";

describe("post-login staff destination", () => {
  it("sends an Analyst + Officer account to organization review first", () => expect(staffHome(["public_visitor", "security_analyst", "organization_verification_officer"])).toBe("/organizations"));
  it("sends an Analyst-only account to the Security Dashboard", () => expect(staffHome(["security_analyst"])).toBe("/security"));
  it("gives a public visitor no staff destination", () => expect(staffHome(["public_visitor"])).toBeNull());
});
