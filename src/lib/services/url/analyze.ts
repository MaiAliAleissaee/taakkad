import { parse } from "tldts";
import punycode from "punycode/";
import ipaddr from "ipaddr.js";
import { levenshtein } from "../lookalike";
import { officialReferences, isDomainBoundary } from "./official-references";
const { toUnicode } = punycode;

export interface UrlSignal { code: string; kind: "observation" | "suspicious"; weight: number; en: string; ar: string }
export interface UrlAnalysis {
  valid: boolean; host: string; domain: string | null; suffix: string | null;
  officialDomain: string | null; signals: UrlSignal[]; riskScore: number;
  classification: "low" | "caution" | "suspicious"; networkEligible: boolean;
}
const sensitive = /(?:login|signin|verify|verification|password|credential|payment|pay|account|otp|fine|fines|تسجيل|دفع|تحقق)/i;
const shorteners = new Set(["bit.ly", "t.co", "tinyurl.com", "is.gd", "cutt.ly", "rb.gy", "shorturl.at", "s.id", "rebrand.ly", "ow.ly"]);
const glyphs: Record<string, string> = { "а":"a", "е":"e", "о":"o", "р":"p", "с":"c", "х":"x", "у":"y", "і":"i", "ј":"j", "ѕ":"s", "ӏ":"l", "ԁ":"d", "α":"a", "ο":"o", "ρ":"p", "ν":"v", "ι":"i", "0":"o", "1":"l" };
const skeleton = (text: string) => [...text.toLowerCase().normalize("NFKC")].map(c => glyphs[c] ?? c).join("");
export function isBlockedHost(host: string): boolean {
  const plain = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (ipaddr.isValid(plain)) return ipaddr.parse(plain).range() !== "unicast";
  return !plain.includes(".") || /(?:^|\.)(?:localhost|local|internal|test|example|invalid|onion)$/.test(plain) || plain === "metadata.google.internal";
}
/** Pure, bounded analysis. Never requests the submitted URL or emits its query/userinfo. */
export function analyzeUrl(raw: string): UrlAnalysis {
  const signals: UrlSignal[] = [];
  const add = (code: string, weight: number, en: string, ar: string) => {
    if (!signals.some(s => s.code === code)) signals.push({ code, weight, en, ar, kind: weight >= 50 ? "suspicious" : "observation" });
  };
  let url: URL;
  const value = raw.trim();
  try {
    if (!value || value.length > 2000 || /[\u0000-\u001f\u007f]/.test(raw) || /[\u0000-\u0020\u007f]/.test(value) || /%(?![\da-f]{2})/i.test(value)) throw new Error("Malformed");
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("Protocol");
  } catch {
    add("malformed", 40, "The URL is malformed or uses an unsupported protocol; its destination is unverified.", "الرابط غير صالح أو يستخدم بروتوكولاً غير مدعوم؛ وجهته غير متحقق منها.");
    return { valid: false, host: "", domain: null, suffix: null, officialDomain: null, signals, riskScore: 40, classification: "caution", networkEligible: false };
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const parts = parse(host, { allowPrivateDomains: true });
  const official = officialReferences.find(ref => isDomainBoundary(host, ref.domain));
  const unicode = toUnicode(host);
  const normalized = skeleton(unicode);
  const core = skeleton(toUnicode(parts.domainWithoutSuffix ?? ""));
  const isIp = ipaddr.isValid(host.replace(/^\[|\]$/g, ""));
  if (url.username || url.password) add("userinfo", 60, "The URL embeds a username/password before @, which can hide the real destination.", "يحتوي الرابط على اسم مستخدم أو كلمة مرور قبل @، ما قد يخفي الوجهة الفعلية.");
  if (isIp) add("ip_host", 25, "The destination is an IP address, not an organization domain.", "الوجهة عنوان IP وليست نطاق جهة.");
  if (isBlockedHost(host)) add("blocked_network", 20, "This is a local, private, reserved or special-use destination. No network request is allowed.", "هذه وجهة محلية أو خاصة أو محجوزة؛ لا يُسمح بطلب شبكي إليها.");
  if (!isIp && (!parts.domain || /^(?:-|.*\.-)|(?:-\.|-)$/.test(host))) add("invalid_host", 40, "The hostname has no recognized registrable domain or contains malformed labels.", "لا يتضمن اسم المضيف نطاقاً قابلاً للتسجيل معروفاً أو يحتوي تسميات غير صالحة.");
  if (host.includes("xn--")) add("idn", 10, "The host uses an internationalized (Punycode) domain; Unicode alone does not establish fraud.", "يستخدم المضيف نطاقاً دولياً (Punycode)؛ أحرف Unicode وحدها لا تثبت الاحتيال.");
  if (url.protocol === "http:") add("http", 10, "The URL does not use HTTPS. This is a transport observation, not proof of fraud.", "لا يستخدم الرابط HTTPS. هذه ملاحظة نقل وليست دليلاً على الاحتيال.");
  if (shorteners.has(parts.domain ?? host)) add("shortener", 15, "A URL shortener hides the final destination; expansion was not performed.", "يخفي مختصر الروابط الوجهة النهائية؛ لم يُجرَ توسيع الرابط.");
  if (host.split(".").length >= 6) add("many_labels", 10, "The host has unusually many labels, which may obscure the registrable domain.", "يتضمن المضيف تسميات كثيرة قد تحجب النطاق القابل للتسجيل.");
  const authority = value.replace(/^https?:\/\//i, "").split(/[/?#]/)[0] ?? "";
  if (value.includes("\\") || /%[\da-f]{2}/i.test(authority)) add("encoded_host", 20, "The URL uses backslashes or an encoded authority; the parsed host is the actual destination.", "يستخدم الرابط شرطات عكسية أو ترميزاً في عنوان المضيف؛ المضيف المحلل هو الوجهة الفعلية.");
  let decodedPath = url.pathname;
  try { decodedPath = decodeURIComponent(decodeURIComponent(decodedPath)); } catch { add("bad_encoding", 20, "Part of the path has invalid or repeated encoding.", "يتضمن المسار ترميزاً غير صالح أو متكرراً."); }
  if (/%(?:25|2f|3a|40)/i.test(url.pathname)) add("encoded_path", 10, "The path contains nested or structural URL encoding.", "يتضمن المسار ترميزاً متداخلاً أو بنيوياً للرابط.");
  const hasSensitive = sensitive.test(`${decodedPath} ${[...url.searchParams.keys()].join(" ")}`);
  if (!official && hasSensitive) add("sensitive_path", 20, "The URL contains login, payment or account-related patterns on an unconfirmed domain; these words alone do not prove fraud.", "يتضمن الرابط أنماط تسجيل أو دفع أو حساب على نطاق غير مؤكد؛ هذه الكلمات وحدها لا تثبت الاحتيال.");
  if (!official) {
    for (const ref of officialReferences) {
      const fullReference = normalized.includes(ref.domain);
      const aliases = ref.aliases;
      const impersonates = aliases.some(alias => {
        const labelTokens = normalized.split(/[.-]/);
        const compact = core.replace(/-/g, "");
        const exact = labelTokens.includes(alias) || core === alias;
        const compound = compact.startsWith(alias) && sensitive.test(compact.slice(alias.length));
        const typo = alias.length >= 5 && core.length >= 5 && levenshtein(core.replace(/-/g, ""), alias) <= 1;
        return exact || compound || typo;
      });
      if (fullReference || impersonates) {
        add("brand_impersonation", 60, `The domain resembles ${ref.name} but is outside ${ref.domain}. Possible impersonation, not confirmed fraud.`, `يشبه النطاق ${ref.ar} لكنه خارج ${ref.domain}. انتحال محتمل وليس احتيالاً مؤكداً.`);
        if (unicode !== host && normalized !== unicode) add("homoglyph", 15, "Unicode characters visually resemble letters in an official brand.", "تشبه أحرف Unicode بصرياً أحرفاً في علامة رسمية.");
        break;
      }
    }
    if (/(?:^|\.)gov\.ae\./.test(host) || /(?:^|[.-])(?:uae-government|uaegov|traffic-fines)(?:[.-]|$)/.test(host)) add("government_lure", 60, "The domain presents a UAE government or traffic-fine identity outside the documented official references; confirm independently.", "يعرض النطاق هوية حكومية إماراتية أو مخالفات مرورية خارج المراجع الرسمية الموثقة؛ تحقق بشكل مستقل.");
  }
  for (const [key, dest] of url.searchParams) {
    if (!/^(?:url|redirect|redirect_uri|redirecturl|next|continue|return|returnurl|destination)$/i.test(key) || !/^https?:\/\//i.test(dest)) continue;
    try { const nested = new URL(dest); if (nested.hostname !== host) add("redirect_parameter", 20, "A URL parameter points to another host. This is a potential redirect, not an observed redirect chain.", "يشير معامل في الرابط إلى مضيف آخر. هذا تحويل محتمل وليس سلسلة تحويلات تمت ملاحظتها."); } catch { /* No destination request. */ }
  }
  const weights = signals.map(s => s.weight).sort((a,b) => b-a);
  const riskScore = Math.min(100, (weights[0] ?? 0) + weights.slice(1).reduce((sum,w) => sum + Math.round(w / 3), 0));
  return { valid: true, host, domain: parts.domain, suffix: parts.publicSuffix, officialDomain: official?.domain ?? null, signals, riskScore, classification: riskScore >= 50 ? "suspicious" : riskScore >= 20 ? "caution" : "low", networkEligible: !isBlockedHost(host) && !isIp && !!parts.domain && !url.username && !url.password && ["", "443", "80"].includes(url.port) };
}
