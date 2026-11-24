import { z } from "zod";
import ipaddr from "ipaddr.js";
import { analyzeUrl, isBlockedHost } from "./analyze";
import { boundedJson } from "./bounded-json.server";
import type { DnsOutcome } from "./intelligence";
const answerSchema = z.object({ Status: z.number(), AD: z.boolean().optional(), Answer: z.array(z.object({ name: z.string().max(253), type: z.number(), data: z.string().max(1024) })).max(100).optional() });
const asn = z.union([z.number().int().positive().max(4294967295), z.string().regex(/^[1-9]\d{0,9}$/).transform(Number).refine(n => n <= 4294967295)]);
const networkSchema = z.object({ status: z.literal("ok"), data: z.object({ asns: z.array(asn).max(20), prefix: z.string().max(100) }) });
/** Resolver observation, NOT connection pinning, website access, or proof of ownership. */
export async function lookupDns(domain: string, request: typeof fetch = fetch, now = Date.now()): Promise<DnsOutcome> {
  const analysis = analyzeUrl(domain);
  if (!analysis.networkEligible || analysis.host !== domain) return { status: "unavailable", reason: "blocked" };
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 5000);
  const options: RequestInit = { redirect: "manual", credentials: "omit", referrerPolicy: "no-referrer", headers: { Accept: "application/json" }, signal: controller.signal };
  try {
    // Five resolver requests leave one invocation slot for concurrent RDAP.
    const records = await Promise.all(["A", "AAAA", "MX", "NS", "CAA"].map(async type => answerSchema.parse(await boundedJson(await request(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}&edns_client_subnet=0.0.0.0%2F0`, options)))));
    if (records.some(r => ![0, 3].includes(r.Status))) return { status: "unavailable", reason: "service" };
    const answers = records.flatMap(r => r.Answer ?? []);
    const addresses = [...new Set(answers.filter(a => [1, 28].includes(a.type) && ipaddr.isValid(a.data)).map(a => a.data))];
    const aliases = [...new Set(answers.filter(a => a.type === 5 && /^[a-z\d.-]+\.?$/i.test(a.data)).map(a => a.data.replace(/\.$/, "")))];
    const observedRecords = answers.filter(a => [1, 2, 5, 15, 28, 257].includes(a.type)).filter((a, i, all) => all.findIndex(b => b.name === a.name && b.type === a.type && b.data === a.data) === i);
    if (!observedRecords.length) return { status: "unavailable", reason: "no_records" };
    const nonPublicAnswers = addresses.some(isBlockedHost);
    const publicAddress = addresses.find(a => !isBlockedHost(a));
    let network: { asns: number[]; prefix: string; source: string } | null = null;
    if (publicAddress && !nonPublicAnswers) {
      try {
        const source = `https://stat.ripe.net/data/network-info/data.json?resource=${encodeURIComponent(publicAddress)}`;
        const info = networkSchema.parse(await boundedJson(await request(source, options)));
        const [prefixAddress, mask] = info.data.prefix.split("/");
        if (prefixAddress && mask && ipaddr.isValid(prefixAddress) && /^\d{1,3}$/.test(mask)) {
          const address = ipaddr.parse(publicAddress); const prefix = ipaddr.parse(prefixAddress); const bits = Number(mask);
          if (address.kind() === prefix.kind() && bits <= (address.kind() === "ipv4" ? 32 : 128) && address.match(prefix, bits)) network = { ...info.data, source };
        }
      } catch { /* Routing metadata may be unavailable independently of DNS. */ }
    }
    return { status: "available", domain, source: `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, checkedAt: new Date(now).toISOString(), dnssecValidated: records.every(r => r.AD === true), addresses, aliases, records: observedRecords, nonPublicAnswers, network };
  } catch { return { status: "unavailable", reason: "service" }; }
  finally { clearTimeout(timer); }
}