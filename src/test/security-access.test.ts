import { describe, expect, it } from "vitest";
import { canAccessSecurity } from "@/lib/security/access";
import { createSeedState as publicSeed } from "@/lib/data/seed";
import { createSeedState as privateSeed } from "./fixtures/security-seed";
import { snapshotSchema } from "@/lib/security/schema";
import { pendingSecurityMigration, completeSecurityMigration } from "@/lib/security/legacy";
import { repository } from "@/lib/data/local-store";

describe("Restricted Security Dashboard access", () => {
  it("allows Security Analysts", () => expect(canAccessSecurity(["security_analyst"])).toBe(true));
  it("allows Security Supervisors", () => expect(canAccessSecurity(["security_supervisor"])).toBe(true));
  it("denies Organization Verification Officers", () => expect(canAccessSecurity(["organization_verification_officer"])).toBe(false));
  it("denies Organization Administrators", () => expect(canAccessSecurity(["organization_administrator"])).toBe(false));
  it("denies Public Visitors", () => expect(canAccessSecurity(["public_visitor"])).toBe(false));
  it("denies visitors without roles", () => expect(canAccessSecurity([])).toBe(false));
  it("does not put cases, evidence or lookalikes in the public seed", () => {
    expect(publicSeed().alerts).toEqual([]); expect(publicSeed().lookalikes).toEqual([]);
  });
  it("retains all original private records through validation", () => {
    const seed = privateSeed();
    expect(snapshotSchema.parse({ alerts: seed.alerts, lookalikes: seed.lookalikes })).toEqual({ alerts: seed.alerts, lookalikes: seed.lookalikes });
  });
  it("blocks legacy browser methods from writing restricted cases", () => {
    expect(() => repository.updateAlert("al-1042", { status: "confirmed" })).toThrow("authenticated server");
  });
  it("retains browser records before acknowledgement and scrubs only private fields afterwards", () => {
    const seed = privateSeed();
    localStorage.setItem("trustzero.demo.v1", JSON.stringify(seed));
    const pending = pendingSecurityMigration();
    expect(pending?.snapshot.alerts).toEqual(seed.alerts);
    expect(JSON.parse(localStorage.getItem("trustzero.demo.v1") || "{}").alerts).toEqual(seed.alerts);
    completeSecurityMigration("11111111-1111-1111-1111-111111111111");
    const saved = JSON.parse(localStorage.getItem("trustzero.demo.v1") || "{}");
    expect(saved.alerts).toEqual([]); expect(saved.lookalikes).toEqual([]);
    expect(saved.organizations).toEqual(seed.organizations); expect(saved.messages).toEqual(seed.messages); expect(saved.channelAudit).toEqual(seed.channelAudit);
    localStorage.removeItem("trustzero.demo.v1"); localStorage.removeItem("trustzero.security.migration"); localStorage.removeItem("trustzero.security.workspace");
  });
});