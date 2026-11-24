import type { Channel, ChannelType, Organization, OrgType } from "@/lib/domain/types";
import { detectLookalike, hostFromUrl, isSameOrSubdomain, normalizeHost } from "./lookalike";
import type { Relationship } from "@/lib/organizations/relationship";

export interface RegistrationInput {
  nameEn: string;
  nameAr: string;
  type: OrgType;
  domains: string[];
  contactEmail: string;
  channels: Array<{ type: ChannelType; value: string }>;
  relationship?: Relationship | undefined;
}

export type RegistrationError =
  | { field: "nameEn" | "nameAr" | "contactEmail" | "domains" | "channels"; code: "required" | "invalid" }
  | { field: "domains"; code: "taken"; domain: string; orgId: string }
  | { field: "domains"; code: "lookalike"; domain: string; target: string; orgId: string }
  | { field: "channels"; code: "outside_domains"; index: number }
  | { field: "channels"; code: "empty_value"; index: number };

const DOMAIN_RE = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseDomains(raw: string): string[] {
  return [...new Set(raw.split(/[\s,،;]+/).map((d) => normalizeHost(d)).filter(Boolean))];
}

/**
 * Validates a registration. A new domain that imitates an already-registered one is
 * rejected, so the registry itself cannot be used to legitimise a lookalike.
 */
export function validateRegistration(input: RegistrationInput, existing: Organization[]): RegistrationError[] {
  const errors: RegistrationError[] = [];
  if (input.nameEn.trim().length < 3) errors.push({ field: "nameEn", code: "required" });
  if (input.nameAr.trim().length < 2) errors.push({ field: "nameAr", code: "required" });
  if (!EMAIL_RE.test(input.contactEmail.trim())) errors.push({ field: "contactEmail", code: "invalid" });

  if (input.domains.length === 0) errors.push({ field: "domains", code: "required" });
  else if (input.domains.some((d) => !DOMAIN_RE.test(d))) errors.push({ field: "domains", code: "invalid" });

  for (const d of input.domains) {
    for (const org of existing) {
      for (const reg of org.domains) {
        if (isSameOrSubdomain(d, reg) || isSameOrSubdomain(reg, d)) {
          errors.push({ field: "domains", code: "taken", domain: d, orgId: org.id });
        } else if (detectLookalike(d, reg)) {
          errors.push({ field: "domains", code: "lookalike", domain: d, target: reg, orgId: org.id });
        }
      }
    }
  }

  if (input.channels.length === 0) errors.push({ field: "channels", code: "required" });
  input.channels.forEach((c, index) => {
    const value = c.value.trim();
    if (!value) {
      errors.push({ field: "channels", code: "empty_value", index });
      return;
    }
    let host: string | undefined;
    if (c.type === "email") host = value.includes("@") ? normalizeHost(value.split("@").pop() ?? "") : undefined;
    if (c.type === "website") host = hostFromUrl(value);
    if ((c.type === "email" || c.type === "website") && (!host || !input.domains.some((d) => isSameOrSubdomain(host, d)))) {
      errors.push({ field: "channels", code: "outside_domains", index });
    }
  });
  return errors;
}

export function toChannels(channels: RegistrationInput["channels"], idFor: () => string): Channel[] {
  return channels.map((c) => ({ id: idFor(), type: c.type, value: c.value.trim(), status: "pending" }));
}
