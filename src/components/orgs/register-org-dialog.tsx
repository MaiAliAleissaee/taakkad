import { CheckCircle2, Download, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChannelType, Organization, OrgType } from "@/lib/domain/types";
import { refreshOrganizationRegistry, useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel, orgTypeLabel } from "@/lib/i18n/labels";
import { parseDomains, validateRegistration, type RegistrationError } from "@/lib/services/registration";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { saveOrganizationApplication } from "@/lib/organizations/applications.functions";
import { useStaffSession } from "@/lib/security/session";
import { documentsSchema, type ApplicationDocument } from "@/lib/organizations/schema";

const CHANNEL_TYPES: ChannelType[] = ["email", "sms", "phone", "website", "social", "other"];
const ORG_TYPES: OrgType[] = ["government", "bank", "business"];

export function downloadApplicationDocument(document: ApplicationDocument) {
  const bytes = Uint8Array.from(atob(document.content), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: document.type }));
  const link = window.document.createElement("a"); link.href = url; link.download = document.name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export type ApplicationEditor = { id: string; revision: number; payload: Organization; documents: ApplicationDocument[]; reference: string; editable: boolean };

export function RegisterOrgDialog({ trigger, application }: { trigger: React.ReactNode; application?: ApplicationEditor }) {
  const { tr, pick } = useI18n();
  const { organizations } = useDemoState();
  const [open, setOpen] = useState(false);
  const [nameEn, setNameEn] = useState(application?.payload.name.en ?? "");
  const [nameAr, setNameAr] = useState(application?.payload.name.ar ?? "");
  const [type, setType] = useState<OrgType>(application?.payload.type ?? "business");
  const [domainsRaw, setDomainsRaw] = useState(application?.payload.domains.join(", ") ?? "");
  const [contactEmail, setContactEmail] = useState(application?.payload.contactEmail ?? "");
  const [channels, setChannels] = useState<Array<{ type: ChannelType; value: string }>>(application?.payload.channels.map(c => ({ type: c.type, value: c.value })) ?? [{ type: "email", value: "" }]);
  const [errors, setErrors] = useState<RegistrationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<ApplicationDocument[]>(application?.documents ?? []);
  const [saveError, setSaveError] = useState("");
  const [savedReference, setSavedReference] = useState("");
  const session = useStaffSession();
  const saveApplication = useServerFn(saveOrganizationApplication);
  const queryClient = useQueryClient();

  const reset = () => {
    setNameEn(""); setNameAr(""); setType("business"); setDomainsRaw(""); setContactEmail("");
    setChannels([{ type: "email", value: "" }]); setErrors([]);
  };

  const orgName = (id: string) => pick(organizations.find((o) => o.id === id)?.name);

  const errorText = (e: RegistrationError): string => {
    switch (e.code) {
      case "required":
        return e.field === "channels" ? tr("Add at least one approved channel.", "أضف قناة معتمدة واحدة على الأقل.")
          : e.field === "domains" ? tr("Add at least one official domain.", "أضف نطاقاً رسمياً واحداً على الأقل.")
          : tr("This field is required.", "هذا الحقل مطلوب.");
      case "invalid":
        return e.field === "domains" ? tr("Use plain domains like example-bank.example.", "استخدم نطاقات مثل example-bank.example.") : tr("Enter a valid email address.", "أدخل بريداً إلكترونياً صحيحاً.");
      case "taken":
        return tr(`${e.domain} is already registered by ${orgName(e.orgId)}.`, `${e.domain} مسجّل مسبقاً لدى ${orgName(e.orgId)}.`);
      case "lookalike":
        return tr(`${e.domain} closely resembles ${e.target} (${orgName(e.orgId)}). Registration blocked for manual review.`, `${e.domain} يشبه كثيراً ${e.target} (${orgName(e.orgId)}). تم حظر التسجيل لحين المراجعة اليدوية.`);
      case "outside_domains":
        return tr("Email and website channels must use one of the domains above.", "يجب أن تستخدم قنوات البريد والموقع أحد النطاقات أعلاه.");
      case "empty_value":
        return tr("Enter a value for this channel.", "أدخل قيمة لهذه القناة.");
    }
  };

  const fieldErrors = (field: RegistrationError["field"]) => errors.filter((e) => e.field === field && !("index" in e));
  const channelError = (index: number) => errors.find((e) => "index" in e && e.index === index);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const domains = parseDomains(domainsRaw);
    const input = { nameEn, nameAr, type, domains, contactEmail, channels };
    if (!session.user) { setSaveError(tr("Sign in as the applicant before submitting.", "سجّل الدخول بصفتك مقدم الطلب قبل الإرسال.")); return; }
    const found = validateRegistration(input, organizations.filter(o => o.id !== application?.payload.id));
    setErrors(found);
    if (found.length) return;
    setSubmitting(true);
    setSaveError("");
    try {
      const saved = await saveApplication({ data: { ...(application ? { id: application.id } : {}), revision: application?.revision ?? 0, registration: input, documents: documentsSchema.parse(documents) } });
      setSavedReference(saved.reference);
      await queryClient.invalidateQueries({ queryKey: ["organization-applications"] });
      await refreshOrganizationRegistry();
      toast.success(tr("Application saved — pending independent review", "تم حفظ الطلب — بانتظار المراجعة المستقلة"));
      if (application) setOpen(false); else reset();
    } catch { setSaveError(tr("Unable to save. Check your access, registration details and the original editing deadline, then reload.", "تعذّر الحفظ. تحقق من صلاحياتك وبيانات التسجيل وموعد انتهاء التعديل الأصلي، ثم أعد التحميل.")); }
    finally { setSubmitting(false); }
  };

  const FieldError = ({ list }: { list: RegistrationError[] }) =>
    list.length ? <div className="space-y-1">{list.map((e, i) => <p key={i} className="text-xs text-destructive">{errorText(e)}</p>)}</div> : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErrors([]); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{application ? tr("Track / Edit My Application", "متابعة / تعديل طلبي") : tr("Register an organization", "تسجيل جهة")}</DialogTitle>
          <DialogDescription>
            {tr("New registrations start as pending until verification checks are completed. Use fictional details only.", "تبدأ التسجيلات الجديدة بحالة «قيد المراجعة» حتى اكتمال التحقق. استخدم بيانات خيالية فقط.")}
          </DialogDescription>
        </DialogHeader>
        {savedReference && !application ? <div className="space-y-4"><CheckCircle2 className="size-8 text-verified" /><p>{tr("Application reference", "رقم مرجع الطلب")}</p><p className="break-all font-mono" dir="ltr">{savedReference}</p><Button onClick={() => { setOpen(false); document.getElementById("organization-access")?.scrollIntoView({ behavior: "smooth" }); }}>{tr("Track / Edit My Application", "متابعة / تعديل طلبي")}</Button></div> : <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {application && <p className="break-all font-mono text-xs" dir="ltr">{application.reference}</p>}
          {!session.user && <p className="text-sm text-muted-foreground">{tr("Applicant authentication is required to save and track your original application.", "يلزم تسجيل الدخول لحفظ طلبك الأصلي ومتابعته.")} <Button type="button" variant="link" onClick={() => { setOpen(false); document.getElementById("organization-access")?.scrollIntoView({ behavior: "smooth" }); }}>{tr("Applicant login", "دخول مقدم الطلب")}</Button></p>}
          {application && !application.editable && <p role="status" className="text-sm text-muted-foreground">{tr("Read only. The original 24-hour editing window has ended. Further corrections require an officer's request.", "للقراءة فقط. انتهت مهلة التعديل الأصلية البالغة 24 ساعة. تتطلب التصحيحات اللاحقة طلباً من الموظف المخوّل.")}</p>}
          <fieldset disabled={submitting || (application !== undefined && !application.editable)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nameEn">{tr("Name (English)", "الاسم (بالإنجليزية)")}</Label>
              <Input id="nameEn" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Coral Bay Credit Union" />
              <FieldError list={fieldErrors("nameEn")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nameAr">{tr("Name (Arabic)", "الاسم (بالعربية)")}</Label>
              <Input id="nameAr" dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="اتحاد خليج المرجان الائتماني" />
              <FieldError list={fieldErrors("nameAr")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orgType">{tr("Organization type", "نوع الجهة")}</Label>
              <NativeSelect id="orgType" value={type} onChange={(e) => setType(e.target.value as OrgType)}>
                {ORG_TYPES.map((t) => <option key={t} value={t}>{pick(orgTypeLabel[t])}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">{tr("Security contact email", "بريد جهة الاتصال الأمنية")}</Label>
              <Input id="contactEmail" dir="ltr" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="security@coralbay.example" />
              <FieldError list={fieldErrors("contactEmail")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="domains">{tr("Official domains", "النطاقات الرسمية")}</Label>
            <Input id="domains" dir="ltr" className="font-mono" value={domainsRaw} onChange={(e) => setDomainsRaw(e.target.value)} placeholder="coralbay.example, app.coralbay.example" />
            <p className="text-xs text-muted-foreground">{tr("Separate several domains with commas.", "افصل بين النطاقات بفواصل.")}</p>
            <FieldError list={fieldErrors("domains")} />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{tr("Approved communication channels", "قنوات التواصل المعتمدة")}</legend>
            {channels.map((c, i) => {
              const err = channelError(i);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2">
                    <div className="w-44 shrink-0">
                      <NativeSelect aria-label={tr("Channel type", "نوع القناة")} value={c.type} onChange={(e) => setChannels((list) => list.map((x, j) => (j === i ? { ...x, type: e.target.value as ChannelType } : x)))}>
                        {CHANNEL_TYPES.map((t) => <option key={t} value={t}>{pick(channelLabel[t])}</option>)}
                      </NativeSelect>
                    </div>
                    <Input
                      dir="ltr"
                      className="font-mono"
                      aria-label={tr("Channel value", "قيمة القناة")}
                      value={c.value}
                      onChange={(e) => setChannels((list) => list.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                      placeholder={{ email: "alerts@coralbay.example", sms: "CORALBAY", phone: "+971 4 000 0400", website: "www.coralbay.example", social: "@CoralBay", other: "coralbay-app.example" }[c.type]}
                    />
                    <Button type="button" variant="ghost" size="icon" aria-label={tr("Remove channel", "إزالة القناة")} onClick={() => setChannels((list) => list.filter((_, j) => j !== i))}>
                      <Trash2 />
                    </Button>
                  </div>
                  {err ? <p className="text-xs text-destructive">{errorText(err)}</p> : null}
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={() => setChannels((list) => [...list, { type: "sms", value: "" }])}>
              <Plus />{tr("Add channel", "إضافة قناة")}
            </Button>
            <FieldError list={fieldErrors("channels")} />
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="application-documents">{tr("Supporting documents (fictional only)", "المستندات الداعمة (خيالية فقط)")}</Label>
            <Input id="application-documents" type="file" accept="application/pdf,text/plain,image/png,image/jpeg" multiple onChange={async e => {
              const files = Array.from(e.target.files ?? []); e.target.value = "";
              if (files.length + documents.length > 3 || files.some(f => f.size > 256 * 1024 || !["application/pdf", "text/plain", "image/png", "image/jpeg"].includes(f.type))) { setSaveError(tr("Maximum three PDF, text, PNG or JPEG documents; 256 KB each.", "ثلاثة مستندات كحد أقصى بصيغة PDF أو نص أو PNG أو JPEG؛ 256 كيلوبايت لكل منها.")); return; }
              const added = await Promise.all(files.map(async file => { const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return documentsSchema.element.parse({ id: crypto.randomUUID(), name: file.name, type: file.type, content: btoa(binary) }); }));
              setDocuments(list => [...list, ...added]); setSaveError("");
            }} />
            {documents.map(d => <div key={d.id} className="flex items-center gap-2"><span className="min-w-0 flex-1 break-all text-sm" dir="auto">{d.name}</span><Button type="button" variant="ghost" size="icon" title={tr("Download document", "تنزيل المستند")} aria-label={tr("Download document", "تنزيل المستند")} onClick={() => downloadApplicationDocument(d)}><Download /></Button><Button type="button" variant="ghost" size="icon" aria-label={tr("Remove document", "إزالة المستند")} onClick={() => setDocuments(list => list.filter(x => x.id !== d.id))}><Trash2 /></Button></div>)}
          </div>
          </fieldset>
          {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tr("Cancel", "إلغاء")}</Button>
            <Button type="submit" disabled={submitting || !session.user || (application !== undefined && !application.editable)}>{application ? tr("Save changes to this application", "حفظ التعديلات على هذا الطلب") : tr("Submit registration", "إرسال التسجيل")}</Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
