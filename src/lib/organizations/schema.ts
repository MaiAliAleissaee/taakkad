import { z } from "zod";

export const channelInputSchema = z.object({ type: z.enum(["email", "sms", "phone", "website", "social", "other"]), value: z.string().trim().min(1).max(200) });
export const registrationSchema = z.object({ nameEn: z.string().trim().min(3).max(160), nameAr: z.string().trim().min(2).max(160), type: z.enum(["government", "bank", "business"]), domains: z.array(z.string().max(200)).min(1).max(20), contactEmail: z.string().trim().email().max(200), channels: z.array(channelInputSchema).min(1).max(30) });
export const documentSchema = z.object({ id: z.string().uuid(), name: z.string().min(1).max(160), type: z.enum(["application/pdf", "text/plain", "image/png", "image/jpeg"]), content: z.string().max(350000).regex(/^[A-Za-z0-9+/]*={0,2}$/) });
export const documentsSchema = z.array(documentSchema).max(3);
export type ApplicationDocument = z.infer<typeof documentSchema>;
export type ApplicationStatus = "pending" | "approved" | "rejected" | "needs_information" | "suspended" | "removed";

export function canEditApplication(ownerId: string, userId: string, submittedAt: string, status: ApplicationStatus, now: number): boolean {
  return ownerId === userId && (now < Date.parse(submittedAt) + 24 * 60 * 60 * 1000 || status === "needs_information");
}
export const isVerificationOfficer = (roles: string[]) => roles.includes("organization_verification_officer");

export const trackingCredentialsSchema = z.object({ reference: z.string().trim().regex(/^TZ-ORG-[0-9a-f-]{36}$/i), secret: z.string().regex(/^[a-f0-9]{64}$/) });
export const applicationGrantSchema = z.object({ id: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{64}$/) });
export function editingRemaining(submittedAt: string, now: number): number { return Math.max(0, Date.parse(submittedAt) + 86400000 - now); }
export type ApplicationReceipt = { id: string; reference: string; secret: string; submittedAt: string; status: "pending" };