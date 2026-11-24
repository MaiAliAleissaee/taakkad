import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { createSeedState } from "@/lib/data/seed";
import { publicOrganizations } from "@/lib/data/public-registry";
import { repository, usePublicOrganizations } from "@/lib/data/local-store";
import { assessMessage } from "@/lib/services/verification";

describe("independent public trust projection", () => {
  it("never falls back to the seven preserved fictional organizations", () => {
    repository.reset();
    expect(repository.getState().organizations).toHaveLength(7);
    const { result } = renderHook(() => usePublicOrganizations());
    expect(result.current).toEqual([]);
    expect(assessMessage({ channel: "sms", sender: "FALCONBANK", body: "Monthly statement available." }, { organizations: result.current, blocklist: [] }).state).toBe("unverified");
  });
  it("keeps pending, revoked and inactive channels out of genuine projection", () => {
    const org = createSeedState().organizations[0];
    if (!org) throw new Error("Missing fixture");
    const rows = publicOrganizations([{ ...org, channels: [
      { id: "a", type: "sms", value: "ACTIVE", status: "verified" },
      { id: "b", type: "sms", value: "PENDING", status: "pending" },
      { id: "c", type: "sms", value: "REVOKED", status: "revoked" },
      { id: "d", type: "sms", value: "INACTIVE", status: "inactive" },
    ] }]);
    expect(rows[0]?.channels.map(c => c.value)).toEqual(["ACTIVE"]);
    expect(rows[0]?.contactEmail).toBe("");
  });
  it("excludes unapproved and suspended identities without mutating their records", () => {
    const seed = createSeedState();
    const before = structuredClone(seed.organizations);
    expect(publicOrganizations(seed.organizations).map(o => o.id)).not.toContain("org-pearl");
    expect(publicOrganizations(seed.organizations).map(o => o.id)).not.toContain("org-meridian");
    expect(seed.organizations).toEqual(before);
  });
  it("analyzes a previously unseen input without reading demonstration examples", () => {
    const random = globalThis.crypto.randomUUID();
    const input = { channel: "website" as const, sender: "", url: `https://u.ae.${random}.example/login`, body: "" };
    const context = { organizations: [], blocklist: [] };
    expect(assessMessage(input, context).state).toBe("suspicious");
  });
});