import { describe, expect, it } from "vitest";
import { createSeedState } from "./fixtures/security-seed";
import { buildInvestigation } from "@/lib/services/investigation";

describe("Investigation leads", () => {
  it("connects TZ-1042 and TZ-1043 through IP 203.0.113.45", () => {
    const graph = buildInvestigation(createSeedState().alerts);
    expect(graph.indicators.find((i) => i.type === "ip" && i.value === "203.0.113.45")?.cases.map((c) => c.caseId)).toEqual(["TZ-1042", "TZ-1043"]);
  });
  it("requires human review for every potential case connection", () => {
    const { leads } = buildInvestigation(createSeedState().alerts);
    expect(leads.length).toBe(2);
    for (const lead of leads) expect(lead.requiresHumanReview).toBe(true);
  });
  it("does not merge different indicator types or count duplicate indicators as multiple cases", () => {
    const first = createSeedState().alerts[0];
    if (!first) throw new Error("Missing fictional case");
    const graph = buildInvestigation([{ ...first, indicators: [{ type: "domain", value: "same.example" }, { type: "domain", value: "SAME.example" }, { type: "sms_sender", value: "same.example" }] }]);
    expect(graph.indicators.length).toBe(2);
    expect(graph.indicators.map((i) => i.cases.length)).toEqual([1, 1]);
    expect(graph.leads).toEqual([]);
  });
});