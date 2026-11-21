import { useSyncExternalStore } from "react";
import type { DemoState } from "@/lib/domain/types";
import type { TrustRepository } from "./repository";
import { createSeedState, SEED_VERSION } from "./seed";

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
    return parsed?.version === SEED_VERSION ? parsed : null;
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
  addOrganization: (org) => update((s) => ({ ...s, organizations: [org, ...s.organizations] })),
  setOrganizationStatus: (id, status) =>
    update((s) => ({
      ...s,
      organizations: s.organizations.map((o) =>
        o.id === id ? { ...o, status, verifiedAt: status === "verified" ? new Date().toISOString() : o.verifiedAt } : o,
      ),
    })),
  deleteOrganization: (id) => update((s) => ({ ...s, organizations: s.organizations.filter((o) => o.id !== id) })),
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
