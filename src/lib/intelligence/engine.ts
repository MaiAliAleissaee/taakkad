import { targets, type IntelligenceRecord } from "./schema";
import { isDomainBoundary } from "@/lib/services/url/official-references";
import { analyzeUrl } from "@/lib/services/url/analyze";
import { levenshtein } from "@/lib/services/lookalike";
import { indicatorKey } from "@/lib/services/investigation";
import type { ImpersonationAlert } from "@/lib/domain/types";
export function generateCandidates(targetDomain: string): string[] {
  const target = targets.find(t => t.domain === targetDomain);
  if (!target) return [];
  const alias = target.aliases[0]; if (!alias) return [];
  const labels = [`${alias}-login`, `${alias}-payment`, `${alias}-fines`, `${alias}-verify`, `${alias}-uae`];
  if (alias.length > 3) { labels.push(alias.slice(0, -1), `${alias.slice(0, 1)}${alias.slice(2)}`, `${alias}${alias.slice(-1)}`); }
  const generated = labels.flatMap(label => ["com", "net", "org", "ae"].map(suffix => `${label}.${suffix}`));
  return [...new Set(generated)].filter(domain => !targets.some(t => isDomainBoundary(domain, t.domain))).slice(0, 24);
}
export function resemblesTarget(domain: string | null, targetDomain: string) {
  if (!domain || targets.some(t => isDomainBoundary(domain, t.domain))) return false;
  const target = targets.find(t => t.domain === targetDomain); const label = domain.split(".")[0] ?? "";
  return !!target?.aliases.some(alias => label === alias || label.startsWith(`${alias}-`) || label.endsWith(`-${alias}`) || (alias.length >= 4 && Math.abs(label.length - alias.length) <= 1 && levenshtein(label, alias) === 1));
}
/** These are private review priorities, never fraud verdicts or trusted-channel approvals. */
export function priority(record: IntelligenceRecord) {
  const matching = resemblesTarget(record.domain, record.targetDomain);
  const observation = record.observation;
  const evidence = !!observation && (observation.dns === "resolved" || observation.registration === "confirmed");
  const recent = observation?.registration === "confirmed" && observation.ageDays !== null && observation.ageDays <= 30;
  const earlyWarning = !record.synthetic && matching && evidence;
  const risk = earlyWarning ? recent ? "high" : "medium" : "low";
  return { risk, earlyWarning, recent, matching, urlRisk: record.domain ? analyzeUrl(record.domain).riskScore : 0 } as const;
}
export function correlate(record: IntelligenceRecord, records: IntelligenceRecord[], reports: ImpersonationAlert[]) {
  const keys = new Set(record.indicators.map(i => indicatorKey(i.type, i.value)));
  if (record.domain) keys.add(indicatorKey("domain", record.domain));
  const matches = (indicators: IntelligenceRecord["indicators"]) => [...new Set(indicators.filter(i => keys.has(indicatorKey(i.type, i.value))).map(i => `${i.type}: ${i.value}`))];
  return {
    reports: reports.flatMap(report => { const shared = matches(report.indicators); return shared.length ? [{ id: report.id, label: report.reportNumber ?? report.caseId, synthetic: report.source !== "public_report", shared }] : []; }),
    records: records.filter(other => other.id !== record.id).flatMap(other => { const shared = matches([...other.indicators, ...(other.domain ? [{ type: "domain" as const, value: other.domain }] : [])]); return shared.length ? [{ id: other.id, label: other.title, synthetic: other.synthetic, shared }] : []; }),
  };
}
export function mergeRecords(existing: IntelligenceRecord[], incoming: IntelligenceRecord[]) {
  const key = (r: IntelligenceRecord) => JSON.stringify([r.source, r.targetDomain, r.domain, r.sourceReference, r.title, r.synthetic, r.sourceObservedAt, r.notes, r.indicators]);
  const seen = new Set(existing.map(key));
  return [...existing, ...incoming.filter(r => { const k = key(r); if (seen.has(k)) return false; seen.add(k); return true; })];
}
