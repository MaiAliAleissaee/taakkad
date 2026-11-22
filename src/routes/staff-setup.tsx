import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/bits";
import { useI18n } from "@/lib/i18n/i18n";
import { directPasswordSetupSchema, setupTokenSchema } from "@/lib/security/staff-login-schema";
import { completeStaffPasswordSetup } from "@/lib/security/staff-login.functions";

export const Route = createFileRoute("/staff-setup")({
  head: () => ({ meta: [
    { title: "Staff Password Link — TRUST ZERO AI" },
    { name: "description", content: "Set a TRUST ZERO AI staff password privately with a single-use setup link." },
    { property: "og:title", content: "Staff Password Link — TRUST ZERO AI" },
    { property: "og:description", content: "Single-use private password setup for authorized TRUST ZERO AI demo staff." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }), component: StaffSetup,
});

function StaffSetup() {
  const { tr, dir } = useI18n();
  const [token, setToken] = useState(""); const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState(""); const [done, setDone] = useState(false);
  useEffect(() => {
    // The link secret lives in the fragment (never sent in requests or logs) and is removed from the address bar.
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    if (setupTokenSchema.safeParse(value).success) setToken(value);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); setError("");
    const parsed = directPasswordSetupSchema.safeParse({ token, password, confirmation });
    if (!parsed.success) { setError("validation"); return; }
    setBusy(true);
    try {
      const result = await completeStaffPasswordSetup({ data: parsed.data });
      setPassword(""); setConfirmation("");
      if (!result.ok) { setError(result.reason); return; }
      setToken(""); setDone(true);
    } catch { setError("busy"); } finally { setBusy(false); }
  }
  return <div dir={dir}><PageHeader eyebrow="TRUST ZERO AI" title={tr("Private password setup", "تعيين كلمة المرور بشكل خاص")} description={tr("Authorized staff account", "حساب موظف مصرّح له")} />
    <section className="mx-auto max-w-md px-4 py-8 sm:px-6">
      {done ? <p role="status">{tr("Password saved. Sign in with your staff ID and new password.", "تم حفظ كلمة المرور. سجّل الدخول بمعرّف الموظف وكلمة المرور الجديدة.")}</p> : token ? <form className="space-y-5" onSubmit={save}>
        <div className="space-y-2"><Label htmlFor="new-password">{tr("New password (at least 12 characters)", "كلمة المرور الجديدة (12 حرفاً على الأقل)")}</Label><Input id="new-password" dir="ltr" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></div>
        <div className="space-y-2"><Label htmlFor="confirm-password">{tr("Confirm password", "تأكيد كلمة المرور")}</Label><Input id="confirm-password" dir="ltr" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></div>
        <Button variant="emerald" className="w-full" disabled={busy}><LockKeyhole />{tr("Save password", "حفظ كلمة المرور")}</Button>
      </form> : <p role="status">{tr("Open your single-use staff setup link. Missing, used or expired links cannot set a password.", "افتح رابط الإعداد الخاص بك للاستخدام مرة واحدة. لا يمكن تعيين كلمة المرور برابط مفقود أو مستخدم أو منتهي الصلاحية.")}</p>}
      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error === "validation" ? tr("Use at least 12 characters and matching passwords.", "استخدم 12 حرفاً على الأقل وكلمتي مرور متطابقتين.") : error === "busy" ? tr("Password was not saved because the service is busy. Your link is still valid; wait a few minutes and try again.", "لم تُحفظ كلمة المرور لانشغال الخدمة. لا يزال الرابط صالحاً؛ انتظر بضع دقائق وحاول مجدداً.") : tr("This link is invalid, used or expired. Your password was not changed. Ask for a new setup link.", "هذا الرابط غير صالح أو مستخدم أو منتهي الصلاحية. لم تتغير كلمة المرور. اطلب رابط إعداد جديداً.")}</p> : null}
      <Button asChild variant="link" className="mt-4"><Link to="/auth">{tr("Return to staff login", "العودة لدخول الموظفين")}</Link></Button>
    </section></div>;
}
