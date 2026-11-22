import { useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/i18n";
import { demoRegistrationSchema, type DemoRegistration, type DemoReceipt } from "@/lib/organizations/demo-schema";
import { submitDemoOrganization } from "@/lib/organizations/demo.functions";

const empty: DemoRegistration = { name: "", website: "", email: "", social: "", phone: "", sms: "" };
export function DemoRegistrationDialog({ trigger, onSubmitted }: { trigger: ReactNode; onSubmitted: (receipt: DemoReceipt) => void }) {
  const { tr, dir } = useI18n();
  const submit = useServerFn(submitDemoOrganization);
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState(empty);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const labels: Array<[keyof DemoRegistration, string, string, string]> = [
    ["name", tr("Company / Organization Name", "اسم الشركة / الجهة"), "text", "شركة المرجان التجريبية"],
    ["website", tr("Official Website URL", "رابط الموقع الرسمي"), "url", "https://coral-demo.example"],
    ["email", tr("Contact Email", "البريد الإلكتروني للتواصل"), "email", "contact@coral-demo.example"],
    ["social", tr("Social Media Account", "حساب التواصل الاجتماعي"), "text", "@CoralDemo"],
    ["phone", tr("Contact Phone Number", "رقم هاتف التواصل"), "tel", "+971 50 000 0000"],
    ["sms", tr("SMS Sender ID", "اسم مرسل الرسائل النصية"), "text", "CORAL-DEMO"],
  ];
  async function save(event: FormEvent) {
    event.preventDefault(); setError("");
    const parsed = demoRegistrationSchema.safeParse(fields);
    if (!parsed.success) { setInvalid(parsed.error.issues.map(i => String(i.path[0]))); return; }
    setInvalid([]); setBusy(true);
    try { onSubmitted(await submit({ data: parsed.data })); setOpen(false); setFields(empty); }
    catch { setError(tr("Unable to submit now. Please try again later.", "تعذّر إرسال الطلب الآن. حاول لاحقاً.")); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent dir={dir} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle>{tr("Add Organization", "إضافة جهة")}</DialogTitle><DialogDescription>{tr("Simulated / تجريبي — fictional details only. Use .example websites and emails. No ownership verification is performed.", "تجريبي / Simulated — بيانات خيالية فقط. استخدم نطاق .example للموقع والبريد. لا يُجرى تحقق فعلي من الملكية.")}</DialogDescription></DialogHeader>
    <form onSubmit={save} noValidate className="space-y-5"><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
      {labels.map(([key, label, type, placeholder]) => <div key={key} className="space-y-1.5"><Label htmlFor={`demo-${key}`}>{label}</Label><Input id={`demo-${key}`} type={type} dir={key === "name" ? "auto" : "ltr"} maxLength={key === "phone" || key === "sms" ? 30 : key === "name" ? 160 : 200} value={fields[key]} required placeholder={placeholder} aria-invalid={invalid.includes(key)} onChange={e => setFields(value => ({ ...value, [key]: e.target.value }))} />{invalid.includes(key) && <p className="text-xs text-destructive">{key === "website" || key === "email" ? tr("Enter a valid fictional .example address.", "أدخل عنواناً خيالياً صحيحاً ينتهي بـ .example.") : tr("Enter a valid value for this field.", "أدخل قيمة صحيحة لهذا الحقل.")}</p>}</div>)}
    </fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{tr("Cancel", "إلغاء")}</Button><Button type="submit" disabled={busy}>{busy ? tr("Submitting…", "جارٍ الإرسال…") : tr("Submit registration", "إرسال التسجيل")}</Button></DialogFooter></form>
  </DialogContent></Dialog>;
}