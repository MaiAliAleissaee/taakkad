import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
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

const CHANNEL_TYPES: ChannelType[] = ["email", "sms", "phone", "website", "social"];
const ORG_TYPES: OrgType[] = ["government", "bank", "business"];

export function RegisterOrgDialog({ trigger }: { trigger: React.ReactNode }) {
  const { tr, pick } = useI18n();
  const { organizations } = useDemoState();
  const [open, setOpen] = useState(false);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [type, setType] = useState<OrgType>("business");
  const [domainsRaw, setDomainsRaw] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [channels, setChannels] = useState<Array<{ type: ChannelType; value: string }>>([{ type: "email", value: "" }]);
  const [errors, setErrors] = useState<RegistrationError[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
    const found = validateRegistration(input, organizations);
    setErrors(found);
    if (found.length) return;
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
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
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
                      placeholder={{ email: "alerts@coralbay.example", sms: "CORALBAY", phone: "+971 4 000 0400", website: "www.coralbay.example", social: "@CoralBay" }[c.type]}
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
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tr("Cancel", "إلغاء")}</Button>
            <Button type="submit" disabled={submitting}>{tr("Submit registration", "إرسال التسجيل")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
