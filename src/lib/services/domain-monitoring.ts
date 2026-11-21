import type { LookalikeDomain, Organization } from "@/lib/domain/types";
import { detectLookalike, generateLookalikeCandidates } from "./lookalike";

/**
 * Domain monitoring extension point. The prototype generates candidate permutations
 * locally — it does NOT query DNS, WHOIS or certificate logs on the internet.
 */
export interface DomainMonitor {
  readonly simulated: boolean;
  scan(org: Organization, existing: string[]): Promise<LookalikeDomain[]>;
}

export const simulatedDomainMonitor: DomainMonitor = {
  simulated: true,
  async scan(org, existing) {
    const known = new Set(existing.map((d) => d.toLowerCase()));
    const now = new Date().toISOString();
    const results: LookalikeDomain[] = [];
    for (const target of org.domains) {
      for (const domain of generateLookalikeCandidates(target, 4)) {
        if (known.has(domain)) continue;
        const match = detectLookalike(domain, target);
        if (!match) continue;
        known.add(domain);
        results.push({
          id: `lk-${Math.random().toString(36).slice(2, 10)}`,
          domain,
          targetDomain: target,
          targetOrgId: org.id,
          technique: match.technique,
          similarity: match.similarity,
          firstSeen: now,
          registrar: "Simulated (not observed online)",
          status: "monitoring",
          source: "simulated_scan",
        });
      }
    }
    return results;
  },
};
