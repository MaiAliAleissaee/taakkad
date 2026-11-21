import type { ImpersonationAlert, Indicator, Severity } from "@/lib/domain/types";
import { normalizeIndicator } from "./blocklist";
import { hostFromUrl } from "./lookalike";
import type { Assessment, MessageInput } from "./verification";

export function indicatorsFor(input: MessageInput): Indicator[] {
  const out: Indicator[] = [];
  const s = input.sender.trim();
  if (s) {
    const type = input.channel === "email" ? "email" : input.channel === "sms" ? (/^\+?[\d\s]+$/.test(s) ? "phone" : "sms_sender") : input.channel === "phone" ? "phone" : input.channel === "social" ? "social_handle" : "domain";
    out.push({ type, value: s });
    if (input.channel === "email" && s.includes("@")) out.push({ type: "domain", value: s.split("@").pop() as string });
  }
  const host = hostFromUrl(input.url);
  if (host && !out.some((i) => i.value === host)) out.push({ type: "domain", value: host });
  if (input.url?.trim()) out.push({ type: "url", value: input.url.trim() });
  return out;
}

/** Finds an existing case that already tracks one of this message's indicators. */
export function findLinkedCase(alerts: ImpersonationAlert[], input: MessageInput) {
  const keys = new Set(indicatorsFor(input).map((i) => normalizeIndicator(i.value)));
  return alerts.find((a) => a.indicators.some((i) => keys.has(normalizeIndicator(i.value))));
}

export function severityFromRisk(risk: number): Severity {
  return risk >= 85 ? "critical" : risk >= 65 ? "high" : risk >= 40 ? "medium" : "low";
}

export function buildPublicReport(input: MessageInput, assessment: Assessment): Omit<ImpersonationAlert, "id" | "caseId"> {
  const now = new Date().toISOString();
  const target = input.claimedOrgId ?? assessment.matchedOrgId;
  const snippet = input.body.trim().slice(0, 160);
  return {
    title: {
      en: `Public report: ${input.channel.toUpperCase()} from ${input.sender || "unknown sender"}`,
      ar: `بلاغ عام: ${input.channel.toUpperCase()} من ${input.sender || "مرسل مجهول"}`,
    },
    summary: {
      en: `Submitted from the Public Trust Portal. Automated assessment: ${assessment.state}.`,
      ar: `مُرسل من بوابة الثقة العامة. التقييم الآلي: ${assessment.state === "suspicious" ? "مشبوه" : assessment.state === "unverified" ? "غير موثّق" : "موثّق"}.`,
    },
    targetOrgId: target,
    severity: severityFromRisk(assessment.riskScore),
    riskScore: assessment.riskScore,
    status: "new",
    source: "public_report",
    detectedAt: now,
    indicators: indicatorsFor(input),
    evidence: [
      {
        id: `ev-${Math.random().toString(36).slice(2, 9)}`,
        kind: "report",
        capturedAt: now,
        description: { en: `Reported content: "${snippet}"`, ar: `المحتوى المُبلغ عنه: «${snippet}»` },
      },
    ],
    notes: [],
  };
}
