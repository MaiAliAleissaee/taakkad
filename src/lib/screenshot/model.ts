import type { MessageInput } from "@/lib/services/verification";
import { normalizeUaePhone, extractUaePhones } from "@/lib/services/uae-phone";
import { uaeScenarios, normalizeArabicText } from "@/lib/services/uae-safety";
import { assessMessage, type Assessment, type VerificationContext } from "@/lib/services/verification";
import { preparePrivateCheck, type PublicCheckChannel } from "@/lib/services/private-check";
import { hostFromUrl } from "@/lib/services/lookalike";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_SIDE = 8192;
export const MAX_IMAGE_PIXELS = 16_000_000;
export type ImageError = "type" | "size" | "dimensions" | "decode" | "ocr";
export type ScreenshotData = { text: string; confidence: number; qr: string[]; uncertainWords: string[]; incomplete: boolean };
export type ReviewData = { text: string; qr: string; sender: string; url: string };
export type ManualData = Omit<MessageInput, "channel"> & { channel: PublicCheckChannel };

export function validateRaster(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("size");
  const starts = (v: number[]) => v.every((n,i) => bytes[i] === n);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const str = (i: number,n: number) => String.fromCharCode(...bytes.slice(i,i+n));
  let width = 0, height = 0;
  if (mime === "image/png" && bytes.length >= 33 && starts([137,80,78,71,13,10,26,10]) && str(12,4) === "IHDR") {
    width = view.getUint32(16); height = view.getUint32(20);
  } else if (mime === "image/jpeg" && starts([255,216,255]) && bytes.at(-2) === 255 && bytes.at(-1) === 217) {
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 255) break;
      const marker = bytes[offset+1];
      if (marker === 255) { offset++; continue; }
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker !== undefined && marker >= 208 && marker <= 215)) { offset += 2; continue; }
      const length = view.getUint16(offset+2);
      if (length < 2 || offset + 2 + length > bytes.length) break;
      if (marker !== undefined && [192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length >= 8) {
        height = view.getUint16(offset+5); width = view.getUint16(offset+7); break;
      }
      offset += length+2;
    }
  } else if (mime === "image/webp" && bytes.length >= 30 && str(0,4) === "RIFF" && str(8,4) === "WEBP") {
    const kind = str(12,4);
    if (kind === "VP8X") {
      width = 1 + (bytes[24] ?? 0) + ((bytes[25] ?? 0)<<8) + ((bytes[26] ?? 0)<<16);
      height = 1 + (bytes[27] ?? 0) + ((bytes[28] ?? 0)<<8) + ((bytes[29] ?? 0)<<16);
    } else if (kind === "VP8L" && bytes[20] === 47) {
      const bits = view.getUint32(21,true); width = (bits & 16383)+1; height = ((bits >>> 14) & 16383)+1;
    } else if (kind === "VP8 " && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) {
      width = view.getUint16(26,true) & 16383; height = view.getUint16(28,true) & 16383;
    } else throw new Error("type");
  } else throw new Error("type");
  validateDimensions(width,height);
  return { width,height };
}
export function validateDimensions(width: number,height: number) {
  if (!width || !height || width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE || width*height > MAX_IMAGE_PIXELS) throw new Error("dimensions");
}
export function extractedIndicators(text: string) {
  const value = text.slice(0,10000);
  const urls = [...new Set((value.match(/https?:\/\/[^\s<>"']+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[^\s<>"']*)?/gi) ?? [])
    .filter(url => !value.includes(`@${url}`)).map(url => url.replace(/[.,;،؛)]+$/, "")).filter(url => url.length <= 2000 && !!hostFromUrl(url)))].slice(0,10);
  const emails = [...new Set(value.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) ?? [])].slice(0,10);
  return { urls, emails, phones: extractUaePhones(value).slice(0,10), organizations: uaeScenarios.filter(s => s.pattern.test(normalizeArabicText(value))).map(s => s.label) };
}
export function extractionIncomplete(data: ScreenshotData) {
  return data.incomplete || !data.text.trim() || data.confidence < 60 || /(?:https?:\/\/\s*(?:$|\n)|\bhttps?\s*:?(?:$|\n))/i.test(data.text);
}
export function combineScreenshot(manual: ManualData, review: ReviewData) {
  const indicators = extractedIndicators(`${review.text}\n${review.qr}`);
  const conflicts: Array<"url" | "sender"> = [];
  const scannedUrl = review.url.trim() || indicators.urls[0] || "";
  const keyUrl = (url: string) => { try { return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).href; } catch { return url.trim(); } };
  if (manual.url?.trim() && scannedUrl && keyUrl(manual.url) !== keyUrl(scannedUrl)) conflicts.push("url");
  const contact = review.sender.trim();
  const keySender = (s: string) => normalizeUaePhone(s) ?? s.trim().toLowerCase();
  if (manual.sender.trim() && contact && keySender(manual.sender) !== keySender(contact)) conflicts.push("sender");
  const body = [...new Set([manual.body.trim(),review.text.trim(),review.qr.trim(),conflicts.includes("sender") ? contact : ""].filter(Boolean))].join("\n").slice(0,10000);
  const input = preparePrivateCheck({ ...manual, sender: manual.sender.trim() || contact, url: manual.url?.trim() || scannedUrl, body });
  return { input, conflicts, urls: [...new Map([manual.url ?? "",review.url,...indicators.urls].filter(Boolean).map(url => [keyUrl(url),url])).values()].slice(0,10), indicators, truncated: [manual.body,review.text,review.qr].join("\n").length > 10000 };
}
/** Reuses the frozen rules/ML for every supplied screenshot URL, never treating extraction as proof of a channel. */
export function assessScreenshot(input: MessageInput, urls: string[], ctx: VerificationContext, uncertain: boolean, conflicting: boolean): Assessment {
  const assessments = [assessMessage(input,ctx), ...urls.filter(url => url !== input.url).map(url => assessMessage({...input,url},ctx))];
  const base = assessments[0];
  if (!base) return { state: "unverified", riskScore: 20, reasons: [] };
  const state = assessments.some(a => a.state === "suspicious") ? "suspicious" : uncertain || conflicting || assessments.some(a => a.state !== "verified") ? "unverified" : base.state;
  const reasons = [...new Map(assessments.flatMap(a => a.reasons).map(reason => [JSON.stringify(reason),reason])).values()];
  return { ...base, state, riskScore: Math.max(uncertain || conflicting ? 20 : 0,...assessments.map(a => a.riskScore)), reasons };
}