import type { Severity } from "@/lib/domain/types";
import type { AiOutcome } from "./ai-schema";
import { severityFromRisk } from "./reporting";
import type { Assessment } from "./verification";

const rank: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 };
/** Ordinal risk combination, not a calibrated probability. AI cannot lower technical risk. */
export function combinedRiskScore(assessment: Assessment, ai: AiOutcome | null, flaggedIndicator = false): number {
  const semantic = ai?.status === "performed" ? { low: 0, medium: 40, high: 65, critical: 90 }[ai.findings.risk] : 0;
  return Math.min(100, Math.max(assessment.riskScore, semantic, flaggedIndicator ? 65 : 0));
}
/** Registry state is a separate fact, not a semantic safety verdict. */
export function overallRisk(assessment: Assessment, ai: AiOutcome | null, flaggedIndicator = false): Severity {
  const deterministic = severityFromRisk(assessment.riskScore);
  const semantic = ai?.status === "performed" ? ai.findings.risk : "low";
  const combined = rank[semantic] > rank[deterministic] ? semantic : deterministic;
  return flaggedIndicator && rank[combined] < rank.high ? "high" : combined;
}