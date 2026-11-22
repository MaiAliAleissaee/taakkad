import type { Bi } from "@/lib/domain/types";
import type { StaffRole } from "./access";
export const staffRoleLabel: Record<StaffRole, Bi> = {
  security_analyst: { en: "Security Analyst", ar: "محلل أمني" },
  security_supervisor: { en: "Security Supervisor", ar: "مشرف أمني" },
  organization_verification_officer: { en: "Organization Verification Officer", ar: "موظف توثيق الجهات" },
  organization_administrator: { en: "Organization Administrator", ar: "مسؤول جهة" },
  public_visitor: { en: "Public Visitor", ar: "زائر عام" },
};
export const loginError: Record<string, Bi> = {
  validation: { en: "Enter a valid email and your password.", ar: "أدخل بريداً إلكترونياً صالحاً وكلمة المرور." },
  credentials: { en: "Email or password is incorrect, or the account is unavailable.", ar: "البريد أو كلمة المرور غير صحيحة، أو الحساب غير متاح." },
  session: { en: "Could not verify this session. Please try again.", ar: "تعذّر التحقق من الجلسة. حاول مجدداً." },
  access: { en: "Access check unavailable. Please try again.", ar: "التحقق من الصلاحيات غير متاح. حاول مجدداً." },
  forbidden: { en: "Your account is not authorized to access security cases.", ar: "حسابك غير مصرّح له بالوصول إلى القضايا الأمنية." },
  unavailable: { en: "Unable to sign in. Please try again.", ar: "تعذّر تسجيل الدخول. حاول مجدداً." },
};