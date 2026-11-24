import { parse } from "tldts";
import { toUnicode } from "punycode";
import ipaddr from "ipaddr.js";
import { levenshtein } from "../lookalike";
import { officialReferences, isDomainBoundary } from "./official-references";

export interface UrlSignal { code: string; kind: "observation" | "suspicious"; weight: number; en: string; ar: string }
export interface UrlAnalysis {
  valid: boolean; host: string; domain: string | null; suffix: string | null;
  officialDomain: string | null; signals: UrlSignal[]; riskScore: number;
  classification: "low" | "caution" | "suspicious"; networkEligible: boolean;
}
const sensitive = /(?:login|signin|verify|verification|password|credential|payment|pay|account|otp|fine|fines|auth|kyc|card|refund|reward|reimbursement|تسجيل|دفع|تحقق|استرداد|مكافأة)/i;
const shorteners = new Set(["bit.ly", "t.co", "tinyurl.com", "is.gd", "cutt.ly", "rb.gy", "shorturl.at", "s.id", "rebrand.ly", "ow.ly"]);
const glyphs: Record<string, string> = { "а":"a", "е":"e", "о":"o", "р":"p", "с":"c", "х":"x", "у":"y", "і":"i", "ј":"j", "ѕ":"s", "ӏ":"l", "ԁ":"d", "α":"a", "ο":"o", "ρ":"p", "ν":"v", "ι":"i", "0":"o", "1":"l" };
const skeleton = (text: string) => [...text.toLowerCase().normalize("NFKC")].map(c => glyphs[c] ?? c).join("");
const identityContext = /(?:support|secure|service|portal|auth|helpdesk|customer|update|recover|unlock|kyc|تحديث|دعم)/i;
const editorialContext = /(?:^|[\/-])(?:archive|history|news|blog|article|review|museum)(?:[\/-]|$)/i;
/** Decode only three layers, with the same bounded input as the outer analysis. */
function decodeLayers(value: string): string {
  let result = value;
  for (let i = 0; i < 3; i++) { try { const next = decodeURIComponent(result); if (next === result) break; result = next; } catch { break; } }
  return result;
}
export function isBlockedHost(host: string): boolean {
  const plain = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (ipaddr.isValid(plain)) return ipaddr.parse(plain).range() !== "unicast";
  return !plain.includes(".") || /(?:^|\.)(?:localhost|local|internal|test|example|invalid|onion)$/.test(plain) || plain === "metadata.google.internal";
}
/** Pure, bounded analysis. Never requests the submitted URL or emits its query/userinfo. */
export function analyzeUrl(raw: string, depth = 0): UrlAnalysis {
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
  let unicode = host;
  try {
    unicode = toUnicode(host);
    if (host.split(".").some(label => label.startsWith("xn--") && !/[^\x00-\x7f]/.test(toUnicode(label)))) throw new Error("Invalid IDN");
  } catch {
    add("invalid_idn", 40, "The internationalized hostname cannot be decoded reliably; its identity is unverified.", "لا يمكن فك ترميز اسم المضيف الدولي بشكل موثوق؛ هويته غير متحقق منها.");
    return { valid: false, host, domain: parts.domain, suffix: parts.publicSuffix, officialDomain: null, signals, riskScore: 40, classification: "caution", networkEligible: false };
  }
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
  const editorial = editorialContext.test(`${core}/${decodedPath}`) && !hasSensitive;
  if (isIp && hasSensitive) add("ip_credential_context", 50, "An IP-address URL requests an account or payment action. Confirm the destination independently; this is not a fraud verdict.", "يطلب رابط بعنوان IP إجراءً للحساب أو الدفع. تحقق من الوجهة بشكل مستقل؛ ليس هذا حكماً بالاحتيال.");
  if (!official && /(?:credential|password|otp|card)[-]?(?:collector|harvest|capture|steal)|(?:collector|harvest|capture)[-]?(?:credential|password|otp)/i.test(core) && hasSensitive) add("credential_collection", 60, "The host describes credential collection together with an account action; possible credential theft.", "يصف المضيف جمع بيانات الدخول مع إجراء للحساب؛ احتمال سرقة بيانات الدخول.");
  if (!official && hasSensitive) add("sensitive_path", 20, "The URL contains login, payment or account-related patterns on an unconfirmed domain; these words alone do not prove fraud.", "يتضمن الرابط أنماط تسجيل أو دفع أو حساب على نطاق غير مؤكد؛ هذه الكلمات وحدها لا تثبت الاحتيال.");
  if (!official) {
    for (const ref of officialReferences) {
      // A complete sequence of DNS labels, never a substring such as u.ae inside du.ae.
      const fullReference = normalized === ref.domain || normalized.startsWith(`${ref.domain}.`) || normalized.endsWith(`.${ref.domain}`) || normalized.includes(`.${ref.domain}.`);
      const aliases = ref.aliases;
      const impersonates = aliases.some(alias => {
        const labelTokens = normalized.split(/[.-]/);
        const compact = core.replace(/-/g, "");
        const exact = labelTokens.includes(alias) || core === alias;
        const position = compact.indexOf(alias);
        const compound = alias.length >= 4 && position >= 0 && (sensitive.test(compact.replace(alias, "")) || identityContext.test(compact.replace(alias, "")));
        const typo = alias.length >= 5 && core.length >= 5 && levenshtein(core.replace(/-/g, ""), alias) <= 1;
        return compound || typo || (exact && (hasSensitive || identityContext.test(core)));
      });
      if ((fullReference || impersonates) && !editorial) {
        add("brand_impersonation", 60, `The domain resembles ${ref.name} but is outside ${ref.domain}. Possible impersonation, not confirmed fraud.`, `يشبه النطاق ${ref.ar} لكنه خارج ${ref.domain}. انتحال محتمل وليس احتيالاً مؤكداً.`);
        if (unicode !== host && normalized !== unicode) add("homoglyph", 15, "Unicode characters visually resemble letters in an official brand.", "تشبه أحرف Unicode بصرياً أحرفاً في علامة رسمية.");
        break;
      }
    }
    if (/(?:^|\.)gov\.ae\./.test(host) || /(?:^|[.-])(?:uae-government|uaegov|traffic-fines)(?:[.-]|$)/.test(host)) add("government_lure", 60, "The domain presents a UAE government or traffic-fine identity outside the documented official references; confirm independently.", "يعرض النطاق هوية حكومية إماراتية أو مخالفات مرورية خارج المراجع الرسمية الموثقة؛ تحقق بشكل مستقل.");
  }
  if (!official && hasSensitive && !editorial && officialReferences.some(ref => decodeLayers(url.pathname).toLowerCase().includes(ref.domain))) add("brand_path_lure", 50, "An official domain name appears in an account-action path, not in the actual host. Confirm the identity independently.", "يظهر اسم نطاق رسمي في مسار إجراء للحساب وليس في المضيف الفعلي. تحقق من الهوية بشكل مستقل.");
  if (!official && !signals.some(s => s.code === "brand_impersonation") && officialReferences.some(ref => ref.aliases.some(alias => normalized.split(/[.-]/).includes(alias)))) add("brand_mention", 15, "The host mentions an official brand outside its domain; a brand mention alone does not establish impersonation.", "يذكر المضيف علامة رسمية خارج نطاقها؛ ذكر العلامة وحده لا يثبت الانتحال.");
  for (const [key, dest] of url.searchParams) {
    let decoded = decodeLayers(dest);
    if (!/^(?:url|u|to|target|redirect|redirect_uri|redirecturl|next|continue|return|returnurl|destination)$/i.test(key)) continue;
    if (/^[a-z\d+/_=-]{16,2000}$/i.test(decoded)) { try { const text = atob(decoded.replace(/-/g, "+").replace(/_/g, "/")); if (/^https?:\/\//i.test(text)) decoded = text; } catch { /* Invalid base64 is not a destination. */ } }
    if (!/^(?:https?:)?\/\//i.test(decoded)) continue;
    try {
      const nested = new URL(decoded, url);
      if (nested.hostname !== host) {
        add("redirect_parameter", 20, "A URL parameter points to another host. This is a potential redirect, not an observed redirect chain.", "يشير معامل في الرابط إلى مضيف آخر. هذا تحويل محتمل وليس سلسلة تحويلات تمت ملاحظتها.");
        if (depth < 3 && analyzeUrl(nested.href, depth + 1).classification === "suspicious") add("nested_suspicion", 60, "A nested destination contains suspicious URL evidence. The destination was analyzed locally, not opened or verified as a redirect.", "تتضمن وجهة متداخلة أدلة اشتباه في الرابط. حُللت محلياً ولم تُفتح أو يُتحقق منها كتحويل فعلي.");
      }
    } catch { /* No destination request. */ }
  }
  const weights = signals.map(s => s.weight).sort((a,b) => b-a);
  const riskScore = Math.min(100, (weights[0] ?? 0) + weights.slice(1).reduce((sum,w) => sum + Math.round(w / 3), 0));
  return { valid: true, host, domain: parts.domain, suffix: parts.publicSuffix, officialDomain: official?.domain ?? null, signals, riskScore, classification: riskScore >= 50 ? "suspicious" : riskScore >= 20 ? "caution" : "low", networkEligible: !isBlockedHost(host) && !isIp && !!parts.domain && !url.username && !url.password && ["", "443", "80"].includes(url.port) };
}
