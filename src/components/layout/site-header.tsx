import { Link } from "@tanstack/react-router";
import { Building2, FlaskConical, LayoutDashboard, Menu, ShieldCheck, Siren, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n";
import { cn } from "@/lib/utils";

export function Logo({ compact = false }: { compact?: boolean }) {
  const { tr } = useI18n();
  return <span className="flex items-center gap-3">
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-6" aria-hidden /></span>
    <span className="min-w-0"><span className="ltr-isolate block font-display text-base font-semibold">TRUST <span className="text-primary">ZERO</span> AI</span>{!compact && <span className="mt-1 block text-xs text-muted-foreground">{tr("Digital trust services", "خدمات الثقة الرقمية")}</span>}</span>
  </span>;
}

export function SiteHeader() {
  const { tr, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/" as const, label: tr("Overview", "الرئيسية"), icon: LayoutDashboard, group: "public" },
    { to: "/trust" as const, label: tr("Public Trust Portal", "بوابة الثقة العامة"), icon: ShieldCheck, group: "public" },
    { to: "/organizations" as const, label: tr("Organization Portal", "بوابة الجهات"), icon: Building2, group: "professional" },
    { to: "/security" as const, label: tr("Security Dashboard", "لوحة الأمن"), icon: Siren, group: "professional" },
  ];
  const navLink = (l: typeof links[number]) => <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/" }} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-primary" activeProps={{ className: "bg-accent text-primary font-semibold" }}><l.icon className="size-4" aria-hidden />{l.label}</Link>;
  return <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
    <a href="#main-content" className="sr-only z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:absolute focus:start-4 focus:top-4">{tr("Skip to content", "انتقل إلى المحتوى")}</a>
    <div className="border-b bg-accent">
      <p className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs leading-relaxed text-accent-foreground sm:px-6 lg:px-8"><FlaskConical className="size-4 shrink-0" aria-hidden />{tr("Hackathon prototype · Fictional data · No official endorsement or real integrations", "نموذج أولي لهاكاثون · بيانات خيالية · دون اعتماد رسمي أو ربط فعلي")}</p>
    </div>
    <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <Link to="/" className="shrink-0" onClick={() => setOpen(false)}><Logo /></Link>
      <nav className="hidden items-center gap-2 xl:flex" aria-label={tr("Main navigation", "التنقل الرئيسي")}>
        <div className="flex items-center gap-1">{links.filter(l => l.group === "public").map(navLink)}</div>
        <div className="flex items-center gap-1 border-s ps-3"><span className="px-1 text-xs text-muted-foreground">{tr("Professionals", "للمختصين")}</span>{links.filter(l => l.group === "professional").map(navLink)}</div>
      </nav>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="outline" size="sm" aria-label={lang === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic"} onClick={() => setLang(lang === "ar" ? "en" : "ar")}><span dir="ltr"><span className={lang === "ar" ? "font-semibold text-primary" : "text-muted-foreground"}>AR</span><span className="mx-1 text-muted-foreground" aria-hidden>/</span><span className={lang === "en" ? "font-semibold text-primary" : "text-muted-foreground"}>EN</span></span></Button>
        <Button variant="ghost" size="icon" className="xl:hidden" aria-label={tr("Menu", "القائمة")} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </div>
    </div>
    <nav id="mobile-navigation" className={cn("border-t px-4 py-3 xl:hidden", open ? "block" : "hidden")} aria-label={tr("Mobile navigation", "التنقل على الجوال")}>
      <p className="px-3 py-1 text-xs text-muted-foreground">{tr("Public services", "الخدمات العامة")}</p>{links.filter(l => l.group === "public").map(navLink)}
      <p className="mt-2 border-t px-3 pt-3 text-xs text-muted-foreground">{tr("Professional services", "خدمات المختصين")}</p>{links.filter(l => l.group === "professional").map(navLink)}
    </nav>
  </header>;
}
