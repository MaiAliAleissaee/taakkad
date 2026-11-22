import { describe, expect, it } from "vitest";
import { createSeedState } from "./fixtures/security-seed";
import type { ChannelType, DemoActor, DemoState } from "@/lib/domain/types";
import { applyChannelCommand, applyOrganizationReview, upgradeChannelRegistry, type ChannelCommand } from "@/lib/services/channels";
import { assessMessage } from "@/lib/services/verification";
import { repository } from "@/lib/data/local-store";

const admin: DemoActor = { role: "org_admin", orgId: "org-falcon" };
const verifier: DemoActor = { role: "verifier" };
const at = "2026-11-21T19:25:00Z";
const command = (state: DemoState, action: ChannelCommand["action"], actor: DemoActor = admin, extra: Partial<ChannelCommand> = {}) =>
  applyChannelCommand(state, actor, { action, orgId: "org-falcon", channelId: "test-channel", ...extra }, at, `event-${action}`);
const assess = (state: DemoState, channel: ChannelType, sender: string, url?: string) =>
  assessMessage({ channel, sender, body: "", ...(url ? { url } : {}) }, { organizations: state.organizations, blocklist: [] }).state;
const newChannel = (type: ChannelType = "sms", value = "FALCON-DEMO") => command(createSeedState(), "add", admin, { type, value });
const approved = (type: ChannelType = "sms", value = "FALCON-DEMO") =>
  command(command(newChannel(type, value), "submit"), "approve", verifier, { note: "Fictional independent evidence reviewed; simulation only." });

