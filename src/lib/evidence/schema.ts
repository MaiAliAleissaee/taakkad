import { z } from "zod";
export const MAX_FILE_BYTES = 524288;
export const subjectSchema = z.object({ kind: z.enum(["case", "intelligence", "application"]), id: z.string().trim().min(1).max(200) }).strict();
export type EvidenceSubject = z.infer<typeof subjectSchema>;
export const provenanceSchema = z.enum(["technical", "prediction", "user_report", "synthetic", "staff_submission", "human_review"]);
export const attachmentInputSchema = subjectSchema.extend({ name: z.string().trim().min(1).max(160).regex(/^[^/\\\u0000-\u001f\u007f]+$/), mime: z.enum(["image/png", "image/jpeg", "application/pdf", "text/plain"]), content: z.string().min(4).max(699052).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/), source: z.string().trim().min(1).max(1000), capturedAt: z.string().datetime({ offset: true }), synthetic: z.boolean() }).strict();
export const actionInputSchema = subjectSchema.extend({ action: z.enum(["preserve", "verify", "request_information", "prepare_request"]), note: z.string().trim().min(1).max(2000), confirmed: z.literal(true) }).strict();
export const attachmentMetaSchema = z.object({ name: z.string(), mime: z.string(), source: z.string(), capturedAt: z.string(), provenance: z.enum(["synthetic", "staff_submission"]), bytes: z.number().int().positive().max(MAX_FILE_BYTES), sha256: z.string().regex(/^[a-f0-9]{64}$/) });
export const actionMetaSchema = z.object({ action: z.enum(["preserve", "verify", "request_information", "prepare_request"]), note: z.string(), confirmed: z.literal(true) });
export type AttachmentMeta = z.infer<typeof attachmentMetaSchema>;
export type ActionMeta = z.infer<typeof actionMetaSchema>;
export async function validateFile(content: string, mime: string) {
  const decoded = atob(content); const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
  if (!bytes.length || bytes.length > MAX_FILE_BYTES || btoa(decoded) !== content) throw new Error("invalid_file");
  const starts = (signature: number[]) => signature.every((b,i) => bytes[i] === b);
  const valid = mime === "image/png" ? starts([137,80,78,71,13,10,26,10]) && bytes.length >= 33
    : mime === "image/jpeg" ? starts([255,216,255]) && bytes[bytes.length-2] === 255 && bytes[bytes.length-1] === 217
    : mime === "application/pdf" ? starts([37,80,68,70,45]) && decoded.slice(-1024).includes("%%EOF")
    : mime === "text/plain" ? (() => { try { const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text); } catch { return false; } })() : false;
  if (!valid) throw new Error("file_type_mismatch");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return { bytes: bytes.length, sha256: Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,"0")).join("") };
}
