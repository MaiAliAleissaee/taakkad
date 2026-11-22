import { describe, expect, it } from "vitest";
import { staffAuthFailure } from "@/lib/security/auth-errors";

describe("staff authentication rejection classification", () => {
  it("distinguishes rejected credentials from permissions", () => expect(staffAuthFailure({ code: "invalid_credentials", status: 400 })).toBe("credentials"));
  it("identifies unconfirmed email", () => expect(staffAuthFailure({ code: "email_not_confirmed", status: 400 })).toBe("confirmation"));
  it("identifies throttling", () => expect(staffAuthFailure({ status: 429 })).toBe("rate_limit"));
  it("does not mislabel outages as wrong passwords", () => expect(staffAuthFailure({ status: 503 })).toBe("unavailable"));
});