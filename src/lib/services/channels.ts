import type { Channel, ChannelAction, ChannelAuditEvent, ChannelType, DemoActor, DemoState, Organization } from "@/lib/domain/types";
import { hostFromUrl, normalizeHost } from "./lookalike";

export const CHANNEL_TYPES: ChannelType[] = ["phone", "sms", "email", "website", "social", "other"];
export const activeChannel = (c: Channel) => c.status === "verified";
export function channelKey(type: ChannelType, value: string): string {
  if (type === "website") return hostFromUrl(value) ?? normalizeHost(value);
  if (type === "phone") return value.replace(/[\s().-]/g, "");
  return value.trim().toLowerCase().replace(/\s+/g, "");
}
export const canManageChannels = (actor: DemoActor, org: Organization) =>
  actor.role === "org_admin" && actor.orgId === org.id && org.status === "verified";

/** Upgrade only legacy records, retaining every case, note and judge's saved edit. */
export function upgradeChannelRegistry(state: DemoState): DemoState {
  const events = [...(state.channelAudit ?? [])];
  const organizations = state.organizations.map((org) => {
    const legacy = org.channels.some((c) => c.status === undefined);
    const channels = org.channels.map((c): Channel => {
      if (c.status) return c;
      const channel: Channel = { ...c, status: org.verifiedAt ? "verified" : "pending", addedAt: org.registeredAt };
      events.push({ id: `seed-${c.id}`, orgId: org.id, channelId: c.id, action: "seed", actor: "demo_seed", at: org.verifiedAt ?? org.registeredAt, type: c.type, value: c.value, status: channel.status ?? "pending", note: "Fictional legacy demo record; no external verification." });
      return channel;
    });
    // Old domain-level checks implicitly covered these root domains. Make them explicit.
    if (legacy) org.domains.forEach((domain, index) => {
      if (channels.some((c) => c.type === "website" && channelKey(c.type, c.value) === normalizeHost(domain))) return;
      const c: Channel = { id: `ch-domain-${org.id}-${index}`, type: "website", value: domain, status: org.verifiedAt ? "verified" : "pending", addedAt: org.registeredAt };
      channels.push(c);
      events.push({ id: `seed-${c.id}`, orgId: org.id, channelId: c.id, action: "seed", actor: "demo_seed", at: org.verifiedAt ?? org.registeredAt, type: c.type, value: c.value, status: c.status ?? "pending", note: "Fictional legacy domain record; no DNS verification." });
    });
    return { ...org, channels };
  });
  return { ...state, organizations, channelAudit: events };
}

export type ChannelError = "forbidden" | "not_found" | "invalid" | "duplicate" | "not_submitted" | "invalid_transition" | "review_note_required";
export class ChannelWorkflowError extends Error {
  constructor(public code: ChannelError) { super(code); }
}
export interface ChannelCommand {
  action: ChannelAction;
  orgId: string;
  channelId: string;
  type?: ChannelType;
  value?: string;
  note?: string;
}

export function applyOrganizationReview(state: DemoState, actor: DemoActor, id: string, status: Organization["status"] | "remove", at: string, eventId: string): DemoState {
  if (actor.role !== "verifier") throw new ChannelWorkflowError("forbidden");
  const org = state.organizations.find((o) => o.id === id);
  if (!org) throw new ChannelWorkflowError("not_found");
  const event: ChannelAuditEvent = { id: eventId, orgId: id, channelId: id, action: status === "remove" ? "organization_removed" : status === "verified" ? "organization_verified" : "organization_suspended", actor: "independent_demo_verifier", at, type: "other", value: org.name.en, status: "pending", note: "Simulated independent organization review; no real identity or domain-ownership verification. Channel approval remains separate." };
  return { ...state, organizations: status === "remove" ? state.organizations.filter((o) => o.id !== id) : state.organizations.map((o) => o.id === id ? { ...o, status, ...(status === "verified" ? { verifiedAt: at } : {}) } : o), channelAudit: [...(state.channelAudit ?? []), event] };
}

