import { describe, expect, it } from "vitest";
import { formatDisplayDate } from "@/lib/i18n/date";

describe("Stable display dates", () => {
  it("uses a fixed September abbreviation instead of runtime-specific ICU text", () => {
    expect(formatDisplayDate("2026-09-02T08:00:00Z", "en")).toBe("2 Sep 2026");
  });

  it("formats Dubai's date and time at the UTC day boundary", () => {
    expect(formatDisplayDate("2026-09-02T20:05:00Z", "en", true)).toBe("3 Sep 2026, 00:05");
  });

  it("keeps Arabic month names and Latin numerals stable", () => {
    expect(formatDisplayDate("2026-09-02T20:05:00Z", "ar", true)).toBe("3 سبتمبر 2026، 00:05");
  });

  it("does not crash rendering on an invalid saved date", () => {
    expect(formatDisplayDate("invalid", "en")).toBe("—");
  });
});