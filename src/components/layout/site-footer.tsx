import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { repository } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { Logo } from "./site-header";
import { useStaffSession } from "@/lib/security/session";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { changeSecurityWorkspace } from "@/lib/security/workspace.functions";

export function SiteFooter() {
  const { tr } = useI18n();
  const staff = useStaffSession();
  const queryClient = useQueryClient();
  const change = useServerFn(changeSecurityWorkspace);
  return (
    <footer className="mt-16 bg-navy-deep text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Logo compact />
          <p className="max-w-md text-sm leading-relaxed text-navy-muted">
            {tr(
              "Taakkad is a hackathon prototype. It holds no real-world certification, does not monitor the internet in real time, and is not endorsed by any government entity.",
              "تأكّد نموذج أولي لهاكاثون. لا يحمل أي شهادة فعلية، ولا يراقب الإنترنت في الوقت الفعلي، وليس معتمداً من أي جهة حكومية.",
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald">{tr("Portals", "البوابات")}</p>
          <ul className="mt-3 space-y-2 text-sm text-navy-muted">
            <li><Link to="/organizations" className="hover:text-navy-foreground">{tr("Organization Portal", "بوابة الجهات")}</Link></li>
            <li><Link to="/trust" className="hover:text-navy-foreground">{tr("Public Trust Portal", "بوابة الثقة العامة")}</Link></li>
            <li><Link to="/security" className="hover:text-navy-foreground">{tr("Security Dashboard", "لوحة التحكم الأمنية")}</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald">{tr("Demo data", "البيانات التجريبية")}</p>
          <p className="text-sm text-navy-muted">{tr("Organization changes stay in this browser. Security records are saved in your authorized Cloud account.", "تبقى تغييرات الجهات في هذا المتصفح. تُحفظ السجلات الأمنية في حسابك المصرّح له في Cloud.")}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="onNavy" size="sm"><RotateCcw />{tr("Reset demo data", "إعادة ضبط البيانات")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tr("Reset all demo data?", "إعادة ضبط جميع البيانات التجريبية؟")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tr("Browser organization data will be reset. When authorized, your Cloud security workspace will also reset. Unmigrated browser cases are retained.", "ستُعاد بيانات الجهات في المتصفح. عند التصريح لك، ستُعاد أيضاً مساحة القضايا في Cloud. تبقى قضايا المتصفح التي لم تُنقل محفوظة.")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tr("Cancel", "إلغاء")}</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                  try {
                    if (staff.securityAccess && staff.user) {
                      const saved = await change({ data: { action: "reset" } });
                      queryClient.setQueryData(["security-workspace", staff.user.id], saved);
                      await queryClient.invalidateQueries({ queryKey: ["public-flags"] });
                    }
                    repository.reset(); toast.success(tr("Demo data reset", "تمت إعادة ضبط البيانات"));
                  } catch { toast.error(tr("Reset failed. Your data was not removed.", "تعذّرت إعادة الضبط. لم تُحذف بياناتك.")); }
                }}>
                  {tr("Reset", "إعادة الضبط")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="border-t border-navy-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-navy-muted sm:px-6 lg:px-8">
          {tr("© 2026 Taakkad · UAE cybersecurity hackathon prototype · Fictional demo data", "© 2026 تأكّد · نموذج أولي لهاكاثون الأمن السيبراني في الإمارات · بيانات تجريبية خيالية")}
        </p>
      </div>
    </footer>
  );
}
