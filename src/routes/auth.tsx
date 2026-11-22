import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, LogIn } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/bits";
import { useI18n } from "@/lib/i18n/i18n";
import { useStaffSession } from "@/lib/security/session";
import { StaffSignOut } from "@/components/security/staff-sign-out";
import { canAccessSecurity } from "@/lib/security/access";
import { loginError, staffRoleLabel } from "@/lib/security/labels";
import type { StaffRole } from "@/lib/security/access";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Authorized Personnel Portal — TRUST ZERO AI" },
    { name: "description", content: "Secure staff login for the TRUST ZERO AI fictional hackathon Security Dashboard. Not connected to Abu Dhabi Police systems." },
    { property: "og:title", content: "Authorized Personnel Portal — TRUST ZERO AI" },
    { property: "og:description", content: "Authorized hackathon staff access only. No Abu Dhabi Police authentication integration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: StaffLogin,
});
function StaffLogin() {
  const { tr, dir, pick } = useI18n(); const session = useStaffSession(); const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (session.ready && session.securityAccess) void navigate({ to: "/security", replace: true }); }, [session.ready, session.securityAccess, navigate]);
  async function login(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) { setError("validation"); return; }
    setBusy(true);
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setPassword("");
      if (result.error) { setError("credentials"); return; }
      const checked = await supabase.auth.getUser();
      if (!checked.data.user) { setError("session"); return; }
      const roles = await supabase.from("user_roles").select("role").eq("user_id", checked.data.user.id);
      if (roles.error) { setError("access"); return; }
      if (!canAccessSecurity(roles.data.map(r => r.role))) { setError("forbidden"); return; }
      await navigate({ to: "/security", replace: true });
    } catch { setError("unavailable"); }
    finally { setBusy(false); }
  }
  return <div dir={dir}>
    <PageHeader eyebrow="TRUST ZERO AI" title={tr("Authorized Personnel Portal", "بوابة الموظفين المصرّح لهم")} description={tr("Abu Dhabi Police General Headquarters", "القيادة العامة لشرطة أبوظبي")} />
    <section className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3"><LockKeyhole className="size-7 text-emerald" /><h2 className="text-xl font-semibold">{tr("Employee login", "دخول الموظفين")}</h2></div>
      <p className="mb-6 border-s-4 border-emerald bg-accent p-3 text-sm font-medium">{tr("Hackathon Demo — Not Connected to Abu Dhabi Police Systems", "عرض تجريبي للهاكاثون — غير متصل بأنظمة شرطة أبوظبي")}</p>
      {session.ready && session.user && !session.securityAccess ? <div className="space-y-4"><p className="text-sm text-muted-foreground">{session.roles.map(role => pick(staffRoleLabel[role as StaffRole])).join(" · ")}</p><p role="alert" className="text-destructive">{pick(loginError['forbidden'])}</p><StaffSignOut /></div> :
        <form onSubmit={login} noValidate className="space-y-5">
          <div className="space-y-2"><Label htmlFor="staff-email">{tr("Email", "البريد الإلكتروني")}</Label><Input id="staff-email" type="email" dir="ltr" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} disabled={busy} required /></div>
          <div className="space-y-2"><Label htmlFor="staff-password">{tr("Password", "كلمة المرور")}</Label><Input id="staff-password" type="password" dir="ltr" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} required /></div>
          {error ? <p role="alert" className="text-sm text-destructive">{pick(loginError[error])}</p> : null}
          <Button type="submit" variant="emerald" className="w-full" disabled={busy || !session.ready}><LogIn />{busy ? tr("Logging in…", "جارٍ تسجيل الدخول…") : tr("Login", "تسجيل الدخول")}</Button>
        </form>}
    </section>
  </div>;
}