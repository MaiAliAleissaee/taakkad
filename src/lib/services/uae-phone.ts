/** UAE format normalization only: never evidence of ownership, carrier or caller identity. */
export function asciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit >= "۰" ? 0x06f0 : 0x0660)));
}

export function normalizeUaePhone(value: string): string | null {
  const plain = asciiDigits(value.trim());
  if (!/^[+\d\s().-]+$/.test(plain)) return null;
  const compact = plain.replace(/[\s().-]/g, "");
  // Domestic service numbers are not automatically dialable international numbers.
  if (/^(?:600\d{6}|800\d{3,9})$/.test(compact)) return compact;
  let national = compact.replace(/^(?:\+971|00971|971)/, "");
  if (national === compact && compact.startsWith("+")) return null;
  national = national.replace(/^0/, "");
  if (!/^(?:5[024568]\d{7}|[234679]\d{7})$/.test(national)) return null;
  return `+971${national}`;
}

export function phoneKey(value: string): string {
  return normalizeUaePhone(value) ?? asciiDigits(value).replace(/[\s().-]/g, "");
}

/** Local extraction is limited to explicit UAE formats, not bare OTPs or ID numbers. */
export function extractUaePhones(text: string): string[] {
  const plain = asciiDigits(text.slice(0, 10000));
  const matches = plain.match(/(?<![\w\d+])(?:\+971|00971|0)[\s().-]*(?:5[024568](?:[\s().-]*\d){7}|[234679](?:[\s().-]*\d){7})(?![\w\d])/g) ?? [];
  return [...new Set(matches.map(normalizeUaePhone).filter((v): v is string => v !== null))].slice(0, 15);
}