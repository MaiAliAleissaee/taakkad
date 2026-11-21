import { useSyncExternalStore } from "react";
import type { DemoState } from "@/lib/domain/types";
import type { TrustRepository } from "./repository";
import { createSeedState, SEED_VERSION } from "./seed";
import { applyChannelCommand, applyOrganizationReview, upgradeChannelRegistry } from "@/lib/services/channels";

const STORAGE_KEY = "trustzero.demo.v1";
const serverSnapshot = createSeedState();
let state: DemoState = createSeedState();
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep in memory */
  }
}

function readStored(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    return parsed?.version === SEED_VERSION ? upgradeChannelRegistry(parsed) : null;
  } catch {
    return null;
  }
}

/** Loads saved demo data after hydration so server and first client render match. */
export function hydrateDemoStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const stored = readStored();
  if (stored) {
    state = stored;
    emit();
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = readStored() ?? createSeedState();
    emit();
  });
}

function update(fn: (s: DemoState) => DemoState) {
  state = fn(state);
  persist();
  emit();
}

const uid = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`;

function nextCaseId(s: DemoState) {
  const max = s.alerts.reduce((m, a) => Math.max(m, Number(a.caseId.replace(/\D/g, "")) || 0), 1000);
  return `TZ-${max + 1}`;
}

export const repository: TrustRepository = {
  getState: () => state,
  addOrganization: (org) => update((s) => {
    const channels = org.channels.map((c) => ({ id: c.id, type: c.type, value: c.value, status: "pending" as const, addedAt: org.registeredAt }));
    return {
      ...s,
      organizations: [{ ...org, status: "pending", verifiedAt: undefined, channels }, ...s.organizations],
      channelAudit: [...(s.channelAudit ?? []), ...channels.map((c) => ({ id: uid("audit"), orgId: org.id, channelId: c.id, action: "add" as const, actor: "registration_request", at: org.registeredAt, type: c.type, value: c.value, status: c.status, note: "Pending fictional registration; not approved." }))],
    };
  }),
  setOrganizationStatus: (id, status, actor) => update((s) => applyOrganizationReview(s, actor, id, status, new Date().toISOString(), uid("audit"))),
  deleteOrganization: (id, actor) => update((s) => applyOrganizationReview(s, actor, id, "remove", new Date().toISOString(), uid("audit"))),
  channelCommand: (actor, command) => update((s) => applyChannelCommand(s, actor, command, new Date().toISOString(), uid("audit"))),
  addAlert: (input) => {
    const alert = { ...input, id: uid("al"), caseId: nextCaseId(state) };
    update((s) => ({ ...s, alerts: [alert, ...s.alerts] }));
    return alert;
  },
  updateAlert: (id, patch) =>
    update((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  addAlertNote: (id, author, text) =>
    update((s) => ({
      ...s,
      alerts: s.alerts.map((a) =>
        a.id === id ? { ...a, notes: [...a.notes, { id: uid("n"), at: new Date().toISOString(), author, text }] } : a,
      ),
    })),
  setLookalikeStatus: (id, status) =>
    update((s) => ({ ...s, lookalikes: s.lookalikes.map((l) => (l.id === id ? { ...l, status } : l)) })),
  addLookalikes: (items) => update((s) => ({ ...s, lookalikes: [...items, ...s.lookalikes] })),
  reset: () => {
    state = createSeedState();
    persist();
    emit();
  },
};

export { uid };

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, () => state, () => serverSnapshot);
}
