import type { ApplicationStatus } from "./schema";

export type QueueRow = { id: string; reference: string; status: string; submitted_at: string; payload: { name: { en: string; ar: string } } };
export type QueueFilter = ApplicationStatus | "all";

// Counts come only from authorized application rows returned by the server.
export function queueStats(rows: QueueRow[]) {
  const count = (s: string) => rows.filter(r => r.status === s).length;
  return { total: rows.length, pending: count("pending"), needsInformation: count("needs_information"), approved: count("approved"), rejected: count("rejected") };
}

export function filterQueue<T extends QueueRow>(rows: T[], term: string, status: QueueFilter): T[] {
  const q = term.trim().toLowerCase();
  return rows.filter(r => (status === "all" || r.status === status) && (!q || [r.reference, r.payload.name.en, r.payload.name.ar].some(v => v.toLowerCase().includes(q))));
}

// Rejection and information requests must carry a documented reason; approval needs every domain confirmed.
export function canSubmitDecision(decision: "approved" | "rejected" | "needs_information", note: string, domains: string[], confirmed: string[]): boolean {
  if (!note.trim()) return false;
  return decision !== "approved" || domains.every(d => confirmed.includes(d));
}
