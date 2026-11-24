import { describe, it, expect } from "vitest";
import { normalizeUaePhone, extractUaePhones } from "@/lib/services/uae-phone";
import { normalizeArabicText, uaeContext, uaeRequestSignals } from "@/lib/services/uae-safety";
import { indicatorsFor, findLinkedCase } from "@/lib/services/reporting";
import { privateCheckCandidates } from "@/lib/services/private-check";
import { indicatorKey, buildInvestigation } from "@/lib/services/investigation";
import { assessMessage, findSenderOrg } from "@/lib/services/verification";
import { channelKey } from "@/lib/services/channels";
import { heuristicAnalyzer } from "@/lib/services/content-analysis";
import { demoExamples } from "@/lib/services/demo-examples";
import { caseEvidence } from "@/lib/evidence/model";
import { createSeedState } from "./fixtures/security-seed";

describe("UAE relevance: local rules without verification or attribution shortcuts", () => {
  it.each(["050 000 0000", "+971 50 000 0000", "00971-50-000-0000", "٠٥٠٠٠٠٠٠٠٠", "۰۵۰۰۰۰۰۰۰۰"])("normalizes equivalent UAE mobile %s", value => {
    expect(normalizeUaePhone(value)).toBe("+971500000000");
    expect(channelKey("phone", value)).toBe("+971500000000");
    expect(indicatorKey("phone", value)).toBe("phone:+971500000000");
  });
  it.each(["050", "052", "054", "055", "056", "058"])("accepts documented UAE mobile prefix %s", prefix => expect(normalizeUaePhone(`${prefix}0000000`)).toBe(`+971${prefix.slice(1)}0000000`));
  it("normalizes UAE landlines without attributing a telecom provider", () => expect(normalizeUaePhone("02 000 0000")).toBe("+97120000000"));
  it("keeps domestic service numbers domestic", () => expect(normalizeUaePhone("600 561 111")).toBe("600561111"));
  it.each(["0510000000", "123456", "784-2026-1234567-1", "+440500000000", "0500000000 ext 12"])("does not infer a UAE phone from %s", value => expect(normalizeUaePhone(value)).toBeNull());
  it("extracts explicit UAE contacts, not OTPs or Emirates IDs", () => expect(extractUaePhones("Call ٠٥٠ ٠٠٠ ٠٠٠٠; OTP 123456; Emirates ID 784-2026-1234567-1")).toEqual(["+971500000000"]));
  it("detects an Emirati code request without paid inference", () => expect(heuristicAnalyzer.analyze("طرشلي الكود الحين").map(s => s.code)).toEqual(["content_credentials", "content_urgency"]));
  it("normalizes diacritics and Arabic-Indic digits for local cues", () => expect(normalizeArabicText("أَرْسِل ٢٠ درهم")).toBe("ارسل 20 درهم"));
  it("detects mixed-language banking requests", () => expect(uaeRequestSignals("عطنا OTP الحين to unlock your account").map(s => s.code)).toEqual(["content_credentials", "content_urgency"]));
  it("detects standard Arabic credential requests", () => expect(uaeRequestSignals("أرسل رمز التحقق").map(s => s.code)).toEqual(["content_credentials"]));
  it("detects English credential requests", () => expect(uaeRequestSignals("Please send your OTP").map(s => s.code)).toEqual(["content_credentials"]));
  it("detects an unsolicited UAE PASS approval instruction", () => expect(uaeRequestSignals("وافق على طلب الدخول في الهوية الرقمية").map(s => s.code)).toEqual(["content_credentials"]));
  it("detects Emirati payment pressure", () => expect(uaeRequestSignals("حول ٢٠ درهم الحين").map(s => s.code)).toEqual(["content_payment", "content_urgency"]));
  it("does not treat the negative prevention instruction as a new scam request", () => expect(uaeRequestSignals("Never share your OTP. لا ترسل الكود.")).toEqual([]));
  it("does not turn an ordinary UAE PASS mention into suspicious evidence", () => {
    const input = { channel: "other" as const, sender: "", body: "We discussed UAE PASS and TAMM in the workshop." };
    expect(uaeContext(input).scenarios.map(s => s.id)).toEqual(["identity", "tamm"]);
    expect(assessMessage(input, { organizations: [], blocklist: [] }).state).toBe("unverified");
    expect(uaeRequestSignals(input.body)).toEqual([]);
  });
  it("does not grant registry verification from an official-domain reference", () => {
    const input = { channel: "website" as const, sender: "https://uaepass.ae", url: "https://uaepass.ae", body: "" };
    expect(uaeContext(input).reference?.domain).toBe("uaepass.ae");
    expect(assessMessage(input, { organizations: [], blocklist: [] }).state).toBe("unverified");
  });
  it("rejects a reference-domain suffix trick", () => expect(uaeContext({ sender: "", url: "https://uaepass.ae.attacker.example/login", body: "" }).reference).toBeNull());
  it("keeps the published help desk reference separate from caller authentication", () => {
    const input = { channel: "phone" as const, sender: "600 561 111", body: "" };
    expect(uaeContext(input).publishedContact?.source.url).toBe("https://u.ae/en/about-the-uae/digital-uae/digital-transformation/platforms-and-apps/the-uae-pass-app");
    expect(assessMessage(input, { organizations: [], blocklist: [] }).state).toBe("unverified");
  });
  it("requires an active explicitly approved phone channel for any format-equivalent match", () => {
    const org = createSeedState().organizations[0];
    if (!org) throw new Error("Missing fixture");
    const channel = { id: "test-phone", type: "phone" as const, value: "+971500000000", status: "verified" as const };
    expect(findSenderOrg([{ ...org, channels: [channel] }], "phone", "0500000000")?.id).toBe(org.id);
    expect(findSenderOrg([{ ...org, channels: [{ ...channel, status: "revoked" }] }], "phone", "0500000000")).toBeUndefined();
  });
  it("extracts explicit report email/domain/phone contacts locally and deduplicates", () => {
    const indicators = indicatorsFor({ channel: "other", sender: "", body: "Call 0500000000 or email Support@demo.example; visit https://demo.example/pay. Call +971500000000." });
    expect(indicators.filter(i => i.type === "phone")).toEqual([{ type: "phone", value: "+971500000000" }]);
    expect(indicators.some(i => i.type === "email" && i.value === "Support@demo.example")).toBe(true);
    expect(indicators.some(i => i.type === "domain" && i.value === "demo.example")).toBe(true);
    expect(indicators.some(i => i.type === "url" && i.value === "https://demo.example/pay")).toBe(true);
  });
  it("sends indicator candidates only, bounded by the preserved public endpoint limit", () => {
    const candidates = privateCheckCandidates({ channel: "phone", sender: "0500000000", body: "My private message; OTP 123456" });
    expect(candidates).toEqual(["+971500000000", "00971500000000", "0500000000"]);
    expect(candidates).not.toContain("123456");
    expect(privateCheckCandidates({ channel: "other", sender: "", body: Array.from({ length: 100 }, (_, i) => `p${i}@demo${i}.example`).join(" ") }).length).toBeLessThanOrEqual(60);
  });
  it("links equivalent UAE phone formats as human-review leads", () => {
    const first = createSeedState().alerts[0];
    if (!first) throw new Error("Missing fixture");
    const graph = buildInvestigation([{ ...first, id: "a", indicators: [{ type: "phone", value: "0500000000" }] }, { ...first, id: "b", indicators: [{ type: "phone", value: "+971500000000" }] }]);
    expect(graph.leads).toHaveLength(1);
    expect(graph.leads[0]?.requiresHumanReview).toBe(true);
  });
  it("links exact domains and emails without merging different types", () => {
    expect(indicatorKey("email", "Support@demo.example")).toBe("email:support@demo.example");
    const first = createSeedState().alerts[0];
    if (!first) throw new Error("Missing fixture");
    expect(findLinkedCase([{ ...first, indicators: [{ type: "sms_sender", value: "demo.example" }] }], { channel: "website", sender: "demo.example", body: "" })).toBeUndefined();
    expect(findLinkedCase([{ ...first, indicators: [{ type: "email", value: "support@demo.example" }] }], { channel: "other", sender: "", body: "Email Support@demo.example" })?.id).toBe(first.id);
  });
  it("matches flagged body contacts without exposing private case details", () => {
    const assessment = assessMessage({ channel: "other", sender: "", body: "Call 0500000000" }, { organizations: [], blocklist: [{ type: "domain", value: "00971500000000", caseId: "restricted" }] });
    expect(assessment.state).toBe("suspicious");
    expect(assessment.reasons.find(r => r.code === "blocklisted")?.params["caseId"]).toBe("restricted");
  });
  it("keeps the seven UAE scenarios fictional with reserved URLs and no claimed result", () => {
    const scenarios = demoExamples.filter(example => example.id >= 11);
    expect(scenarios).toHaveLength(7);
    expect(scenarios.every(example => !example.url || new URL(example.url).hostname.endsWith(".example"))).toBe(true);
    expect(scenarios.map(example => example.id)).toEqual([11, 12, 13, 14, 15, 16, 17]);
  });
  it("adds source-backed UAE guidance to authorized evidence without fabricating observations or taking action", () => {
    const first = createSeedState().alerts[0];
    if (!first) throw new Error("Missing fixture");
    const pack = caseEvidence({ ...first, title: { en: "UAE PASS fictional request", ar: "طلب هوية رقمية خيالي" } }, []);
    expect(pack.uaeSources.map(source => source.url)).toContain("https://u.ae/en/about-the-uae/digital-uae/digital-transformation/platforms-and-apps/the-uae-pass-app");
    expect(pack.uaeGuidance.length).toBeGreaterThanOrEqual(3);
    expect(pack.actions).toEqual([]);
    expect(pack.timeline.every(event => event.provenance !== "technical")).toBe(true);
  });
});