/** Simulation policy only. Production must replace this with authenticated server authorization. */
export function applyChannelCommand(state: DemoState, actor: DemoActor, cmd: ChannelCommand, at: string, eventId: string): DemoState {
  const org = state.organizations.find((o) => o.id === cmd.orgId);
  if (!org) throw new ChannelWorkflowError("not_found");
  const review = ["approve", "reject", "revoke"].includes(cmd.action);
  if (review ? actor.role !== "verifier" : !canManageChannels(actor, org)) throw new ChannelWorkflowError("forbidden");
  if (cmd.action === "approve" && org.status !== "verified") throw new ChannelWorkflowError("forbidden");
  const old = org.channels.find((c) => c.id === cmd.channelId);
  if (cmd.action !== "add" && !old) throw new ChannelWorkflowError("not_found");
  let next: Channel;
  if (cmd.action === "add" || cmd.action === "edit") {
    if (cmd.action === "add" && old) throw new ChannelWorkflowError("duplicate");
    const type = cmd.type;
    const value = cmd.value?.trim();
    if (!type || !CHANNEL_TYPES.includes(type) || !value || value.length > 200) throw new ChannelWorkflowError("invalid");
    const valid = type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      : type === "website" ? !!hostFromUrl(value) && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(hostFromUrl(value) ?? "")
      : type === "phone" ? /^\+?[0-9]{7,15}$/.test(channelKey(type, value))
      : type === "social" ? /^(?:@[\w.]+|https:\/\/\S+)$/.test(value)
      : type === "sms" ? /^[a-zA-Z0-9 _-]{2,15}$/.test(value) : true;
    if (!valid) throw new ChannelWorkflowError("invalid");
    if (state.organizations.some((o) => o.channels.some((c) => c.id !== cmd.channelId && c.type === type && channelKey(type, c.value) === channelKey(type, value)))) throw new ChannelWorkflowError("duplicate");
    next = { id: cmd.channelId, type, value, status: "pending", addedAt: old?.addedAt ?? at };
  } else {
    if (!old) throw new ChannelWorkflowError("not_found");
    next = { ...old };
    if (cmd.action === "submit") {
      if (old.status !== "pending" || old.submittedAt) throw new ChannelWorkflowError("invalid_transition");
      next.submittedAt = at;
    }
    if (cmd.action === "approve" || cmd.action === "reject") {
      if (old.status !== "pending" || !old.submittedAt) throw new ChannelWorkflowError("not_submitted");
      if (!cmd.note?.trim()) throw new ChannelWorkflowError("review_note_required");
      next.status = cmd.action === "approve" ? "verified" : "rejected";
      next.reviewedAt = at;
    }
    if (cmd.action === "revoke" || cmd.action === "deactivate") {
      if (old.status !== "verified") throw new ChannelWorkflowError("invalid_transition");
      next.status = cmd.action === "revoke" ? "revoked" : "inactive";
    }
  }
  const event: ChannelAuditEvent = {
    id: eventId, orgId: org.id, channelId: next.id, action: cmd.action,
    actor: actor.role === "org_admin" ? `org_admin:${org.id}` : "independent_demo_verifier",
    at, type: next.type, value: next.value, status: next.status ?? "pending", note: cmd.note?.trim() ?? "",
    ...(old && cmd.action === "edit" ? { previousValue: old.value } : {}),
  };
  const channels = cmd.action === "remove" ? org.channels.filter((c) => c.id !== next.id)
    : cmd.action === "add" ? [...org.channels, next] : org.channels.map((c) => c.id === next.id ? next : c);
  return { ...state, organizations: state.organizations.map((o) => o.id === org.id ? { ...org, channels } : o), channelAudit: [...(state.channelAudit ?? []), event] };
}