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

export function SiteFooter() {
  const { tr } = useI18n();
  return (
    <footer className="mt-16 bg-navy-deep text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Logo compact />
          <p className="max-w-md text-sm leading-relaxed text-navy-muted">
            {tr(
              "TRUST ZERO AI is a hackathon prototype. It holds no real-world certification, does not monitor the internet in real time, and is not endorsed by any government entity.",
              "TRUST ZERO AI نموذج أولي لهاكاثون. لا يحمل أي شهادة فعلية، ولا يراقب الإنترنت في الوقت الفعلي، وليس معتمداً من أي جهة حكومية.",
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald">{tr("Portals", "البوابات")}</p>
          <ul className="mt-3 space-y-2 text-sm text-navy-muted">
            <li><Link to="/organizations" className="hover:text-navy-foreground">{tr("Organization Portal", "بوابة الجهات")}</Link></li>
            <li><Link to="/trust" className="hover:text-navy-foreground">{tr("Public Trust Portal", "بوابة الثقة العامة")}</Link></li>
            <li><Link to="/security" className="hover:text-navy-foreground">{tr("Security Dashboard", "لوحة الأمن")}</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald">{tr("Demo data", "البيانات التجريبية")}</p>
          <p className="text-sm text-navy-muted">{tr("Your changes are saved in this browser only.", "تُحفظ تغييراتك في هذا المتصفح فقط.")}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="onNavy" size="sm"><RotateCcw />{tr("Reset demo data", "إعادة ضبط البيانات")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tr("Reset all demo data?", "إعادة ضبط جميع البيانات التجريبية؟")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tr("Organizations, cases and notes you added in this browser will be replaced by the original sample set.", "سيتم استبدال الجهات والقضايا والملاحظات التي أضفتها في هذا المتصفح بالمجموعة الأصلية.")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tr("Cancel", "إلغاء")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => { repository.reset(); toast.success(tr("Demo data reset", "تمت إعادة ضبط البيانات")); }}>
                  {tr("Reset", "إعادة الضبط")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="border-t border-navy-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-navy-muted sm:px-6 lg:px-8">
          {tr("© 2026 TRUST ZERO AI · UAE cybersecurity hackathon prototype · Fictional demo data", "© 2026 TRUST ZERO AI · نموذج أولي لهاكاثون الأمن السيبراني في الإمارات · بيانات تجريبية خيالية")}
        </p>
      </div>
    </footer>
  );
}
