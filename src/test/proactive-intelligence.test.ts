import { describe, expect, it } from "vitest";
import { commandSchema, domainSchema, importSchema, isAnalyst, recordSchema } from "@/lib/intelligence/schema";
import { correlate, generateCandidates, mergeRecords, priority } from "@/lib/intelligence/engine";
import { verifyDomain } from "@/lib/intelligence/metadata.server";
import { createSeedState } from "./fixtures/security-seed";
const now = Date.parse("2026-11-24T09:30:00Z");
const record = recordSchema.parse({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", title: "Review lead", targetDomain: "uaepass.ae", domain: "uaepass-login.com", source: "generated", sourceReference: "generator", sourceObservedAt: null, notes: "", synthetic: false, indicators: [{ type: "phone", value: "+971 50 000 0000" }], createdAt: new Date(now).toISOString(), observation: null });
const dns = { Status: 0, AD: true, Answer: [{ name: "uaepass-login.com.", type: 1, data: "8.8.8.8" }] };
const rdap = { objectClassName: "domain", ldhName: "uaepass-login.com", events: [{ eventAction: "registration", eventDate: "2026-11-20T00:00:00Z" }] };
function transport(calls: string[], registered = true, dnsPresent = true): typeof fetch {
  return (async input => { const url = String(input); calls.push(url); if (url.startsWith("https://dns.google/")) return Response.json(dnsPresent ? dns : { Status: 3 }); if (url.startsWith("https://rdap.verisign.com/")) return registered ? Response.json(rdap) : new Response(null, { status: 404 }); if (url.startsWith("https://stat.ripe.net/")) return Response.json({ status: "ok", data: { asns: [15169], prefix: "8.8.8.0/24" } }); throw new Error("Unexpected origin"); }) as typeof fetch;
}
describe("proactive intelligence rules", () => {
  it("restricts the module to analysts, not officers or supervisors alone", () => { expect(isAnalyst(["security_analyst"])).toBe(true); expect(isAnalyst(["organization_verification_officer"])).toBe(false); expect(isAnalyst(["security_supervisor"])).toBe(false); expect(isAnalyst(["HAM1234"])).toBe(false); });
  it("generates unique candidates for UAE banks, UAE PASS, TAMM and fine services without claiming discovery", () => { for (const target of ["adcb.com", "bankfab.com", "uaepass.ae", "tamm.abudhabi", "moi.gov.ae", "adpolice.gov.ae"]) { const domains = generateCandidates(target); expect(domains.length).toBe(target === "moi.gov.ae" ? 20 : 24); expect(new Set(domains).size).toBe(domains.length); expect(domains).not.toContain(target); } });
  it("requires real registrable domains and rejects local hosts, IPs, credentials and paths", () => { for (const value of ["localhost", "127.0.0.1", "192.168.0.1", "foo.example", "example.com/path", "https://example.com", "user:pass@example.com", "sub.example.com"]) expect(domainSchema.safeParse(value).success).toBe(false); expect(domainSchema.safeParse("example.com").success).toBe(true); });
  it("requires explicit source attribution and synthetic flag on imports", () => { expect(importSchema.safeParse([{ title: "Lead", targetDomain: "uaepass.ae", source: "advertisement", indicators: record.indicators }]).success).toBe(false); expect(importSchema.safeParse([{ title: "Lead", targetDomain: "uaepass.ae", source: "advertisement", sourceReference: "Captured advertisement reference", synthetic: true, indicators: record.indicators }]).success).toBe(true); });
  it("saves DEMO-001 with a reserved .example domain only as an explicit fictional observation", () => {
    const row = { title: "Fictional UAE PASS observation", targetDomain: "uaepass.ae", domain: "uaepass-demo.example", source: "manual", sourceReference: "DEMO-001", synthetic: true, indicators: [{ type: "domain", value: "uaepass-demo.example" }] };
    const parsed = importSchema.parse([row]);
    expect(parsed[0]?.domain).toBe("uaepass-demo.example");
    expect(parsed[0]?.sourceReference).toBe("DEMO-001");
    expect(recordSchema.safeParse({ ...parsed[0], id: record.id, createdAt: record.createdAt, observation: null }).success).toBe(true);
    expect(importSchema.safeParse([{ ...row, synthetic: false }]).success).toBe(false);
    expect(domainSchema.safeParse(row.domain).success).toBe(false);
  });
  it("keeps malformed and unsafe domain inputs invalid even with the fictional checkbox", () => {
    for (const domain of ["localhost", "127.0.0.1", "https://uaepass-demo.example", "uaepass-demo.example/path", "-bad.example", "a..example"]) {
      expect(importSchema.safeParse([{ title: "Demo", targetDomain: "uaepass.ae", domain, source: "manual", sourceReference: "DEMO-001", synthetic: true, indicators: record.indicators }]).success).toBe(false);
    }
  });
  it("rejects more than 50 imported rows", () => { const row = { title: "Lead", targetDomain: "uaepass.ae", source: "manual", sourceReference: "Source", synthetic: true, indicators: record.indicators }; expect(importSchema.safeParse(Array.from({ length: 51 }, () => row)).success).toBe(false); });
  it("limits each verified batch to four domains", () => expect(commandSchema.safeParse({ action: "verify", ids: Array.from({ length: 5 }, () => record.id), revision: 0 }).success).toBe(false));
  it("does not call a generated candidate an evidence-backed warning", () => { expect(priority(record).earlyWarning).toBe(false); expect(priority(record).risk).toBe("low"); });
  it("is idempotent without deleting existing records", () => { expect(mergeRecords([record], [{ ...record, id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb" }])).toHaveLength(1); expect(mergeRecords([record], [{ ...record, sourceReference: "Second source" }])).toHaveLength(2); });
  it("deduplicates exact type-aware correlation and labels seeded reports synthetic", () => { const seed = createSeedState().alerts[0]; if (!seed) throw new Error("Missing seed"); const reports = [{ ...seed, indicators: [{ type: "phone" as const, value: "+971500000000" }, { type: "phone" as const, value: "+971500000000" }, { type: "email" as const, value: "+971500000000" }] }]; const links = correlate(record, [record], reports); expect(links.reports).toHaveLength(1); expect(links.reports[0]?.shared).toEqual(["phone: +971500000000"]); expect(links.reports[0]?.synthetic).toBe(true); });
  it("uses actual resolver/registry responses, records reliable dates and never visits the candidate", async () => { const calls: string[] = []; const observation = await verifyDomain("uaepass-login.com", transport(calls), now); expect(observation.registration).toBe("confirmed"); expect(observation.registeredAt).toBe("2026-11-20T00:00:00.000Z"); expect(observation.ageDays).toBe(4); expect(observation.dns).toBe("resolved"); expect(calls.every(url => ["dns.google", "rdap.verisign.com", "stat.ripe.net"].includes(new URL(url).hostname))).toBe(true); expect(priority({ ...record, observation }).earlyWarning).toBe(true); expect(priority({ ...record, observation }).risk).toBe("high"); });
  it("never fabricates a .ae registration date from DNS", async () => { const calls: string[] = []; const observation = await verifyDomain("uaepass-login.ae", transport(calls), now); expect(observation.registration).toBe("unsupported"); expect(observation.registeredAt).toBeNull(); expect(observation.ageDays).toBeNull(); expect(observation.dns).toBe("resolved"); expect(calls.some(url => url.includes("rdap"))).toBe(false); });
  it("no DNS records does not establish nonregistration or justify a warning", async () => { const calls: string[] = []; const observation = await verifyDomain("uaepass-login.com", transport(calls, false, false), now); expect(observation.dns).toBe("no_records"); expect(observation.registration).toBe("not_found"); expect(priority({ ...record, observation }).earlyWarning).toBe(false); });
  it("synthetic records never become real early warnings", async () => { const observation = await verifyDomain("uaepass-login.com", transport([]), now); expect(priority({ ...record, synthetic: true, observation }).earlyWarning).toBe(false); });
  it("official domains never become impersonation warnings", async () => { const observation = await verifyDomain("uaepass-login.com", transport([]), now); expect(priority({ ...record, domain: "adcb.com", targetDomain: "adcb.com", observation }).earlyWarning).toBe(false); });
  it("service failures remain unknown with no invented evidence", async () => { const observation = await verifyDomain("uaepass-login.com", (async () => { throw new Error("offline"); }) as typeof fetch, now); expect(observation.dns).toBe("unavailable"); expect(observation.registration).toBe("unavailable"); expect(observation.records).toEqual([]); expect(observation.registeredAt).toBeNull(); });
});
