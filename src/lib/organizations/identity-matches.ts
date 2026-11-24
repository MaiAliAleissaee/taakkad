import { detectLookalike, normalizeHost } from "@/lib/services/lookalike";
import type { Bi } from "@/lib/domain/types";
import type { IdentityConflict } from "./relationship";

export type IdentityCandidate = { id: string; organizationId: string; name: Bi; domains: string[]; status: string };
/** Supplemental maintained lookalike rules; exact approval safeguards remain database-authoritative. */
export function lookalikeIdentityLeads(subject: IdentityCandidate, candidates: IdentityCandidate[], existing: IdentityConflict[]): IdentityConflict[] {
  const matches = new Map(existing.map(c => [`${c.organizationId}:${c.indicator}:${c.value}:${c.matchedValue}`, c]));
  for (const other of candidates) {
    if (other.id === subject.id || !["pending", "needs_information", "approved"].includes(other.status)) continue;
    for (const domain of subject.domains) for (const registered of other.domains) {
      const value = normalizeHost(domain); const matchedValue = normalizeHost(registered);
      if (value === matchedValue || !detectLookalike(value, matchedValue)) continue;
      const key = `${other.organizationId}:domain:${value}:${matchedValue}`;
      if (!matches.has(key)) matches.set(key, { organizationId: other.organizationId, name: other.name, indicator: "domain", value, matchedValue, match: "approximate", severity: "medium", reason: "similar_identity", provenance: "application" });
    }
  }
  return [...matches.values()];
}