import { useSyncExternalStore } from "react";
import type { DemoState, Organization } from "@/lib/domain/types";
import type { TrustRepository } from "./repository";
import { createSeedState, SEED_VERSION } from "./seed";
import { applyChannelCommand, applyOrganizationReview, upgradeChannelRegistry } from "@/lib/services/channels";
import { publicOrganizations } from "./public-registry";

const STORAGE_KEY = "trustzero.demo.v1";
const serverSnapshot = createSeedState();
let state: DemoState = createSeedState();
let hydrated = false;
const listeners = new Set<() => void>();
let registry: Organization[] = [];
let visibleState = state;

const emit = () => {
  const ids = new Set(registry.map(o => o.id));
  visibleState = { ...state, organizations: [...registry, ...state.organizations.filter(o => !ids.has(o.id))] };
  listeners.forEach((l) => l());
};

/** Safe public projections only; never persist over a visitor's legacy records. */
export async function refreshOrganizationRegistry() {
  const { supabase } = await import("@/integrations/supabase/client");
  const result = await supabase.from("genuine_organization_registry").select("payload");
  if (result.error) return;
  registry = publicOrganizations(result.data.map(r => r.payload as unknown as Organization));
  emit();
}

function persist() {
  try {
    // Keep legacy private records intact until an authorized import has been acknowledged.
    const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, alerts: old.alerts ?? [], lookalikes: old.lookalikes ?? [] }));
  } catch {
    /* storage unavailable: keep in memory */
  }
}

function readStored(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    return parsed?.version === SEED_VERSION ? upgradeChannelRegistry({ ...parsed, alerts: [], lookalikes: [] }) : null;
  } catch {
    return null;
  }
}

/** Loads saved demo data after hydration so server and first client render match. */
export function hydrateDemoStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  void refreshOrganizationRegistry();
  window.addEventListener("focus", () => { void refreshOrganizationRegistry(); });
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

function restricted(): never { throw new Error("Security records require authenticated server access"); }

export const repository: TrustRepository = {
  getState: () => visibleState,
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
  addAlert: restricted,
  updateAlert: restricted,
  addAlertNote: restricted,
  setLookalikeStatus: restricted,
  addLookalikes: restricted,
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
  return useSyncExternalStore(subscribe, () => visibleState, () => serverSnapshot);
}

const emptyPublicRegistry: Organization[] = [];
/** No fallback to fictional seeds or legacy browser records for real public verification. */
export function usePublicOrganizations(): Organization[] {
  return useSyncExternalStore(subscribe, () => registry, () => emptyPublicRegistry);
}
