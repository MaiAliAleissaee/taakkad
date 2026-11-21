import type { ImpersonationAlert, IndicatorType } from "@/lib/domain/types";
import { normalizeIndicator } from "./blocklist";

export interface InvestigationIndicator {
  id: string;
  type: IndicatorType;
  value: string;
  cases: ImpersonationAlert[];
}

export function indicatorKey(type: IndicatorType, value: string) {
  const normalized = type === "phone" ? value.replace(/[\s().-]/g, "") : normalizeIndicator(value);
  return `${type}:${normalized}`;
}

/** Exact, type-aware matches are leads, not evidence of common authorship. */
export function buildInvestigation(alerts: ImpersonationAlert[]) {
  const index = new Map<string, InvestigationIndicator>();
  for (const alert of alerts) {
    for (const indicator of alert.indicators) {
      const id = indicatorKey(indicator.type, indicator.value);
      const entry = index.get(id) ?? { id, ...indicator, cases: [] };
      if (!entry.cases.some((c) => c.id === alert.id)) entry.cases.push(alert);
      index.set(id, entry);
    }
  }
  const indicators = [...index.values()].sort((a, b) => b.cases.length - a.cases.length || a.id.localeCompare(b.id));
  const pairs = new Map<string, { cases: [ImpersonationAlert, ImpersonationAlert]; indicators: InvestigationIndicator[]; requiresHumanReview: true }>();
  for (const indicator of indicators) {
    for (let i = 0; i < indicator.cases.length; i++) {
      for (let j = i + 1; j < indicator.cases.length; j++) {
        const a = indicator.cases[i];
        const b = indicator.cases[j];
        if (!a || !b) continue;
        const key = [a.id, b.id].sort().join("|");
        const pair: { cases: [ImpersonationAlert, ImpersonationAlert]; indicators: InvestigationIndicator[]; requiresHumanReview: true } = pairs.get(key) ?? { cases: [a, b], indicators: [], requiresHumanReview: true };
        pair.indicators.push(indicator);
        pairs.set(key, pair);
      }
    }
  }
  return { indicators, leads: [...pairs.values()] };
}