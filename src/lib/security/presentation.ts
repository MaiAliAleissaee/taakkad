import type { ImpersonationAlert, LookalikeDomain } from "@/lib/domain/types";
import { buildInvestigation } from "@/lib/services/investigation";

/** Display numbers are allocated durably by Cloud; legacy IDs remain searchable. */
export function reportLabel(report: Pick<ImpersonationAlert, "caseId" | "reportNumber">) {
  return report.reportNumber ?? report.caseId;
}

export function groupDomains(domains: LookalikeDomain[], reports: ImpersonationAlert[]) {
  const groups = new Map<string, LookalikeDomain[]>();
  for (const domain of domains) {
    const key = domain.domain.trim().toLowerCase().replace(/\.$/, "");
    groups.set(key, [...(groups.get(key) ?? []), domain]);
  }
  return [...groups.entries()].map(([domain, records]) => ({
    domain, records,
    reports: reports.filter(report => report.indicators.some(indicator => {
      if (indicator.type === "domain") return indicator.value.toLowerCase().replace(/\.$/, "") === domain;
      if (indicator.type !== "url") return false;
      try { return new URL(indicator.value).hostname.toLowerCase() === domain; } catch { return false; }
    })),
  }));
}

export function isDocumentationIp(value: string) {
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return (parts[0] === 192 && parts[1] === 0 && parts[2] === 2)
    || (parts[0] === 198 && parts[1] === 51 && parts[2] === 100)
    || (parts[0] === 203 && parts[1] === 0 && parts[2] === 113);
}

export function connectionSummary(reports: ImpersonationAlert[]) {
  const investigation = buildInvestigation(reports);
  const shared = investigation.indicators.filter(indicator => indicator.cases.length > 1);
  return { shared, relatedReports: new Set(shared.flatMap(indicator => indicator.cases.map(report => report.id))).size, leads: investigation.leads };
}