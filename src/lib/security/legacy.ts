import { snapshotSchema } from "./schema";
const KEY = "trustzero.demo.v1";
export function pendingSecurityMigration() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!(parsed.alerts?.length || parsed.lookalikes?.length)) return null;
  const snapshot = snapshotSchema.parse({ alerts: parsed.alerts ?? [], lookalikes: parsed.lookalikes ?? [] });
  let migrationId = localStorage.getItem("trustzero.security.migration");
  if (!migrationId) { migrationId = crypto.randomUUID(); localStorage.setItem("trustzero.security.migration", migrationId); }
  return { migrationId, snapshot };
}
/** Call only after the server confirms the archived snapshot and active workspace. */
export function completeSecurityMigration(userId: string) {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    localStorage.setItem(KEY, JSON.stringify({ ...parsed, alerts: [], lookalikes: [] }));
  }
  localStorage.setItem("trustzero.security.workspace", userId);
  window.dispatchEvent(new Event("trustzero-workspace"));
}