describe("Official channel workflow", () => {
  it("starts new channels Pending Verification, without submission or public approval", () => {
    const state = newChannel();
    const channel = state.organizations.find((o) => o.id === "org-falcon")?.channels.find((c) => c.id === "test-channel");
    expect(channel?.status).toBe("pending"); expect(channel?.submittedAt).toBeUndefined();
    expect(assess(state, "sms", "FALCON-DEMO")).toBe("unverified");
  });
  it("keeps administrator-submitted channels pending until independent review", () => {
    const state = command(newChannel(), "submit");
    expect(state.organizations.find((o) => o.id === "org-falcon")?.channels.find((c) => c.id === "test-channel")?.submittedAt).toBe(at);
    expect(assess(state, "sms", "FALCON-DEMO")).toBe("unverified");
  });
  it("denies requests by public viewers", () => {
    expect(() => command(createSeedState(), "add", { role: "viewer" }, { type: "sms", value: "FALCON-DEMO" })).toThrow("forbidden");
  });
  it("denies requests by administrators of another organization", () => {
    expect(() => command(createSeedState(), "add", { role: "org_admin", orgId: "org-saqr" }, { type: "sms", value: "FALCON-DEMO" })).toThrow("forbidden");
  });
  it("denies channel changes for unverified organizations", () => {
    expect(() => command(createSeedState(), "add", { role: "org_admin", orgId: "org-pearl" }, { orgId: "org-pearl", type: "sms", value: "PEARL-DEMO" })).toThrow("forbidden");
  });
  it("prevents organization administrators from approving their channels", () => {
    expect(() => command(command(newChannel(), "submit"), "approve", admin, { note: "Self-certified" })).toThrow("forbidden");
  });
  it("requires administrator submission before verifier approval", () => {
    expect(() => command(newChannel(), "approve", verifier, { note: "Reviewed" })).toThrow("not_submitted");
  });
  it("requires a simulated evidence note before approval", () => {
    expect(() => command(command(newChannel(), "submit"), "approve", verifier)).toThrow("review_note_required");
  });
  it.each<[ChannelType, string]>([
    ["phone", "+971 4 000 0990"], ["sms", "FALCON-DEMO"], ["email", "demo@falconbank.example"],
    ["website", "demo.falconbank.example"], ["social", "@FalconDemo"], ["other", "falcon-app.example"],
  ])("approves and revokes %s channels through public registry checks", (type, value) => {
    const pending = newChannel(type, value);
    expect(assess(pending, type, value)).toBe("unverified");
    const state = approved(type, value);
    expect(assess(state, type, value)).toBe("verified");
    const revoked = command(state, "revoke", verifier);
    expect(assess(revoked, type, value)).toBe("unverified");
    expect(revoked.channelAudit?.filter((e) => e.channelId === "test-channel").map((e) => e.action)).toEqual(["add", "submit", "approve", "revoke"]);
  });
  it("editing a verified email withdraws both the old and pending new matches", () => {
    const state = command(approved("email", "demo@falconbank.example"), "edit", admin, { type: "email", value: "changed@falconbank.example" });
    expect(assess(state, "email", "demo@falconbank.example")).toBe("unverified");
    expect(assess(state, "email", "changed@falconbank.example")).toBe("unverified");
    expect(state.channelAudit?.at(-1)?.previousValue).toBe("demo@falconbank.example");
  });
  it("deactivation immediately excludes a verified channel", () => {
    expect(assess(command(approved(), "deactivate"), "sms", "FALCON-DEMO")).toBe("unverified");
  });
  it("removal immediately excludes a channel and preserves audit history", () => {
    const state = command(approved(), "remove");
    expect(state.organizations.find((o) => o.id === "org-falcon")?.channels.some((c) => c.id === "test-channel")).toBe(false);
    expect(assess(state, "sms", "FALCON-DEMO")).toBe("unverified");
    expect(state.channelAudit?.filter((e) => e.channelId === "test-channel")).toHaveLength(4);
  });
  it("rejected requests never become public verified matches", () => {
    const state = command(command(newChannel(), "submit"), "reject", verifier, { note: "Fictional ownership evidence incomplete." });
    expect(assess(state, "sms", "FALCON-DEMO")).toBe("unverified");
  });
  it("revoked root domains cannot bypass channel checks through organization domains", () => {
    const state = command(createSeedState(), "revoke", verifier, { channelId: "ch-fb-5" });
    expect(assess(state, "website", "https://falconbank.example")).toBe("unverified");
    expect(assess(state, "email", "alerts@falconbank.example", "https://falconbank.example/login")).toBe("unverified");
    expect(assess(state, "email", "unknown@falconbank.example")).toBe("unverified");
  });
  it("rejects duplicate channel values after normalization", () => {
    expect(() => command(createSeedState(), "add", admin, { type: "phone", value: "+97140000200" })).toThrow("duplicate");
  });
  it("preserves saved cases and notes when upgrading legacy browser data", () => {
    const seed = createSeedState();
    const legacy = { ...seed, organizations: seed.organizations.map((o) => ({ ...o, channels: o.channels.map((c) => ({ id: c.id, type: c.type, value: c.value })) })) };
    const upgraded = upgradeChannelRegistry(legacy);
    expect(upgraded.alerts).toEqual(seed.alerts);
    expect(upgraded.messages).toEqual(seed.messages);
    expect(upgradeChannelRegistry(upgraded)).toEqual(upgraded);
  });
  it("prevents organization self-certification and leaves channels pending after independent organization approval", () => {
    const state = createSeedState();
    expect(() => applyOrganizationReview(state, { role: "org_admin", orgId: "org-pearl" }, "org-pearl", "verified", at, "review")).toThrow("forbidden");
    const reviewed = applyOrganizationReview(state, verifier, "org-pearl", "verified", at, "review");
    expect(reviewed.organizations.find((o) => o.id === "org-pearl")?.status).toBe("verified");
    expect(assess(reviewed, "email", "billing@pearlcoast-utilities.example")).toBe("unverified");
  });
  it("forces new registrations to pending even when submitted with verified fields", () => {
    repository.reset();
    const org = createSeedState().organizations[0];
    if (!org) throw new Error("Missing fixture");
    repository.addOrganization({ ...org, id: "new-org" });
    const registered = repository.getState().organizations.find((o) => o.id === "new-org");
    expect(registered?.status).toBe("pending");
    expect(registered?.verifiedAt).toBeUndefined();
    expect(registered?.channels.map((c) => c.status)).toEqual(Array(org.channels.length).fill("pending"));
    expect(repository.getState().channelAudit?.filter((e) => e.orgId === "new-org").map((e) => e.actor)).toEqual(Array(org.channels.length).fill("registration_request"));
    repository.reset();
  });
});