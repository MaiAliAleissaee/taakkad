import { Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { StepProgress } from "@/components/common/step-progress";
import { Mono } from "@/components/common/bits";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChannelType, OrgType } from "@/lib/domain/types";
import { repository, uid, useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel, orgTypeLabel } from "@/lib/i18n/labels";
import { parseDomains, toChannels, validateRegistration, type RegistrationError } from "@/lib/services/registration";
import { demoSignatureService } from "@/lib/services/signatures";

const CHANNEL_TYPES: ChannelType[] = ["email", "sms", "phone", "website", "social", "other"];
const ORG_TYPES: OrgType[] = ["government", "bank", "business"];

export function RegisterOrgDialog({ trigger }: { trigger: React.ReactNode }) {
  const { tr, pick } = useI18n();
  const { organizations } = useDemoState();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [type, setType] = useState<OrgType>("business");
  const [domainsRaw, setDomainsRaw] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [channels, setChannels] = useState<Array<{ type: ChannelType; value: string }>>([{ type: "email", value: "" }]);
  const [errors, setErrors] = useState<RegistrationError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(0); setNameEn(""); setNameAr(""); setType("business"); setDomainsRaw(""); setContactEmail("");
    setChannels([{ type: "email", value: "" }]); setErrors([]);
  };

  const orgName = (id: string) => pick(organizations.find((o) => o.id === id)?.name);

  const errorText = (e: RegistrationError): string => {
    switch (e.code) {
      case "required":
        return e.field === "channels" ? tr("Add at least one requested channel.", "أضف قناة مطلوبة واحدة على الأقل.")
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

  const advance = () => {
    const found = validateRegistration({ nameEn, nameAr, type, domains: parseDomains(domainsRaw), contactEmail, channels }, organizations);
    const relevant = found.filter(e => step === 0 ? ["nameEn", "nameAr", "contactEmail"].includes(e.field) : ["domains", "channels"].includes(e.field));
    setErrors(relevant);
    if (!relevant.length) setStep(s => Math.min(s + 1, 2));
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (step < 2) { advance(); return; }
    const domains = parseDomains(domainsRaw);
    const input = { nameEn, nameAr, type, domains, contactEmail, channels };
    const found = validateRegistration(input, organizations);
    setErrors(found);
    if (found.length) { setStep(found.some(e => ["nameEn", "nameAr", "contactEmail"].includes(e.field)) ? 0 : 1); return; }
    setSubmitting(true);
    const keyFingerprint = await demoSignatureService.fingerprint(`${nameEn}|${domains.join(",")}|${Date.now()}`);
    repository.addOrganization({
      id: uid("org"),
      name: { en: nameEn.trim(), ar: nameAr.trim() },
      type,
      domains,
      channels: toChannels(channels, () => uid("ch")),
      status: "pending",
      registeredAt: new Date().toISOString(),
      contactEmail: contactEmail.trim(),
      keyFingerprint,
    });
    setSubmitting(false);
    toast.success(tr("Organization registered — pending verification", "تم تسجيل الجهة — بانتظار التوثيق"));
    reset();
    setOpen(false);
  };

  const FieldError = ({ list }: { list: RegistrationError[] }) =>
    list.length ? <div className="space-y-1">{list.map((e, i) => <p key={i} className="text-xs text-destructive">{errorText(e)}</p>)}</div> : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErrors([]); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Register an organization", "تسجيل جهة")}</DialogTitle>
          <DialogDescription>
            {tr("New registrations start as pending until verification checks are completed. Use fictional details only.", "تبدأ التسجيلات الجديدة بحالة «قيد المراجعة» حتى اكتمال التحقق. استخدم بيانات خيالية فقط.")}
          </DialogDescription>
        </DialogHeader>
        <StepProgress current={step} steps={[tr("Organization", "الجهة"), tr("Domains & channels", "النطاقات والقنوات"), tr("Review", "المراجعة")]} />
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {errors.length > 0 && <p role="alert" className="text-sm text-destructive">{tr("Please check the highlighted fields.", "يُرجى مراجعة الحقول الموضحة أدناه.")}</p>}
          {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
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
          </div>}
          {step === 1 && <>
          <div className="space-y-1.5">
            <Label htmlFor="domains">{tr("Official domains", "النطاقات الرسمية")}</Label>
            <Input id="domains" dir="ltr" className="font-mono" value={domainsRaw} onChange={(e) => setDomainsRaw(e.target.value)} placeholder="coralbay.example, app.coralbay.example" />
            <p className="text-xs text-muted-foreground">{tr("Separate several domains with commas.", "افصل بين النطاقات بفواصل.")}</p>
            <FieldError list={fieldErrors("domains")} />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{tr("Requested communication channels", "قنوات التواصل المطلوبة")}</legend>
            {channels.map((c, i) => {
              const err = channelError(i);
              return (
                <div key={i} className="space-y-1">
                  <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[10rem_1fr_auto]">
                    <div className="col-span-2 min-w-0 sm:col-span-1">
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
          </>}
          {step === 2 && <div className="space-y-4">
            <h3 className="text-lg font-semibold">{tr("Review your request", "راجع طلبك")}</h3>
            <dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">{tr("Organization", "الجهة")}</dt><dd className="mt-1 font-medium">{nameAr} · {nameEn}</dd></div><div><dt className="text-muted-foreground">{tr("Contact email", "بريد التواصل")}</dt><dd><Mono>{contactEmail}</Mono></dd></div><div><dt className="text-muted-foreground">{tr("Domains", "النطاقات")}</dt><dd className="break-all"><Mono>{domainsRaw}</Mono></dd></div></dl>
            <ul className="space-y-2">{channels.map((c, i) => <li key={i} className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm"><span>{pick(channelLabel[c.type])}</span><Mono className="break-all">{c.value}</Mono></li>)}</ul>
            <p className="border-s-2 border-unverified bg-unverified-soft p-3 text-sm text-unverified">{tr("Submitting does not certify your organization or its channels. Both require independent simulated review.", "الإرسال لا يوثّق جهتك أو قنواتها. كلاهما يتطلب مراجعة مستقلة افتراضية.")}</p>
          </div>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tr("Cancel", "إلغاء")}</Button>
            {step > 0 && <Button type="button" variant="outline" onClick={() => { setErrors([]); setStep(s => s - 1); }}><ArrowLeft className="rtl:rotate-180" />{tr("Back", "السابق")}</Button>}
            {step < 2 ? <Button key="continue" type="button" onClick={advance}>{tr("Continue", "متابعة")}<ArrowRight className="rtl:rotate-180" /></Button> : <Button key="submit" type="submit" disabled={submitting}>{submitting ? tr("Submitting…", "جارٍ الإرسال…") : tr("Submit registration", "إرسال التسجيل")}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
