import type { ChannelType, Organization, TrustState } from "@/lib/domain/types";
import { heuristicAnalyzer, type ContentAnalyzer } from "./content-analysis";
import { type BlockedIndicator, normalizeIndicator } from "./blocklist";
import { detectLookalike, detectLookalikeHandle, hostFromUrl, isSameOrSubdomain, normalizeHost } from "./lookalike";
import { activeChannel, channelKey } from "./channels";
import { analyzeUrl } from "./url/analyze";
import { classifyUrlMl } from "./url/ml";
import { indicatorsFor } from "./reporting";
import { normalizeUaePhone } from "./uae-phone";

export type ReasonCode =
  | "url_technical"
  | "sender_registered"
  | "domain_registered"
  | "channel_not_active"
  | "org_verified"
  | "org_pending"
  | "org_suspended"
  | "no_match"
  | "link_mismatch"
  | "link_registered_sender_unknown"
  | "claimed_unregistered"
  | "lookalike_domain"
  | "lookalike_sender"
  | "blocklisted"
  | "content_urgency"
  | "content_credentials"
  | "content_payment"
  | "caution";

export type ReasonTone = "positive" | "neutral" | "warning" | "negative";

export interface Reason {
  code: ReasonCode;
  tone: ReasonTone;
  /** True when this reason is evidence of impersonation (required for "suspicious"). */
  evidence?: boolean | undefined;
  params: Record<string, string | number>;
}

export interface MessageInput {
  channel: ChannelType;
  sender: string;
  url?: string | undefined;
  body: string;
  claimedOrgId?: string | undefined;
}

export interface Assessment {
  state: TrustState;
  riskScore: number;
  reasons: Reason[];
  matchedOrgId?: string | undefined;
}

export interface VerificationContext {
  organizations: Organization[];
  blocklist: BlockedIndicator[];
  analyzer?: ContentAnalyzer;
}

const cleanHandle = (v: string) => v.trim().toLowerCase().replace(/\s+/g, "");

function senderDomainOf(channel: ChannelType, sender: string): string | undefined {
  if (channel === "email") {
    const at = sender.lastIndexOf("@");
    return at >= 0 ? normalizeHost(sender.slice(at + 1)) : undefined;
  }
  if (channel === "website") return hostFromUrl(sender);
  return undefined;
}

export function findSenderOrg(orgs: Organization[], channel: ChannelType, sender: string) {
  const value = channelKey(channel, sender);
  return orgs.find((o) => o.channels.some((c) => activeChannel(c) && c.type === channel && channelKey(c.type, c.value) === value));
}

export function findDomainOrg(orgs: Organization[], host: string | undefined) {
  if (!host) return undefined;
  return orgs.find((o) => o.channels.some((c) => activeChannel(c) && c.type === "website" && channelKey(c.type, c.value) === normalizeHost(host)));
}

/**
 * Assesses a message against the organization registry.
 * Rule: "suspicious" requires at least one piece of evidence (lookalike, blocklisted
 * indicator, or a false identity claim combined with a sensitive request).
 * Anything not provably registered and verified is "unverified" — never fraud by default.
 */
