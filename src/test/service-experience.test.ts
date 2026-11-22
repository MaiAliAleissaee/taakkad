import { describe, expect, it } from "vitest";
import { resolveLanguage } from "@/lib/i18n/preferences";
import { recognizeChannel, registryPresentation } from "@/lib/services/input-recognition";
import { createSeedState } from "./fixtures/security-seed";
import { assessMessage } from "@/lib/services/verification";
import { buildBlocklist } from "@/lib/services/blocklist";

describe("Language preference", () => {
  it("defaults new visitors to Arabic for the final bilingual demonstration", () => { expect(resolveLanguage(null)).toBe("ar"); });
  it("retains a saved English selection", () => { expect(resolveLanguage("en")).toBe("en"); });
  it("retains a saved Arabic selection", () => { expect(resolveLanguage("ar")).toBe("ar"); });
});

describe("Simple public input", () => {
  it.each([
    ["notices@alnoor.gov.example", "email"], ["+971 4 000 0200", "phone"],
    ["https://falconbank.example/branches", "website"], ["falconbank.example", "website"],
    ["@FalconNationalBank", "social"],
  ])("reliably recognizes %s as %s", (value, type) => { expect(recognizeChannel(value)).toBe(type); });
  it("leaves ambiguous SMS sender names for manual selection", () => { expect(recognizeChannel("FALCONBANK")).toBeUndefined(); });
  it.each(["verified", "unverified", "suspicious"] as const)("never authenticates an individual %s message from a registry check", (state) => {
    expect(registryPresentation(state).messageAuthenticated).toBe(false);
  });
  it("still identifies an approved active channel as a registry match", () => { expect(registryPresentation("verified").registeredChannel).toBe(true); });
  it("does not promote unknown channels to registered", () => { expect(registryPresentation("unverified").registeredChannel).toBe(false); });
});

describe("Preserved detection results", () => {
  it("keeps all twelve fictional message classifications unchanged", () => {
    const seed = createSeedState();
    const results = seed.messages.map(m => assessMessage({ channel: m.channel, sender: m.sender, url: m.url, body: `${m.subject?.en ?? ""} ${m.body.en}`, claimedOrgId: m.claimedOrgId }, { organizations: seed.organizations, blocklist: buildBlocklist(seed.alerts) }).state);
    expect(results).toEqual(["verified", "verified", "suspicious", "suspicious", "verified", "unverified", "unverified", "suspicious", "verified", "suspicious", "verified", "unverified"]);
  });
});