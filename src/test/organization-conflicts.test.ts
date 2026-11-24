import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { relationshipKinds, relationshipSchema, emptyRelationship, conflictReviewSchema, requiresConflictDecision, type IdentityConflict } from "@/lib/organizations/relationship";
import { collectIdentityMetadata, readIdentityConflicts } from "@/lib/organizations/conflicts.server";
import { demoPayload, demoRegistrationSchema } from "@/lib/organizations/demo-schema";
import { pendingOrganization, validateApplication } from "@/lib/organizations/applications.server";
import type { Observation } from "@/lib/intelligence/schema";

vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: vi.fn() }));
const id = "00000000-0000-4000-8000-000000000012";
const registration = { name: "Fictional Test", website: "https://test.example", email: "test@test.example", phone: "0501234567", social: "@test", sms: "TEST" };
const conflict: IdentityConflict = { organizationId: "existing", name: { en: "Existing", ar: "قائمة" }, indicator: "phone", value: "+971501234567", matchedValue: "+971501234567", match: "exact", severity: "high", reason: "channel_overlap", provenance: "application" };
const observation: Observation = { checkedAt: "2026-11-24T17:00:00.000Z", dns: "resolved", dnsSource: "https://dns.google/resolve", records: [], addresses: ["192.0.2.1"], dnssecValidated: false, nonPublicAnswers: false, asns: [], networkSource: null, registration: "unavailable", rdapSource: null, registeredAt: null, ageDays: null };
function client(result: unknown) { return { rpc: vi.fn().mockResolvedValue(result), from: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ error: null, data: [] }) }) } as unknown as SupabaseClient<Database>; }

describe("private relationship declarations", () => {
  it("preserves the six core fields for older clients", () => expect(demoRegistrationSchema.parse(registration)).toEqual(registration));
  it.each(relationshipKinds.filter(k => k !== "none"))("accepts explained %s relationships", kind => {
    expect(relationshipSchema.parse({ kind, organization: "Fictional Group", explanation: "Fictional corporate relationship", evidence: "Unverified test assertion" }).kind).toBe(kind);
  });
  it("rejects a declared relationship without a related organization", () => expect(relationshipSchema.safeParse({ ...emptyRelationship, kind: "parent", explanation: "Explained relationship" }).success).toBe(false));
  it("rejects a relationship without a supporting explanation", () => expect(relationshipSchema.safeParse({ ...emptyRelationship, kind: "subsidiary", organization: "Group" }).success).toBe(false));
  it("does not accept applicant-supplied verification flags", () => expect(relationshipSchema.safeParse({ ...emptyRelationship, verified: true }).success).toBe(false));
  it("keeps declared relationships pending rather than clearing trust", () => {
    const p = demoPayload({ ...registration, relationship: { ...emptyRelationship, kind: "parent", organization: "Group", explanation: "Fictional parent relationship" } });
    expect(p.status).toBe("pending"); expect(p.channels.every(c => c.status === "pending")).toBe(true); expect(p.relationshipDeclaration?.kind).toBe("parent");
  });
  it("preserves protected declarations in the legacy submission envelope", () => {
    const p = pendingOrganization({ nameEn: "Test Org", nameAr: "جهة", type: "business", domains: ["test.example"], contactEmail: "a@test.example", channels: [{ type: "email", value: "a@test.example" }], relationship: emptyRelationship });
    expect(p.relationshipDeclaration).toEqual(emptyRelationship); expect(p.status).toBe("pending");
  });
  it("accepts syntactically valid identities for manual conflict review", async () => {
    await expect(validateApplication({ nameEn: "Test Org", nameAr: "جهة", type: "business", domains: ["test.example"], contactEmail: "a@test.example", channels: [{ type: "email", value: "a@test.example" }] })).resolves.toBeUndefined();
  });
  it("retains legacy channel-domain restrictions", async () => {
    await expect(validateApplication({ nameEn: "Test Org", nameAr: "جهة", type: "business", domains: ["test.example"], contactEmail: "a@test.example", channels: [{ type: "email", value: "a@outside.example" }] })).rejects.toThrow();
  });
});
describe("documented conflict review policy", () => {
  const review = { id, revision: 2, note: "Reviewed relationship and missing evidence", explanationReviewed: true, evidenceReviewed: true };
  it("exact channel conflicts require enhanced review", () => expect(requiresConflictDecision([conflict])).toBe(true));
  it("shared hosting alone never triggers high-risk approval blocking", () => expect(requiresConflictDecision([{ ...conflict, indicator: "ip", severity: "low", reason: "shared_infrastructure", provenance: "technical_snapshot" }])).toBe(false));
  it("similar names are review leads, not automatic rejection", () => expect(requiresConflictDecision([{ ...conflict, indicator: "name", match: "approximate", severity: "medium", reason: "similar_identity" }])).toBe(false));
  it("requires a documented explanation of at least 20 characters", () => expect(conflictReviewSchema.safeParse({ ...review, note: "short" }).success).toBe(false));
  it("requires human review of the declaration", () => expect(conflictReviewSchema.safeParse({ ...review, explanationReviewed: false }).success).toBe(false));
  it("requires human review of available or missing evidence", () => expect(conflictReviewSchema.safeParse({ ...review, evidenceReviewed: false }).success).toBe(false));
  it("does not permit a client to assert that conflicts are cleared", () => expect(conflictReviewSchema.safeParse({ ...review, resolved: true }).success).toBe(false));
  it("accepts a complete documented officer decision", () => expect(conflictReviewSchema.parse(review).revision).toBe(2));
});
describe("server conflict access and bounded technical observations", () => {
  it("fails closed on unauthorized conflict reads", async () => await expect(readIdentityConflicts(client({ error: { message: "Officer required" }, data: null }), id)).rejects.toThrow("conflict_access_denied"));
  it("retains undeclared legacy relationships as unknown, not no relationship", async () => {
    const result = await readIdentityConflicts(client({ error: null, data: { conflicts: [conflict], relationship: {}, technical: [], review: {}, resolved: null, revision: 0 } }), id);
    expect(result.relationship).toBeNull(); expect(result.resolved).toBe(false); expect(result.conflicts[0]?.severity).toBe("high");
  });
  it("never fabricates cleared conflicts from malformed results", async () => await expect(readIdentityConflicts(client({ error: null, data: { conflicts: [], relationship: {}, resolved: true } }), id)).rejects.toThrow());
  it("does not scan synthetic, private-IP or malformed domains", async () => {
    const verify = vi.fn().mockResolvedValue(observation);
    const result = await collectIdentityMetadata(["uaepass-demo.example", "127.0.0.1", "https://example.com/path"], verify);
    expect(verify).not.toHaveBeenCalled(); expect(result.every(s => s.observation === null && s.unavailable === "ineligible_domain")).toBe(true);
  });
  it("limits metadata to three distinct eligible domains", async () => {
    const verify = vi.fn().mockResolvedValue(observation);
    const result = await collectIdentityMetadata(["example.com", "example.com", "example.org", "example.net", "example.edu"], verify);
    expect(verify).toHaveBeenCalledTimes(3); expect(result.map(s => s.domain)).toEqual(["example.com", "example.org", "example.net"]);
  });
  it("records unavailable metadata rather than inventing an address", async () => {
    const verify = vi.fn().mockRejectedValue(new Error("timeout"));
    const result = await collectIdentityMetadata(["example.com"], verify);
    expect(result).toEqual([{ domain: "example.com", observation: null, unavailable: "metadata_unavailable" }]);
  });
});