function assessRegistryMessage(input: MessageInput, ctx: VerificationContext): Assessment {
  const analyzer = ctx.analyzer ?? heuristicAnalyzer;
  const orgs = ctx.organizations;
  const reasons: Reason[] = [];
  const nameOf = (o: Organization) => o.id;

  const senderOrg = findSenderOrg(orgs, input.channel, input.sender);
  const urlHost = hostFromUrl(input.url);
  const urlOrg = findDomainOrg(orgs, urlHost);
  const senderDomain = senderDomainOf(input.channel, input.sender);

  // 1. Blocklisted indicators from escalated / confirmed cases
  const candidateKey = (value: string) => normalizeUaePhone(value) ?? normalizeIndicator(value);
  const blockedValues = new Map(ctx.blocklist.map((b) => [candidateKey(b.value), b.caseId]));
  const candidates = [...indicatorsFor(input).map(indicator => indicator.value), input.sender, senderDomain, urlHost, input.url].filter((v): v is string => !!v);
  const seen = new Set<string>();
  for (const value of candidates) {
    const key = candidateKey(value);
    const caseId = blockedValues.get(key);
    if (caseId && !seen.has(caseId)) {
      seen.add(caseId);
      reasons.push({ code: "blocklisted", tone: "negative", evidence: true, params: { value, caseId } });
    }
  }

  // 2. Lookalike domains (sender domain and link domain)
  const checkDomain = (host: string | undefined) => {
    if (!host || findDomainOrg(orgs, host) || orgs.some((o) => o.domains.some((d) => isSameOrSubdomain(host, d)) || o.channels.some((c) => c.type === "website" && channelKey(c.type, c.value) === host))) return;
    for (const org of orgs) {
      for (const d of org.domains) {
        const m = detectLookalike(host, d);
        if (m) {
          reasons.push({
            code: "lookalike_domain",
            tone: "negative",
            evidence: true,
            params: { domain: host, target: d, org: nameOf(org), technique: m.technique, similarity: m.similarity },
          });
          return;
        }
      }
    }
  };
  checkDomain(senderDomain);
  if (urlHost !== senderDomain) checkDomain(urlHost);

  // 3. Lookalike SMS sender IDs / social handles
  if (!senderOrg && (input.channel === "sms" || input.channel === "social")) {
    outer: for (const org of orgs) {
      for (const c of org.channels) {
        if (c.type !== input.channel || !activeChannel(c) || channelKey(c.type, c.value) === channelKey(input.channel, input.sender)) continue;
        const sim = detectLookalikeHandle(input.sender, c.value);
        if (sim !== null) {
          reasons.push({
            code: "lookalike_sender",
            tone: "negative",
            evidence: true,
            params: { value: input.sender, target: c.value, org: nameOf(org), similarity: sim },
          });
          break outer;
        }
      }
    }
  }

  // 4. Content signals
  const content = analyzer.analyze(`${input.body} ${input.url ?? ""}`);
  const sensitiveRequest = content.some((s) => s.code === "content_credentials" || s.code === "content_payment");

  // 5. False identity claim
  const claimed = input.claimedOrgId ? orgs.find((o) => o.id === input.claimedOrgId) : undefined;
  if (claimed && senderOrg?.id !== claimed.id) {
    reasons.push({
      code: "claimed_unregistered",
      tone: sensitiveRequest ? "negative" : "warning",
      evidence: sensitiveRequest,
      params: { org: nameOf(claimed), value: input.sender },
    });
  }

  const evidenceCount = reasons.filter((r) => r.evidence).length;
  const contentReasons: Reason[] = content.map((s) => ({ code: s.code, tone: "warning", params: { matched: s.matched } }));

  if (evidenceCount > 0) {
    const risk = Math.min(99, 60 + evidenceCount * 10 + content.length * 5);
    return { state: "suspicious", riskScore: risk, reasons: [...reasons, ...contentReasons], matchedOrgId: claimed?.id };
  }

  const unverified = (extra: Reason[]): Assessment => ({
    state: "unverified",
    riskScore: Math.min(55, 20 + content.length * 10 + (claimed ? 10 : 0)),
    reasons: [...extra, ...reasons, ...contentReasons, { code: "caution", tone: "neutral", params: {} }],
    matchedOrgId: senderOrg?.id ?? urlOrg?.id,
  });

  if (senderOrg) {
    const base: Reason = {
      code: "sender_registered",
      tone: "positive",
      params: { value: input.sender, channel: input.channel, org: nameOf(senderOrg) },
    };
    if (senderOrg.status === "pending") return unverified([base, { code: "org_pending", tone: "warning", params: { org: nameOf(senderOrg) } }]);
    if (senderOrg.status === "suspended") return unverified([base, { code: "org_suspended", tone: "warning", params: { org: nameOf(senderOrg) } }]);
    if (urlHost && urlOrg?.id !== senderOrg.id) {
      return unverified([base, { code: "link_mismatch", tone: "warning", params: { domain: urlHost, org: nameOf(senderOrg) } }]);
    }
    const positive: Reason[] = [base];
    if (urlHost) positive.push({ code: "domain_registered", tone: "positive", params: { domain: urlHost, org: nameOf(senderOrg) } });
    positive.push({ code: "org_verified", tone: "positive", params: { org: nameOf(senderOrg) } });
    return { state: "verified", riskScore: 5, reasons: positive, matchedOrgId: senderOrg.id };
  }

  if (urlOrg && urlHost) {
    return unverified([
      { code: "link_registered_sender_unknown", tone: "warning", params: { domain: urlHost, org: nameOf(urlOrg), value: input.sender } },
    ]);
  }

  const inactiveOrg = orgs.find((o) => o.channels.some((c) => c.type === input.channel && !activeChannel(c) && channelKey(c.type, c.value) === channelKey(input.channel, input.sender)));
  if (inactiveOrg) return unverified([{ code: "channel_not_active", tone: "warning", params: { value: input.sender, org: inactiveOrg.id } }]);

  return unverified([{ code: "no_match", tone: "neutral", params: {} }]);
}

/** Technical risk augments registry checks but never grants channel verification. */
export function assessMessage(input: MessageInput, ctx: VerificationContext): Assessment {
  const base = assessRegistryMessage(input, ctx);
  const url = input.url || (input.channel === "website" ? input.sender : "");
  if (!url.trim()) return base;
  const technical = analyzeUrl(url);
  const ml = technical.valid ? classifyUrlMl(url) : null;
  const reasons: Reason[] = technical.signals.filter(signal => signal.weight >= 50).map(signal => ({
    code: "url_technical", tone: "negative", evidence: true,
    params: { en: signal.en, ar: signal.ar },
  }));
  if (ml?.flagged) reasons.push({ code: "url_technical", tone: "warning", evidence: false, params: {
    en: "The local supervised URL model flags possible phishing. This is an uncalibrated statistical warning, not confirmed fraud or a channel-verification fact.",
    ar: "يشير نموذج الروابط المحلي المدرّب إلى تصيّد محتمل. هذا تحذير إحصائي غير معاير، وليس احتيالاً مؤكداً أو حقيقة توثيق للقناة.",
  } });
  return { ...base, state: technical.classification === "suspicious" ? "suspicious" : base.state,
    riskScore: Math.max(base.riskScore, technical.riskScore, ml?.riskScore ?? 0), reasons: [...base.reasons, ...reasons] };
}
