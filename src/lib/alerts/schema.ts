import { z } from "zod";
const publicText = z.string().trim().min(3).max(500).refine(value => !/[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\/|(?:\+?\d[\s().-]*){7,}/i.test(value), "Do not include personal contacts or links in public warnings");
const bi = z.object({ en: publicText, ar: publicText });
export const alertContentSchema = z.object({ title: bi, category: z.enum(["bank", "delivery", "traffic", "government", "social", "shopping"]), explanation: bi, safety: bi, severity: z.enum(["critical", "high", "medium", "low"]) });
export type AlertContent = z.infer<typeof alertContentSchema>;
export type AlertStatus = "draft" | "approved" | "published" | "rejected" | "withdrawn";
export type PublicAlert = { id: string; content: AlertContent; published_at: string };
export type ManagedAlert = { id: string; content: AlertContent; status: AlertStatus; author_id: string; revision: number; published_at: string | null };
export const alertCommandSchema = z.object({ id: z.string().uuid().optional(), revision: z.number().int().min(0).optional(), action: z.enum(["save", "approve", "publish", "reject", "withdraw"]), content: alertContentSchema.optional(), note: z.string().trim().min(3).max(500), privacyReviewed: z.boolean().default(false) });
export function mayManageAlert(roles: readonly string[], action: z.infer<typeof alertCommandSchema>["action"], status?: AlertStatus) {
  const staff = roles.includes("security_analyst") || roles.includes("security_supervisor");
  if (action === "save") return staff && (!status || ["draft", "rejected", "withdrawn"].includes(status));
  if (!roles.includes("security_supervisor")) return false;
  return action === "approve" ? status === "draft" : action === "publish" ? status === "approved" : action === "withdraw" ? status === "published" : status === "draft" || status === "approved";
}