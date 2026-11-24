import { describe, expect, it } from "vitest";
import { lookalikeIdentityLeads, type IdentityCandidate } from "@/lib/organizations/identity-matches";
const registered: IdentityCandidate = { id: "known", organizationId: "known", name: { en: "UAE PASS fixture", ar: "عينة" }, domains: ["uaepass.ae"], status: "approved" };
const applicant = { ...registered, id: "new", organizationId: "new", status: "pending" };
describe("maintained domain lookalike rules for private officer leads", () => {
  it("reuses the existing detector for suffix swaps", () => {
    const leads = lookalikeIdentityLeads({ ...applicant, domains: ["uaepass.com"] }, [registered], []);
    expect(leads[0]?.match).toBe("approximate"); expect(leads[0]?.severity).toBe("medium"); expect(leads[0]?.matchedValue).toBe("uaepass.ae");
  });
  it("keeps exact communication safeguards rather than downgrading them", () => {
    const exact = { organizationId: "known", name: registered.name, indicator: "domain", value: "uaepass.ae", matchedValue: "uaepass.ae", match: "exact" as const, severity: "high" as const, reason: "domain_overlap" as const, provenance: "application" as const };
    expect(lookalikeIdentityLeads(applicant, [registered], [exact])).toEqual([exact]);
  });
  it("deduplicates supplemental domain leads", () => {
    expect(lookalikeIdentityLeads({ ...applicant, domains: ["uaepass.com", "uaepass.com"] }, [registered, registered], []).length).toBe(1);
  });
  it("does not generate leads against itself or rejected records", () => {
    expect(lookalikeIdentityLeads(applicant, [applicant, { ...registered, status: "rejected" }], [])).toEqual([]);
  });
});