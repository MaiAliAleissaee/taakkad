import type { LookalikeTechnique } from "@/lib/domain/types";

/** Words commonly bolted onto a brand name to build a convincing fake domain. */
export const LURE_KEYWORDS = [
  "secure", "login", "verify", "verification", "update", "account", "support", "pay", "payment",
  "renew", "renewal", "fines", "fine", "delivery", "online", "portal", "help", "alert", "service",
  "services", "gov", "official", "careers", "auth", "bank", "customs", "track", "refund",
];

const SECOND_LEVEL = new Set(["gov", "co", "com", "org", "net", "ac", "edu", "mil"]);

const HOMOGLYPHS: Array<[RegExp, string]> = [
  [/rn/g, "m"], [/vv/g, "w"], [/0/g, "o"], [/1/g, "l"], [/3/g, "e"], [/5/g, "s"],
  [/\$/g, "s"], [/@/g, "a"], [/4/g, "a"], [/7/g, "t"],
];

export function normalizeHost(input: string): string {
  let host = input.trim().toLowerCase();
  if (host.includes("://")) {
    try {
      host = new URL(host).hostname;
    } catch {
      /* keep raw */
    }
  }
  host = host.split("/")[0] ?? host;
  return host.replace(/^www\./, "").replace(/\.$/, "");
}

export function hostFromUrl(url: string | undefined): string | undefined {
  if (!url || !url.trim()) return undefined;
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return normalizeHost(u.hostname);
  } catch {
    return undefined;
  }
}

/** Splits a host into its brand "core" label and public suffix (e.g. alnoor + gov.example). */
export function splitHost(host: string) {
  const parts = normalizeHost(host).split(".").filter(Boolean);
  if (parts.length < 2) {
    const core = parts[0] ?? "";
    return { core, suffix: "", registrable: core };
  }
  const suffixParts = [parts.pop() as string];
  const last = parts[parts.length - 1];
  if (parts.length >= 2 && last && SECOND_LEVEL.has(last)) suffixParts.unshift(parts.pop() as string);
  const core = parts[parts.length - 1] ?? "";
  const suffix = suffixParts.join(".");
  return { core, suffix, registrable: `${core}.${suffix}` };
}

export function isSameOrSubdomain(candidate: string, registered: string): boolean {
  const c = normalizeHost(candidate);
  const r = normalizeHost(registered);
  return c === r || c.endsWith(`.${r}`);
}

export function normalizeGlyphs(value: string): string {
  let out = value.toLowerCase();
  for (const [pattern, replacement] of HOMOGLYPHS) out = out.replace(pattern, replacement);
  return out;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0] ?? 0;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min((prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + 1, diagonal + cost);
      diagonal = temp;
    }
  }
  return prev[b.length] ?? 0;
}

export function similarityPercent(a: string, b: string): number {
  const max = Math.max(a.length, b.length) || 1;
  return Math.round((1 - levenshtein(a, b) / max) * 100);
}

export interface LookalikeMatch {
  technique: LookalikeTechnique;
  similarity: number;
  targetDomain: string;
}

/**
 * Returns a match when `candidate` imitates `registered` without belonging to it.
 * Returns null for the genuine domain, its subdomains, or unrelated domains.
 */
export function detectLookalike(candidate: string, registered: string): LookalikeMatch | null {
  if (!candidate || !registered) return null;
  if (isSameOrSubdomain(candidate, registered)) return null;
  const c = splitHost(candidate);
  const r = splitHost(registered);
  if (!c.core || !r.core) return null;

  const rCompact = normalizeGlyphs(r.core).replace(/-/g, "");
  const rawCompact = c.core.replace(/-/g, "");
  const similarity = similarityPercent(rawCompact, r.core.replace(/-/g, ""));

  if (c.core === r.core) {
    return c.registrable !== r.registrable
      ? { technique: "tld_swap", similarity: 95, targetDomain: registered }
      : null;
  }

  const normalized = normalizeGlyphs(c.core);
  const hadSubstitution = normalized !== c.core.toLowerCase();
  const tokens = normalized.split("-").filter(Boolean);
  const kept = tokens.filter((t) => !LURE_KEYWORDS.includes(t));
  const hadKeyword = kept.length < tokens.length && kept.length > 0;
  const keptJoined = kept.join("");

  if (keptJoined === rCompact) {
    const technique: LookalikeTechnique =
      hadSubstitution && hadKeyword ? "combo" : hadSubstitution ? "substitution" : hadKeyword ? "keyword" : "typo";
    return { technique, similarity: Math.max(similarity, 60), targetDomain: registered };
  }

  if (rCompact.length >= 5 && levenshtein(keptJoined, rCompact) <= 2) {
    return {
      technique: hadKeyword ? "combo" : "typo",
      similarity: Math.max(similarity, 60),
      targetDomain: registered,
    };
  }
  return null;
}

/** Compares SMS sender IDs or social handles that imitate a registered one. */
export function detectLookalikeHandle(candidate: string, registered: string): number | null {
  const clean = (v: string) => v.trim().toLowerCase().replace(/^@/, "").replace(/[-_\s.]/g, "");
  const c = clean(candidate);
  const r = clean(registered);
  if (!c || !r || c === r) return null;
  const nc = normalizeGlyphs(c);
  const nr = normalizeGlyphs(r);
  if (nc === nr) return 90;
  if (r.length >= 5 && levenshtein(nc, nr) <= 2) return similarityPercent(nc, nr);
  const stripped = LURE_KEYWORDS.reduce((acc, k) => acc.replace(k, ""), nc);
  if (stripped !== nc && stripped.length >= 4 && (stripped === nr || nr.startsWith(stripped))) return 75;
  return null;
}

/** Generates plausible lookalike permutations for a simulated monitoring scan. */
export function generateLookalikeCandidates(domain: string, limit = 6): string[] {
  const { core, suffix } = splitHost(domain);
  if (!core) return [];
  const out = new Set<string>();
  const subs: Array<[string, string]> = [["o", "0"], ["l", "1"], ["i", "1"], ["e", "3"], ["m", "rn"], ["a", "4"]];
  for (const [from, to] of subs) {
    const idx = core.indexOf(from);
    if (idx >= 0) out.add(`${core.slice(0, idx)}${to}${core.slice(idx + from.length)}.example`);
  }
  for (const kw of ["secure", "verify", "login", "support", "pay"]) out.add(`${core}-${kw}.example`);
  if (core.length > 5) out.add(`${core.slice(0, -2)}${core.slice(-1)}${core.slice(-2, -1)}.${suffix || "example"}`);
  return [...out].filter((d) => detectLookalike(d, domain)).slice(0, limit);
}
