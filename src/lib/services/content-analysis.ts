/**
 * Content analysis extension point. The prototype ships a transparent keyword
 * heuristic; a future AI analyzer can implement the same interface.
 */
export type ContentSignalCode = "content_urgency" | "content_credentials" | "content_payment";

export interface ContentSignal {
  code: ContentSignalCode;
  matched: string;
}

export interface ContentAnalyzer {
  readonly id: string;
  analyze(text: string): ContentSignal[];
}

const RULES: Array<{ code: ContentSignalCode; patterns: RegExp[] }> = [
  {
    code: "content_urgency",
    patterns: [
      /\burgent(ly)?\b/i, /\bimmediately\b/i, /\bsuspended\b/i, /\bwithin 24 hours\b/i,
      /\bfinal (notice|warning)\b/i, /\bavoid penalt/i, /عاجل/, /فوراً|فورا/, /تعليق|موقوف|إيقاف/, /خلال 24 ساعة/,
    ],
  },
  {
    code: "content_credentials",
    patterns: [
      /\bpassword\b/i, /\bpin\b/i, /\bcvv\b/i, /\bcard number\b/i, /\bverify (your )?(account|identity)\b/i,
      /\bread out\b/i, /كلمة (المرور|السر)/, /الرقم السري/, /رمز (التحقق|PIN)/, /رقم البطاقة/,
    ],
  },
  {
    code: "content_payment",
    patterns: [
      /\bpay\b/i, /\bfee\b/i, /\bfine\b/i, /\btransfer\b/i, /\bAED\b/,
      /ادفع|دفع/, /رسوم/, /مخالفة|غرامة/, /تحويل/, /درهم/,
    ],
  },
];

export const heuristicAnalyzer: ContentAnalyzer = {
  id: "heuristic-keywords-v1",
  analyze(text: string): ContentSignal[] {
    const signals: ContentSignal[] = [];
    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        const m = text.match(pattern);
        if (m) {
          signals.push({ code: rule.code, matched: m[0] });
          break;
        }
      }
    }
    return signals;
  },
};
