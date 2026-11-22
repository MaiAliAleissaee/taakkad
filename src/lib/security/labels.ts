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
  validation: { en: "Enter a valid staff ID or email; login also requires your password.", ar: "أدخل معرّف موظف أو بريداً إلكترونياً صالحاً؛ يتطلب الدخول كلمة المرور أيضاً." },
  credentials: { en: "Staff ID, email or password is incorrect, or the account is unavailable. Try again later if needed.", ar: "معرّف الموظف أو البريد أو كلمة المرور غير صحيحة، أو الحساب غير متاح. حاول لاحقاً عند الحاجة." },
  session: { en: "Could not verify this session. Please try again.", ar: "تعذّر التحقق من الجلسة. حاول مجدداً." },
  access: { en: "Access check unavailable. Please try again.", ar: "التحقق من الصلاحيات غير متاح. حاول مجدداً." },
  forbidden: { en: "Your account is not authorized to access security cases.", ar: "حسابك غير مصرّح له بالوصول إلى القضايا الأمنية." },
  rate_limit: { en: "Too many sign-in attempts for this staff ID. Your password was not checked; wait up to an hour and try again.", ar: "محاولات دخول كثيرة لمعرّف الموظف هذا. لم يتم التحقق من كلمة المرور؛ انتظر حتى ساعة ثم حاول مجدداً." },
  unavailable: { en: "Unable to sign in. Please try again.", ar: "تعذّر تسجيل الدخول. حاول مجدداً." },
};