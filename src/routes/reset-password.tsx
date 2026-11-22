import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/bits";
import { useI18n } from "@/lib/i18n/i18n";
import { passwordSetupSchema } from "@/lib/security/staff-login-schema";

declare global { interface Window { trustZeroRecoveryDigest?: Promise<string>; } }

function tokenDigest(token: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)).then(bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join(""));
}

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Private Staff Password Setup — TRUST ZERO AI" },
    { name: "description", content: "Privately set your TRUST ZERO AI staff password using a secure account recovery link." },
    { property: "og:title", content: "Private Staff Password Setup — TRUST ZERO AI" },
    { property: "og:description", content: "Secure password recovery for authorized TRUST ZERO AI hackathon staff." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ], scripts: [{ children: "(()=>{const p=new URLSearchParams(location.hash.slice(1));const t=p.get('access_token');if(p.get('type')==='recovery'&&t){window.trustZeroRecoveryDigest=crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join(''));}})();" }] }), component: ResetPassword,
});

function ResetPassword() {
  const { tr, dir } = useI18n();
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState(""); const [done, setDone] = useState(false);
  useEffect(() => {
    let alive = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    // Auth clears the callback hash before React mounts; the head captures only its digest, never its tokens.
    const recoveryDigest = window.trustZeroRecoveryDigest ?? (hash.get("type") === "recovery" && hash.get("access_token") ? tokenDigest(hash.get("access_token") ?? "") : null);
    if (!recoveryDigest) return;
    void (async () => {
      const current = await supabase.auth.getSession();
      if (!current.data.session || await tokenDigest(current.data.session.access_token) !== await recoveryDigest) return;
      const checked = await supabase.auth.getUser();
      if (alive && checked.data.user) { setReady(true); window.history.replaceState(null, "", window.location.pathname); }
    })();
    return () => { alive = false; };
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); setError("");
    const parsed = passwordSetupSchema.safeParse({ password, confirmation });
    if (!ready || !parsed.success) { setError("validation"); return; }
    setBusy(true);
    try {
      const checked = await supabase.auth.getUser();
      if (!checked.data.user) { setReady(false); setError("expired"); return; }
      const result = await supabase.auth.updateUser({ password: parsed.data.password });
      if (result.error) { setError("failed"); return; }
      setPassword(""); setConfirmation("");
      const signedOut = await supabase.auth.signOut();
      if (signedOut.error) { setError("logout"); return; }
      setDone(true); setReady(false);
      delete window.trustZeroRecoveryDigest;
    } catch { setError("failed"); } finally { setBusy(false); }
  }
  return <div dir={dir}><PageHeader eyebrow="TRUST ZERO AI" title={tr("Private password setup", "تعيين كلمة المرور بشكل خاص")} description={tr("Authorized staff account", "حساب موظف مصرّح له")} />
    <section className="mx-auto max-w-md px-4 py-8 sm:px-6">
      {done ? <p role="status">{tr("Password saved. Sign in with your staff ID and new password.", "تم حفظ كلمة المرور. سجّل الدخول بمعرّف الموظف وكلمة المرور الجديدة.")}</p> : ready ? <form className="space-y-5" onSubmit={save}>
        <div className="space-y-2"><Label htmlFor="new-password">{tr("New password (at least 12 characters)", "كلمة المرور الجديدة (12 حرفاً على الأقل)")}</Label><Input id="new-password" dir="ltr" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></div>
        <div className="space-y-2"><Label htmlFor="confirm-password">{tr("Confirm password", "تأكيد كلمة المرور")}</Label><Input id="confirm-password" dir="ltr" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></div>
        <Button variant="emerald" className="w-full" disabled={busy}><LockKeyhole />{tr("Save password", "حفظ كلمة المرور")}</Button>
      </form> : <p role="status">{tr("Open the secure password link from your email. Missing or expired links cannot set a password.", "افتح رابط كلمة المرور الآمن من بريدك الإلكتروني. لا يمكن تعيين كلمة المرور برابط مفقود أو منتهي الصلاحية.")}</p>}
      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error === "validation" ? tr("Use at least 12 characters and matching passwords.", "استخدم 12 حرفاً على الأقل وكلمتي مرور متطابقتين.") : error === "logout" ? tr("Password saved, but logout failed. Please log out before signing in again.", "تم حفظ كلمة المرور، لكن تعذّر الخروج. سجّل الخروج قبل الدخول مجدداً.") : tr("Unable to complete password setup. Try again or request a new email link.", "تعذّر إكمال تعيين كلمة المرور. حاول مجدداً أو اطلب رابطاً جديداً.")}</p> : null}
      <Button asChild variant="link" className="mt-4"><Link to="/auth">{tr("Return to staff login", "العودة لدخول الموظفين")}</Link></Button>
    </section></div>;
}