import { describe, expect, it } from "vitest";
import { canSubmitDecision, filterQueue, queueStats } from "@/lib/organizations/officer-queue";

const row = (id: string, status: string, en: string) => ({ id, reference: `TZ-ORG-${id}`, status, submitted_at: "2026-01-01T00:00:00Z", payload: { name: { en, ar: "جهة" } } });
const rows = [row("A1", "pending", "Alpha Bank"), row("B2", "needs_information", "Beta Gov"), row("C3", "approved", "Gamma"), row("D4", "rejected", "Delta"), row("E5", "pending", "Echo")];

describe("officer queue", () => {
  it("counts each status from records", () => expect(queueStats(rows)).toEqual({ total: 5, pending: 2, needsInformation: 1, approved: 1, rejected: 1 }));
  it("filters by status", () => expect(filterQueue(rows, "", "pending").map(r => r.id)).toEqual(["A1", "E5"]));
  it("searches by reference or name", () => { expect(filterQueue(rows, "tz-org-c3", "all").map(r => r.id)).toEqual(["C3"]); expect(filterQueue(rows, "beta", "all").map(r => r.id)).toEqual(["B2"]); });
  it("requires a reason to reject", () => expect(canSubmitDecision("rejected", "  ", [], [])).toBe(false));
  it("requires a note to request information", () => expect(canSubmitDecision("needs_information", "", [], [])).toBe(false));
  it("requires all domains confirmed to approve", () => { expect(canSubmitDecision("approved", "ok", ["a.example", "b.example"], ["a.example"])).toBe(false); expect(canSubmitDecision("approved", "ok", ["a.example"], ["a.example"])).toBe(true); });
});
