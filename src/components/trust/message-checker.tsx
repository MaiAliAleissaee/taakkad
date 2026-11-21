import { ScanSearch, ShieldCheck, Info, ArrowRight } from "lucide-react";
import { useHydrated } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { NativeSelect } from "@/components/common/native-select";
import { RiskMeter } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChannelType } from "@/lib/domain/types";
import { useBlocklist } from "@/lib/data/hooks";
import { useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel, trustStateHelp } from "@/lib/i18n/labels";
import { assessMessage, type MessageInput } from "@/lib/services/verification";
import { recognizeChannel, registryPresentation } from "@/lib/services/input-recognition";
import { ReasonList } from "./reason-list";
import { ReportButton } from "./report-button";
import { TrustBadge } from "./trust-badge";
import { demoText } from "@/lib/i18n/demo-content";

const EXAMPLES: Array<{ label: { en: string; ar: string }; input: MessageInput }> = [
  { label: { en: "Lookalike bank link", ar: "رابط بنك مشابه" }, input: { channel: "sms", sender: "FALCONBNK", url: "https://fa1conbank.example/login", body: "Your card is blocked. Log in to unlock.", claimedOrgId: "org-falcon" } },
  { label: { en: "Official registry email", ar: "بريد في السجل الرسمي" }, input: { channel: "email", sender: "notices@alnoor.gov.example", url: "https://services.alnoor.gov.example", body: "Your document is ready for collection." } },
  { label: { en: "Unknown shop newsletter", ar: "نشرة متجر غير معروف" }, input: { channel: "email", sender: "offers@desertbloom-shop.example", url: "https://desertbloom-shop.example", body: "New arrivals this week." } },
];

