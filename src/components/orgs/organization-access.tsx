import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { signInStaff } from "@/lib/security/staff-login.functions";
import { staffLoginSchema } from "@/lib/security/staff-login-schema";
import { supabase } from "@/integrations/supabase/client";
import { useStaffSession } from "@/lib/security/session";
import { useI18n } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { isVerificationOfficer } from "@/lib/organizations/schema";
import { ClipboardCheck } from "lucide-react";
import { staffAuthFailure, staffAuthMessages } from "@/lib/security/auth-errors";

export function OrganizationAccess() {
  const { tr, pick, dir } = useI18n();
  const session = useStaffSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(e: FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const parsed = staffLoginSchema.safeParse({ identifier: email, password });
      if (!parsed.success) { setError(pick(staffAuthMessages.credentials)); return; }
      const signedIn = await signInStaff({ data: parsed.data });
      if (!signedIn.ok) { setError(pick(staffAuthMessages[signedIn.reason])); return; }
      const result = await supabase.auth.setSession({ access_token: signedIn.accessToken, refresh_token: signedIn.refreshToken });
      if (result.error) { setError(pick(staffAuthMessages[staffAuthFailure(result.error)])); return; }
      const checked = await supabase.auth.getUser();
      if (!checked.data.user) throw new Error("Session unavailable");
      setPassword("");
      const roles = await supabase.from("user_roles").select("role").eq("user_id", checked.data.user.id);
      if (isVerificationOfficer((roles.data ?? []).map(r => r.role))) await navigate({ to: "/officer" });
    } catch { setError(pick(staffAuthMessages.unavailable)); }
    finally { setPassword(""); setBusy(false); }
  }
  async function signOut() {
    setBusy(true); await queryClient.cancelQueries(); queryClient.clear();
    const result = await supabase.auth.signOut();
    if (result.error) setError(tr("Sign out failed. Please try again.", "تعذّر تسجيل الخروج. حاول مجدداً."));
    setBusy(false);
  }

  return <div id="organization-access" dir={dir} className="mb-8 scroll-mt-24 border-b pb-8">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="size-5 text-emerald" />{tr("Authorized Officer Login", "دخول الموظف المخوّل")}</h2>{session.user && <div className="flex flex-wrap gap-2">{session.securityAccess && <Button asChild variant="emerald" size="sm"><Link to="/security"><LayoutDashboard />{tr("Open Security Dashboard", "فتح لوحة الأمن")}</Link></Button>}<Button variant="outline" size="sm" onClick={signOut} disabled={busy}><LogOut />{tr("Logout", "تسجيل الخروج")}</Button></div>}</div>
    {!session.user ? <form onSubmit={login} className="max-w-xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="organization-login-email">{tr("Staff username", "اسم مستخدم الموظف")}</Label><Input id="organization-login-email" type="text" dir="ltr" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="organization-login-password">{tr("Password", "كلمة المرور")}</Label><Input id="organization-login-password" type="password" dir="ltr" autoComplete="current-password" minLength={1} required value={password} onChange={e => setPassword(e.target.value)} /></div></div>
      <Button type="submit" disabled={busy || !session.ready}><LogIn />{tr("Login", "تسجيل الدخول")}</Button>
      <Button asChild variant="link"><Link to="/auth">{tr("Set or reset password privately", "تعيين كلمة المرور أو إعادة ضبطها بشكل خاص")}</Link></Button>
      <p className="text-xs text-muted-foreground">{tr("Officer access requires an independently assigned verification-officer role.", "يتطلب دخول الموظفين دور مراجع مُعيّناً بشكل مستقل.")}</p>
    </form> : <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{isVerificationOfficer(session.roles) ? tr("Application review happens in the dedicated staff workspace.", "تتم مراجعة الطلبات في مساحة عمل الموظفين المخصصة.") : tr("This account has no verification-officer role.", "لا يملك هذا الحساب دور موظف التحقق.")}</p>
      {isVerificationOfficer(session.roles) && <Button asChild variant="emerald"><Link to="/officer"><ClipboardCheck />{tr("Open Officer Dashboard", "فتح لوحة موظف التحقق")}</Link></Button>}
    </div>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
  </div>;
}