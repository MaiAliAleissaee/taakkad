export type RdapOutcome =
  | { status: "available"; domain: string; source: string; checkedAt: string; registeredAt: string | null; ageDays: number | null; registrar: string | null; domainStatus: string[] }
  | { status: "unavailable"; reason: "unsupported" | "not_found" | "limited" | "timeout" | "service" | "blocked" };
export interface UrlIntelligence { rdap: RdapOutcome; redirects: { status: "unverified"; reason: "safe_expansion_unavailable"; checkedHops: 0 } }
export const uncheckedRedirects = { status: "unverified", reason: "safe_expansion_unavailable", checkedHops: 0 } as const;
