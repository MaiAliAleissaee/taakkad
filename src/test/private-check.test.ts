import { describe, expect, it } from "vitest";
import { preparePrivateCheck, privateCheckCandidates } from "@/lib/services/private-check";
import { assessMessage } from "@/lib/services/verification";
import { createSeedState } from "./fixtures/security-seed";

describe("Private public checks", () => {
  it("accepts message text without optional sender information", () => {
    const input = preparePrivateCheck({ channel: "sms", sender: "", body: "An unexpected message" });
    expect(input?.body).toBe("An unexpected message");
    expect(input?.sender).toBe("");
  });
  it("rejects an empty check", () => expect(preparePrivateCheck({ channel: "sms", sender: " ", body: " " })).toBeNull());
  it("supports WhatsApp phone-channel matching without changing registry policy", () => {
    const input = preparePrivateCheck({ channel: "whatsapp", sender: "+97140000200", body: "Hello" });
    expect(input?.channel).toBe("phone");
    expect(input?.sender).toBe("+97140000200");
  });
  it("checks a pasted website as a website channel", () => {
    const input = preparePrivateCheck({ channel: "website", sender: "", body: "https://falconbank.example" });
    expect(input?.sender).toBe("https://falconbank.example");
    expect(input?.url).toBe("https://falconbank.example");
  });
  it("extracts a pasted message link for the existing warning-sign assessment", () => {
    const seed = createSeedState();
    const input = preparePrivateCheck({ channel: "sms", sender: "", body: "Visit https://fa1conbank.example/login" });
    if (!input) throw new Error("Expected a check");
    expect(assessMessage(input, { organizations: seed.organizations, blocklist: [] }).state).toBe("suspicious");
  });
  it("never sends raw message content among safety lookup candidates", () => {
    expect(privateCheckCandidates({ channel: "email", sender: "notices@alnoor.gov.example", body: "Private message containing code 123456" })).toEqual(["alnoor.gov.example", "notices@alnoor.gov.example"]);
  });
  it("does not issue a lookup for a message without digital indicators", () => {
    expect(privateCheckCandidates({ channel: "sms", sender: "", body: "Private text only" })).toEqual([]);
  });
});