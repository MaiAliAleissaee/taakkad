import type { ImpersonationAlert, Indicator } from "@/lib/domain/types";
import { buildInvestigation, indicatorKey } from "./investigation";

export function correlateIndicators(alerts: ImpersonationAlert[], supplied: Indicator[]) {
  const keys = new Set(supplied.map(item => indicatorKey(item.type, item.value)));
  return buildInvestigation(alerts).indicators.filter(item => keys.has(item.id)).map(item => ({
    type: item.type, value: item.value,
    cases: item.cases.map(record => ({ caseId: record.caseId, status: record.status })),
    requiresHumanReview: true as const,
  }));
}