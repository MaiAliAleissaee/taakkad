import { describe, expect, it } from "vitest";
import { matchesPrototypeRegistry } from "@/lib/organizations/demo-schema";
import { assessMessage } from "@/lib/services/verification";

const approved = { name: { en: "Approved prototype", ar: "جهة تجريبية معتمدة" }, channels: [{ type: "sms", value: "PROTOTYPE", status: "simulated" }] };
describe("staff-approved prototype registry display isolation", () => {
  it("searches Arabic and English names and approved communication channels", () => {
    for (const query of ["جهة", "Approved", "prototype"]) expect(matchesPrototypeRegistry(approved, query, "all", "all")).toBe(true);
    expect(matchesPrototypeRegistry(approved, "different", "all", "all")).toBe(false);
  });
  it("uses the business type of the existing six-field registrations", () => {
    expect(matchesPrototypeRegistry(approved, "", "business", "all")).toBe(true);
    expect(matchesPrototypeRegistry(approved, "", "government", "all")).toBe(false);
    expect(matchesPrototypeRegistry(approved, "", "bank", "all")).toBe(false);
  });
  it("never displays prototype approvals in pending or suspended filters", () => {
    expect(matchesPrototypeRegistry(approved, "", "all", "verified")).toBe(true);
    for (const status of ["pending", "rejected", "suspended", "unapproved"]) expect(matchesPrototypeRegistry(approved, "", "all", status)).toBe(false);
  });
  it("does not rewrite simulated channels or grant genuine detection trust", () => {
    const before = structuredClone(approved);
    matchesPrototypeRegistry(approved, "", "all", "verified");
    expect(approved).toEqual(before);
    expect(approved.channels[0]?.status).toBe("simulated");
    expect(assessMessage({ channel: "sms", sender: "PROTOTYPE", body: "Monthly statement available." }, { organizations: [], blocklist: [] }).state).toBe("unverified");
  });
});