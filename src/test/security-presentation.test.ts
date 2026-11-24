import { describe, expect, it } from "vitest";
import { connectionSummary, groupDomains, isDocumentationIp, reportLabel } from "@/lib/security/presentation";
import { createSeedState } from "./fixtures/security-seed";
import { demoExamples } from "@/lib/services/demo-examples";
import { assessMessage } from "@/lib/services/verification";

describe("hackathon presentation rules", () => {
  it("uses a permanent assigned number regardless of ordering and retains legacy references", () => {
    const report = { caseId: "TZ-1042", reportNumber: "1/2026" };
    expect(reportLabel(report)).toBe("1/2026");
    expect(reportLabel({ caseId: "TZ-1042" })).toBe("TZ-1042");
  });
  it("groups duplicate domains without discarding original records", () => {
    const seed = createSeedState(); const domain = seed.lookalikes[0];
    if (!domain) throw new Error("Missing fixture");
    const grouped = groupDomains([domain, { ...domain, id: "duplicate", domain: domain.domain.toUpperCase() }], seed.alerts);
    expect(grouped).toHaveLength(1); expect(grouped[0]?.records.map(record => record.id)).toEqual([domain.id, "duplicate"]);
  });
  it("marks 203.0.113.45 as documentation, never geographic evidence", () => {
    expect(isDocumentationIp("203.0.113.45")).toBe(true);
    expect(isDocumentationIp("198.51.100.23")).toBe(true);
    expect(isDocumentationIp("192.0.2.1")).toBe(true);
    expect(isDocumentationIp("8.8.8.8")).toBe(false);
    expect(isDocumentationIp("203.0.113.999")).toBe(false);
  });
  it("counts related reports using type-aware shared indicators", () => {
    const summary = connectionSummary(createSeedState().alerts);
    expect(summary.shared.find(item => item.type === "ip" && item.value === "203.0.113.45")?.cases.map(item => item.caseId)).toEqual(["TZ-1042", "TZ-1043"]);
    expect(summary.leads.every(lead => lead.requiresHumanReview)).toBe(true);
  });
  it("preserves ten original examples and seven unique fictional UAE examples", () => {
    expect(demoExamples.filter(example => example.id <= 10)).toHaveLength(10);
    expect(demoExamples).toHaveLength(17); expect(new Set(demoExamples.map(example => example.id)).size).toBe(17);
    expect(demoExamples.filter(example => example.url).every(example => new URL(example.url).hostname.endsWith(".example"))).toBe(true);
  });
  it("first three examples match actual active approved fictional channels", () => {
    for (const example of demoExamples.slice(0,3)) {
      const assessment = assessMessage({ channel: example.channel === "whatsapp" ? "other" : example.channel, sender: example.sender, url: example.url, body: example.body.en }, { organizations: createSeedState().organizations, blocklist: [] });
      expect(assessment.state).toBe("verified");
    }
  });
  it("three suspicious examples correlate with existing fictional report domains", () => {
    const seed = createSeedState();
    for (const example of demoExamples.slice(3,6)) expect(seed.alerts.some(report => report.indicators.some(indicator => indicator.type === "domain" && indicator.value === new URL(example.url).hostname))).toBe(true);
  });
});