const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
} as const;

// Only numeric parts come from Intl: localized month abbreviations and
// punctuation differ between Safari's ICU data and the server's ICU data.
const partsFormatter = new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn", {
  timeZone: "Asia/Dubai",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatDisplayDate(iso: string, lang: "en" | "ar", withTime = false): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = partsFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const month = MONTHS[lang][Number(part("month")) - 1] ?? "";
  const text = `${Number(part("day"))} ${month} ${part("year")}`;
  return withTime ? `${text}${lang === "ar" ? "،" : ","} ${part("hour")}:${part("minute")}` : text;
}