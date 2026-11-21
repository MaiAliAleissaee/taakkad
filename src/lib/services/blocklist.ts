import type { ImpersonationAlert, IndicatorType } from "@/lib/domain/types";

export interface BlockedIndicator {
  type: IndicatorType;
  value: string;
  caseId: string;
}

/** Only escalated or confirmed cases count as evidence for the public portal. */
export function buildBlocklist(alerts: ImpersonationAlert[]): BlockedIndicator[] {
  return alerts
    .filter((a) => a.status === "escalated" || a.status === "confirmed")
    .flatMap((a) => a.indicators.map((i) => ({ type: i.type, value: i.value, caseId: a.caseId })));
}

export function normalizeIndicator(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").replace(/\s+/g, "");
}
