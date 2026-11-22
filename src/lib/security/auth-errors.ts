import type { Bi } from "@/lib/domain/types";

export type StaffAuthFailure = "credentials" | "confirmation" | "rate_limit" | "unavailable";
export function staffAuthFailure(error: { code?: string | undefined; status?: number | undefined } | null | undefined): StaffAuthFailure {
  if (error?.code === "invalid_credentials") return "credentials";
  if (error?.code === "email_not_confirmed") return "confirmation";
  if (error?.status === 429 || error?.code === "over_request_rate_limit") return "rate_limit";
  return "unavailable";
}
export const staffAuthMessages: Record<StaffAuthFailure, Bi> = {
  credentials: { en: "Email or password was rejected. Use your Taakkad password, not your Outlook password. If unsure, choose Set or reset password privately.", ar: "رُفض البريد أو كلمة المرور. استخدم كلمة مرور تأكّد، وليس كلمة مرور Outlook. إذا لم تكن متأكداً، اختر تعيين كلمة المرور أو إعادة ضبطها بشكل خاص." },
  confirmation: { en: "Confirm your email using your account confirmation link before signing in.", ar: "أكّد بريدك الإلكتروني باستخدام رابط تأكيد الحساب قبل تسجيل الدخول." },
  rate_limit: { en: "Too many sign-in attempts. Wait a while before trying again.", ar: "محاولات تسجيل الدخول كثيرة. انتظر قليلاً قبل المحاولة مجدداً." },
  unavailable: { en: "Sign-in is temporarily unavailable. Please try again; your permissions have not changed.", ar: "تسجيل الدخول غير متاح مؤقتاً. حاول مجدداً؛ لم تتغيّر صلاحياتك." },
};