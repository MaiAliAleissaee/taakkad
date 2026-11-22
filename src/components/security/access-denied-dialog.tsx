import { useNavigate } from "@tanstack/react-router";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n/i18n";
import { staffHome } from "@/lib/security/staff-home";

type Area = "security" | "officer";

// Shown instead of restricted dashboard content; it carries no restricted data.
export function AccessDeniedDialog({ area, roles }: { area: Area; roles: string[] }) {
  const { tr, dir } = useI18n();
  const navigate = useNavigate();
  const target = area === "security" ? "/officer" : "/security";
  const destination = staffHome(roles) === target ? target : "/";
  const message = area === "security"
    ? tr("This account is not authorized to access the Security Dashboard. Please sign in with an authorized staff account.", "هذا الحساب غير مخوّل بالدخول إلى لوحة التحكم الأمنية. يُرجى تسجيل الدخول باستخدام حساب موظف مصرح له.")
    : tr("This account is not authorized to access the Organization Accreditation Dashboard. Please sign in with an authorized staff account.", "هذا الحساب غير مخوّل بالدخول إلى لوحة اعتماد الجهات. يُرجى تسجيل الدخول باستخدام حساب موظف مصرح له.");
  const label = destination === "/"
    ? tr("Return to Overview", "العودة إلى الصفحة الرئيسية")
    : area === "security" ? tr("Return to Organizations Dashboard", "العودة إلى لوحة الجهات") : tr("Return to Security Dashboard", "العودة إلى لوحة التحكم الأمنية");
  return (
    <AlertDialog open>
      <AlertDialogContent dir={dir} onEscapeKeyDown={e => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr("You do not have access", "ليس لديك صلاحية الوصول")}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => void navigate({ to: destination, replace: true })}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
