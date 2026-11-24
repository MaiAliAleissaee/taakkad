import type { MessageInput } from "./verification";
import { indicatorsFor } from "./reporting";
import { normalizeUaePhone } from "./uae-phone";

export type PublicCheckChannel = MessageInput["channel"] | "whatsapp";

/** Presentation normalization only; never changes the assessment policy. */
export function preparePrivateCheck(input: Omit<MessageInput, "channel"> & { channel: PublicCheckChannel }): MessageInput | null {
  const sender = input.sender.trim();
  const body = input.body.trim();
  const pastedUrl = body.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  const url = input.url?.trim() || (input.channel === "website" ? sender || body : pastedUrl);
  if (!sender && !url && !body) return null;
  return { ...input, channel: input.channel === "whatsapp" ? "phone" : input.channel, sender: input.channel === "website" ? sender || url || "" : sender, body, url };
}

/** Only exact indicator candidates leave the page; never send the message body. */
export function privateCheckCandidates(input: MessageInput): string[] {
  const candidates = indicatorsFor(input).flatMap(indicator => {
    const phone = indicator.type === "phone" ? normalizeUaePhone(indicator.value) : null;
    return phone?.startsWith("+971") ? [indicator.value, phone, `0${phone.slice(4)}`, `00971${phone.slice(4)}`] : [indicator.value];
  });
  return [...new Set(candidates)].slice(0, 60).sort();
}