export function MessageChecker() {
  const { tr, pick, lang } = useI18n();
  const ready = useHydrated();
  const { organizations } = useDemoState();
  const blocklist = useBlocklist();
  const [input, setInput] = useState<MessageInput>({ channel: "sms", sender: "", url: "", body: "" });
  const [checkedInput, setCheckedInput] = useState<MessageInput | null>(null);
  const [error, setError] = useState(false);
  const recognized = recognizeChannel(input.sender);
  const result = checkedInput ? { input: checkedInput, assessment: assessMessage(checkedInput, { organizations, blocklist }) } : null;
  const run = (value: MessageInput) => {
    if (!value.sender.trim() && !value.url?.trim()) { setError(true); return; }
    setError(false); setCheckedInput(value);
  };
  const onSubmit = (e: FormEvent) => { e.preventDefault(); run(input); };

  return <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
    <form onSubmit={onSubmit} className="min-w-0 space-y-5" noValidate>
      <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-primary"><ScanSearch /></span><div><h2 className="text-xl font-semibold">{tr("Check a message or link", "تحقّق من رسالة أو رابط")}</h2><p className="mt-1 text-sm text-muted-foreground">{tr("A private check against the fictional channel registry.", "فحص خاص مقابل سجل قنوات التواصل الخيالي.")}</p></div></div>
      <div className="space-y-2">
        <Label htmlFor="chk-sender">{tr("Phone, email, sender ID or link", "رقم هاتف أو بريد أو معرّف مرسل أو رابط")}</Label>
        <Input id="chk-sender" dir="ltr" className="h-14 font-mono placeholder:font-sans" value={input.sender} disabled={!ready} onChange={(e) => { const sender = e.target.value; setInput({ ...input, sender, channel: recognizeChannel(sender) ?? input.channel }); setError(false); }} placeholder={tr("Paste a phone, email or link", "ألصق رقم هاتف أو بريداً أو رابطاً")} aria-invalid={error} aria-describedby={error ? "check-error" : "check-privacy"} />
        {recognized && <p className="text-xs text-primary">{tr("Channel type:", "نوع القناة:")} {pick(channelLabel[input.channel])}</p>}
        {!recognized && input.sender.trim() && <div className="max-w-xs space-y-2"><Label htmlFor="chk-channel">{tr("Received via", "وصلت عبر")}</Label><NativeSelect id="chk-channel" value={input.channel} onChange={(e) => setInput({ ...input, channel: e.target.value as ChannelType })}>{(["sms", "email", "phone", "social", "website", "other"] as const).map(c => <option key={c} value={c}>{pick(channelLabel[c])}</option>)}</NativeSelect></div>}
        {error && <p id="check-error" role="alert" className="text-sm text-destructive">{tr("Enter a sender or a link to check.", "أدخل مرسلاً أو رابطاً للتحقق.")}</p>}
      </div>
      <Button type="submit" size="lg" disabled={!ready} className="w-full sm:w-auto"><ScanSearch />{tr("Check now", "تحقّق الآن")}<ArrowRight className="rtl:rotate-180" /></Button>
      <p id="check-privacy" className="text-xs leading-relaxed text-muted-foreground">{tr("Nothing is sent externally. Links are never opened. A channel match is not message authentication.", "لا يُرسل شيء خارج المتصفح ولا تُفتح الروابط. مطابقة القناة لا تعني توثيق الرسالة.")}</p>
      <details className="border-y py-4">
        <summary className="text-sm font-medium">{tr("More details (optional)", "تفاصيل إضافية (اختيارية)")}</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {recognized && <div className="space-y-2"><Label htmlFor="chk-channel-override">{tr("Received via", "وصلت عبر")}</Label><NativeSelect id="chk-channel-override" value={input.channel} onChange={(e) => setInput({ ...input, channel: e.target.value as ChannelType })}>{(["sms", "email", "phone", "social", "website", "other"] as const).map(c => <option key={c} value={c}>{pick(channelLabel[c])}</option>)}</NativeSelect></div>}
          <div className="space-y-2"><Label htmlFor="chk-claim">{tr("Claims to be from", "يدّعي أنه من")}</Label><NativeSelect id="chk-claim" value={input.claimedOrgId ?? ""} onChange={(e) => setInput({ ...input, claimedOrgId: e.target.value || undefined })}><option value="">{tr("Not stated / unsure", "غير مذكور / غير متأكد")}</option>{organizations.map(o => <option key={o.id} value={o.id}>{pick(o.name)}</option>)}</NativeSelect></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="chk-url">{tr("Link in the message (optional)", "الرابط في الرسالة (اختياري)")}</Label><Input id="chk-url" dir="ltr" value={input.url ?? ""} onChange={(e) => setInput({ ...input, url: e.target.value })} placeholder="https://…" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="chk-body">{tr("Message text (optional)", "نص الرسالة (اختياري)")}</Label><Textarea id="chk-body" dir="auto" rows={3} value={input.body} onChange={(e) => setInput({ ...input, body: e.target.value })} placeholder={tr("Message content", "محتوى الرسالة")} /></div>
        </div>
      </details>
      <div><p className="mb-2 text-xs text-muted-foreground">{tr("Fictional examples", "أمثلة خيالية")}</p><div className="flex flex-wrap gap-2">{EXAMPLES.map(ex => <Button key={ex.label.en} type="button" variant="outline" size="sm" disabled={!ready} onClick={() => { const value = { ...ex.input, body: demoText(ex.input.body, lang) }; setInput(value); run(value); }}>{pick(ex.label)}</Button>)}</div></div>
    </form>
    <div aria-live="polite" className="min-w-0">
      {result ? <section className="rounded-lg border bg-card p-6 shadow-card">
        <TrustBadge state={result.assessment.state} size="lg" />
        <p className="mt-4 text-base leading-relaxed">{pick(trustStateHelp[result.assessment.state])}</p>
        {!registryPresentation(result.assessment.state).messageAuthenticated && <div className="mt-4 flex gap-2 border-s-2 border-info ps-3 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" /><span>{tr("Individual message: not cryptographically authenticated.", "الرسالة الفردية: لم تُوثّق بتوقيع رقمي.")}</span></div>}
        <details className="mt-5 border-t pt-4"><summary className="text-sm font-medium">{tr("View check details", "عرض تفاصيل الفحص")}</summary><div className="mt-4 space-y-4"><ReasonList reasons={result.assessment.reasons} /><div><p className="mb-2 text-xs text-muted-foreground">{tr("Risk estimate · prototype rules", "تقدير الخطورة · قواعد تجريبية")}</p><RiskMeter score={result.assessment.riskScore} /></div></div></details>
        <div className="mt-5"><ReportButton input={result.input} assessment={result.assessment} /></div>
      </section> : <section className="rounded-lg border bg-card p-6 sm:p-8"><ShieldCheck className="size-8 text-primary" /><h3 className="mt-4 text-lg font-semibold">{tr("Your result", "نتيجة التحقق")}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr("Registered channel, unverified, or suspicious — with a clear reason.", "قناة مسجّلة أو غير موثّقة أو مشبوهة، مع سبب واضح.")}</p><div className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground">{tr("Unverified does not mean fraud. Never share a password or payment code based on a registry match.", "غير موثّق لا يعني احتيالاً. لا تشارك كلمة مرور أو رمز دفع اعتماداً على مطابقة السجل.")}</div></section>}
    </div>
  </div>;
}
