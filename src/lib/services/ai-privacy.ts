import type { AiFindings } from "./ai-schema";
import { indicatorKey } from "./investigation";
import type { MessageInput } from "./verification";

/** Minimize in the browser AND reapply on the server. No attachments are accepted. */
export function redactAiText(text: string): string {
  return text
    .replace(/https?:\/\/[^\s<>"']+/gi, value => {
      try { const url = new URL(value); url.username = ""; url.password = ""; url.search = ""; url.hash = ""; return url.toString(); } catch { return "[REDACTED URL]"; }
    })
    .replace(/((?:password|passcode|pin|otp|verification code|cvv|كلمة المرور|كلمة السر|رمز التحقق|الرقم السري)\s*(?:is|هو|هي|:|=)\s*)[^\n;,]+/gi, "$1[REDACTED]")
    .replace(/((?:password|passcode|pin|otp|verification code|cvv|كلمة المرور|كلمة السر|رمز التحقق|الرقم السري)\s+)[\w!@$%*-]*\d[\w!@$%*-]*/gi, "$1[REDACTED]")
    .replace(/\b784[- ]?\d{4}[- ]?\d{7}[- ]?\d\b/g, "[REDACTED ID]")
    .replace(/\b[A-Z]{2}\d{2}[A-Z0-9 ]{11,30}\b/g, "[REDACTED ACCOUNT]")
    .replace(/\b(?:\d[ -]?){13,19}\b/g, "[REDACTED FINANCIAL NUMBER]")
    .replace(/(^|[^\w.+])\d{4,8}(?![\w.])/g, "$1[REDACTED NUMBER]")
    .replace(/((?:name|address|date of birth|passport|الاسم|العنوان|تاريخ الميلاد|جواز السفر)\s*[:=])[^\n;]+/gi, "$1[REDACTED PERSONAL DATA]");
}

export function minimizeAiInput(input: MessageInput): MessageInput {
  return { channel: input.channel, sender: redactAiText(input.sender), body: redactAiText(input.body), ...(input.url ? { url: redactAiText(input.url) } : {}) };
}

/** Ground extraction in supplied text; the model cannot invent a matching indicator. */
export function groundedIndicators(indicators: AiFindings["indicators"], input: MessageInput): AiFindings["indicators"] {
  const source = `${input.sender}\n${input.url ?? ""}\n${input.body}`.toLowerCase();
  const seen = new Set<string>();
  return indicators.filter(indicator => {
    const value = indicator.value.trim();
    const escaped = value.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!value || value.includes("REDACTED") || !new RegExp(`(^|[^a-z0-9_@.+-])${escaped}(?=$|[^a-z0-9_@.+-])`).test(source)) return false;
    const valid = indicator.type === "ip" ? /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) && value.split(".").every(part => Number(part) <= 255)
      : indicator.type === "phone" ? /^\+?[\d ().-]{7,25}$/.test(value)
      : indicator.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      : indicator.type === "url" ? /^https?:\/\/[^\s]+$/i.test(value)
      : indicator.type === "domain" ? /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(value)
      : indicator.type === "social_handle" ? /^@[\w.]{2,80}$/.test(value) : false;
    const key = indicatorKey(indicator.type, value);
    if (!valid || seen.has(key)) return false;
    seen.add(key); return true;
  }).map(indicator => ({ ...indicator, value: indicator.value.trim() }));
}