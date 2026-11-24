import type { ImpersonationAlert, Indicator, Severity } from "@/lib/domain/types";
import { hostFromUrl } from "./lookalike";
import type { Assessment, MessageInput } from "./verification";
import type { AiFindings } from "./ai-schema";
import { groundedIndicators } from "./ai-privacy";
import { indicatorKey } from "./investigation";
import { extractUaePhones, normalizeUaePhone } from "./uae-phone";

export function indicatorsFor(input: MessageInput & { aiIndicators?: AiFindings["indicators"] | undefined }): Indicator[] {
  const out: Indicator[] = [];
  const s = input.sender.trim();
  if (s) {
    const type = input.channel === "email" ? "email" : input.channel === "sms" ? (normalizeUaePhone(s) || /^\+?[\d\s]+$/.test(s) ? "phone" : "sms_sender") : input.channel === "phone" ? "phone" : input.channel === "social" ? "social_handle" : "domain";
    out.push({ type, value: s });
    if (input.channel === "email" && s.includes("@")) out.push({ type: "domain", value: s.split("@").pop() as string });
  }
  const host = hostFromUrl(input.url);
  if (host && !out.some((i) => i.value === host)) out.push({ type: "domain", value: host });
  if (input.url?.trim()) out.push({ type: "url", value: input.url.trim() });
  const keys = new Set(out.map(item => indicatorKey(item.type, item.value)));
  const append = (indicator: Indicator) => {
    const key = indicatorKey(indicator.type, indicator.value);
    if (!keys.has(key) && out.length < 40) { out.push(indicator); keys.add(key); }
  };
  // Only explicit contacts/links supplied by the visitor, extracted locally. No lookup or attribution.
  const text = input.body.slice(0, 10000);
  for (const value of extractUaePhones(text)) append({ type: "phone", value });
  for (const value of (text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) ?? []).slice(0, 10)) {
    append({ type: "email", value });
    const domain = value.split("@")[1];
    if (domain) append({ type: "domain", value: domain });
  }
  for (const value of (text.match(/https?:\/\/[^\s<>"']+/gi) ?? []).slice(0, 10)) {
    const url = value.replace(/[.,;،؛)]+$/, "");
    const domain = hostFromUrl(url);
    if (domain && url.length <= 2000) { append({ type: "domain", value: domain }); append({ type: "url", value: url }); }
  }
  for (const indicator of groundedIndicators(input.aiIndicators ?? [], input)) {
    const key = indicatorKey(indicator.type, indicator.value);
    if (!keys.has(key)) { out.push(indicator); keys.add(key); }
  }
  return out;
}

/** Finds an existing case that already tracks one of this message's indicators. */
export function findLinkedCase(alerts: ImpersonationAlert[], input: MessageInput) {
  const keys = new Set(indicatorsFor(input).map((i) => indicatorKey(i.type, i.value)));
  return alerts.find((a) => a.indicators.some((i) => keys.has(indicatorKey(i.type, i.value))));
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
