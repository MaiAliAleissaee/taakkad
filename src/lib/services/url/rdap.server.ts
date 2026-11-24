import { z } from "zod";
import { analyzeUrl } from "./analyze";
import type { RdapOutcome } from "./intelligence";

/** Static IANA-bootstrap providers checked 2026-11-24. No user-controlled server origin. */
const providers: Record<string, string> = {
  com: "https://rdap.verisign.com/com/v1/domain/",
  net: "https://rdap.verisign.com/net/v1/domain/",
  org: "https://rdap.publicinterestregistry.org/rdap/domain/",
};
const event = z.object({ eventAction: z.string().max(100), eventDate: z.string().max(100) });
const entity = z.object({ roles: z.array(z.string()).optional(), vcardArray: z.array(z.unknown()).optional() });
const record = z.object({ objectClassName: z.literal("domain"), ldhName: z.string(), events: z.array(event).max(100).optional(), entities: z.array(entity).max(100).optional(), status: z.array(z.string().max(120)).max(50).optional() });
const MAX_BYTES = 131072;
export async function lookupRdap(domain: string, request: typeof fetch = fetch, now = Date.now()): Promise<RdapOutcome> {
  const analyzed = analyzeUrl(domain);
  if (!analyzed.networkEligible || analyzed.host !== domain || analyzed.domain !== domain) return { status: "unavailable", reason: "blocked" };
  const provider = providers[analyzed.suffix ?? ""];
  if (!provider) return { status: "unavailable", reason: "unsupported" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const source = `${provider}${encodeURIComponent(domain)}`;
    const response = await request(source, { redirect: "manual", credentials: "omit", referrerPolicy: "no-referrer", headers: { Accept: "application/rdap+json, application/json" }, signal: controller.signal });
    if (response.status === 429) { await response.body?.cancel(); return { status: "unavailable", reason: "limited" }; }
    if (response.status === 404) { await response.body?.cancel(); return { status: "unavailable", reason: "not_found" }; }
    if (!response.ok || !response.body || !/(?:application\/rdap\+json|application\/json)/i.test(response.headers.get("content-type") ?? "")) { await response.body?.cancel(); return { status: "unavailable", reason: "service" }; }
    if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) { await response.body.cancel(); return { status: "unavailable", reason: "service" }; }
    const reader = response.body.getReader(); let size = 0; let text = ""; const decoder = new TextDecoder();
    try {
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > MAX_BYTES) { await reader.cancel(); return { status: "unavailable", reason: "service" }; }
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
    } finally { reader.releaseLock(); }
    const data = record.parse(JSON.parse(text));
    if (data.ldhName.toLowerCase() !== domain) return { status: "unavailable", reason: "service" };
    const dates = (data.events ?? []).filter(e => e.eventAction === "registration").map(e => Date.parse(e.eventDate)).filter(date => Number.isFinite(date) && date <= now && date >= 0).sort((a,b) => a-b);
    const registration = dates[0];
    const registrarEntity = data.entities?.find(e => e.roles?.includes("registrar"));
    const vcard = registrarEntity?.vcardArray?.[1];
    let registrar: string | null = null;
    if (Array.isArray(vcard)) {
      for (const field of vcard) if (Array.isArray(field) && field[0] === "fn" && typeof field[3] === "string") registrar = field[3].slice(0, 200);
    }
    return { status: "available", domain, source, checkedAt: new Date(now).toISOString(), registeredAt: registration === undefined ? null : new Date(registration).toISOString(), ageDays: registration === undefined ? null : Math.floor((now - registration) / 86400000), registrar, domainStatus: data.status ?? [] };
  } catch { return { status: "unavailable", reason: controller.signal.aborted ? "timeout" : "service" }; }
  finally { clearTimeout(timer); }
}
