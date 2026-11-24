import { lookupDns } from "@/lib/services/url/dns.server";
import { lookupRdap } from "@/lib/services/url/rdap.server";
import { domainSchema, observationSchema, type Observation } from "./schema";
/** Only fixed resolver/registry/routing origins receive the bare hostname, never the target website. */
export async function verifyDomain(domain: string, request: typeof fetch = fetch, now = Date.now()): Promise<Observation> {
  domainSchema.parse(domain);
  const [dns, rdap] = await Promise.all([lookupDns(domain, request, now), lookupRdap(domain, request, now)]);
  return observationSchema.parse({ checkedAt: new Date(now).toISOString(), dns: dns.status === "available" ? "resolved" : dns.reason === "no_records" ? "no_records" : "unavailable", dnsSource: `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, records: dns.status === "available" ? dns.records : [], addresses: dns.status === "available" ? dns.addresses : [], dnssecValidated: dns.status === "available" && dns.dnssecValidated, nonPublicAnswers: dns.status === "available" && dns.nonPublicAnswers, asns: dns.status === "available" ? dns.network?.asns ?? [] : [], networkSource: dns.status === "available" ? dns.network?.source ?? null : null, registration: rdap.status === "available" ? "confirmed" : rdap.reason === "unsupported" ? "unsupported" : rdap.reason === "not_found" ? "not_found" : "unavailable", rdapSource: rdap.status === "available" ? rdap.source : null, registeredAt: rdap.status === "available" ? rdap.registeredAt : null, ageDays: rdap.status === "available" ? rdap.ageDays : null });
}
