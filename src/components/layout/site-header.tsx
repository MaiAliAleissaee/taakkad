import { Link } from "@tanstack/react-router";
import { Building2, FlaskConical, Languages, LayoutDashboard, Menu, ShieldCheck, Siren, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n";
import { cn } from "@/lib/utils";
import { useStaffSession } from "@/lib/security/session";
import { StaffSignOut } from "@/components/security/staff-sign-out";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid size-9 place-items-center rounded-lg bg-emerald-gradient text-emerald-foreground shadow-glow">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      <span className="ltr-isolate font-display text-base font-bold leading-none tracking-tight">
        TRUST <span className="text-emerald">ZERO</span> AI
        {!compact ? <span className="mt-1 block text-[0.6rem] font-medium tracking-[0.25em] text-navy-muted">IDENTITY · VERIFY · DEFEND</span> : null}
      </span>
    </span>
  );
}

export function SiteHeader() {
  const { tr, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const staff = useStaffSession();

  const links = [
    { to: "/" as const, label: tr("Overview", "نظرة عامة"), icon: LayoutDashboard },
    { to: "/organizations" as const, label: tr("Organization Portal", "بوابة الجهات"), icon: Building2 },
    { to: "/trust" as const, label: tr("Public Trust Portal", "بوابة الثقة العامة"), icon: ShieldCheck },
    { to: "/security" as const, label: tr("Security Dashboard", "لوحة التحكم الأمنية"), icon: Siren },
  ];

  const toggleLang = () => setLang(lang === "en" ? "ar" : "en");

  return (
    <header className="sticky top-0 z-40 border-b border-navy-border bg-navy-deep/95 text-navy-foreground backdrop-blur">
      <div className="border-b border-navy-border bg-emerald/10">
        <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-[0.72rem] text-navy-muted sm:px-6 lg:px-8">
          <FlaskConical className="size-3.5 shrink-0 text-emerald" aria-hidden />
          {tr(
            "Hackathon prototype · All organizations, messages and cases are fictional · No real police, bank or government integrations",
            "نموذج أولي لهاكاثون · جميع الجهات والرسائل والقضايا خيالية · لا توجد أي ربط فعلي مع الشرطة أو البنوك أو الجهات الحكومية",
          )}
        </p>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label={tr("Main", "الرئيسية")}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-3 py-2 text-sm text-navy-muted transition-colors hover:bg-navy-elevated hover:text-navy-foreground"
              activeProps={{ className: "bg-navy-elevated !text-navy-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {staff.ready && staff.user ? <div className="hidden lg:block"><StaffSignOut onNavy /></div> : null}
          <Button variant="onNavy" size="sm" onClick={toggleLang} aria-label={tr("Switch to Arabic", "التبديل إلى الإنجليزية")}>
            <Languages />
            <span className={lang === "en" ? "font-sans" : "font-display"}>{lang === "en" ? "العربية" : "English"}</span>
          </Button>
          <Button variant="navyGhost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={tr("Menu", "القائمة")}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <nav className={cn("border-t border-navy-border lg:hidden", open ? "block" : "hidden")} aria-label={tr("Mobile", "الجوال")}>
        <div className="mx-auto grid max-w-7xl gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-navy-muted hover:bg-navy-elevated hover:text-navy-foreground"
              activeProps={{ className: "bg-navy-elevated !text-navy-foreground" }}
            >
              <l.icon className="size-4 text-emerald" aria-hidden />
              {l.label}
            </Link>
          ))}
          {staff.ready && staff.user ? <div className="mt-2"><StaffSignOut onNavy /></div> : null}
        </div>
      </nav>
    </header>
  );
}
