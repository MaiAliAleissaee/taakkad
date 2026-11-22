import { ScanSearch } from "lucide-react";
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
import { assessMessage, type Assessment, type MessageInput } from "@/lib/services/verification";
import { ReasonList } from "./reason-list";
import { ReportButton } from "./report-button";
import { TrustBadge } from "./trust-badge";

const EXAMPLES: Array<{ label: { en: string; ar: string }; input: MessageInput }> = [
  { label: { en: "Lookalike bank link", ar: "رابط بنك مشابه" }, input: { channel: "sms", sender: "FALCONBNK", url: "https://fa1conbank.example/login", body: "Your card is blocked. Log in to unlock.", claimedOrgId: "org-falcon" } },
  { label: { en: "Official registry email", ar: "بريد رسمي من السجل" }, input: { channel: "email", sender: "notices@alnoor.gov.example", url: "https://services.alnoor.gov.example", body: "Your document is ready for collection." } },
  { label: { en: "Unknown shop newsletter", ar: "نشرة متجر غير معروف" }, input: { channel: "email", sender: "offers@desertbloom-shop.example", url: "https://desertbloom-shop.example", body: "New arrivals this week." } },
];

export function MessageChecker() {
  const { tr, pick } = useI18n();
  const { organizations } = useDemoState();
  const [input, setInput] = useState<MessageInput>({ channel: "sms", sender: "", url: "", body: "", claimedOrgId: undefined });
  const [checkedInput, setCheckedInput] = useState<MessageInput | null>(null);
  const blocklist = useBlocklist(checkedInput ? [checkedInput] : []);
  const result = checkedInput ? { input: checkedInput, assessment: assessMessage(checkedInput, { organizations, blocklist }) } : null;
  const [error, setError] = useState(false);

  const run = (value: MessageInput) => {
    if (!value.sender.trim() && !value.url?.trim()) {
      setError(true);
      return;
    }
    setError(false);
    setCheckedInput(value);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    run(input);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-card p-5 shadow-card" noValidate>
        <div>
          <h2 className="text-lg font-semibold">{tr("Check a message or link", "افحص رسالة أو رابطاً")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("Sender and link values are checked securely against the demo registry. Links are never opened.", "تُفحص قيم المرسل والرابط بأمان مقابل السجل التجريبي. لا تُفتح الروابط.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">{tr("Try an example:", "جرّب مثالاً:")}</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.label.en} type="button" onClick={() => { setInput(ex.input); run(ex.input); }} className="rounded-full border px-2.5 py-0.5 text-xs hover:border-emerald hover:bg-accent">
              {pick(ex.label)}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="chk-channel">{tr("Received via", "وصلت عبر")}</Label>
            <NativeSelect id="chk-channel" value={input.channel} onChange={(e) => setInput({ ...input, channel: e.target.value as ChannelType })}>
              {(["sms", "email", "phone", "social", "website", "other"] as const).map((c) => <option key={c} value={c}>{pick(channelLabel[c])}</option>)}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chk-claim">{tr("Claims to be from", "يدّعي أنه من")}</Label>
            <NativeSelect id="chk-claim" value={input.claimedOrgId ?? ""} onChange={(e) => setInput({ ...input, claimedOrgId: e.target.value || undefined })}>
              <option value="">{tr("Not stated / unsure", "غير مذكور / غير متأكد")}</option>
              {organizations.map((o) => <option key={o.id} value={o.id}>{pick(o.name)}</option>)}
            </NativeSelect>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chk-sender">{tr("Sender (email, number, sender ID or handle)", "المرسل (بريد أو رقم أو معرّف أو حساب)")}</Label>
          <Input id="chk-sender" dir="ltr" className="font-mono" value={input.sender} onChange={(e) => setInput({ ...input, sender: e.target.value })} placeholder="FALCONBANK" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chk-url">{tr("Link in the message (optional)", "الرابط في الرسالة (اختياري)")}</Label>
          <Input id="chk-url" dir="ltr" className="font-mono" value={input.url ?? ""} onChange={(e) => setInput({ ...input, url: e.target.value })} placeholder="https://…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chk-body">{tr("Message text (optional)", "نص الرسالة (اختياري)")}</Label>
          <Textarea id="chk-body" rows={3} value={input.body} onChange={(e) => setInput({ ...input, body: e.target.value })} />
        </div>
        {error ? <p className="text-sm text-destructive">{tr("Enter a sender or a link to check.", "أدخل مرسلاً أو رابطاً للفحص.")}</p> : null}
        <Button type="submit" className="w-full"><ScanSearch />{tr("Check now", "افحص الآن")}</Button>
      </form>

      <div aria-live="polite">
        {result ? (
          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TrustBadge state={result.assessment.state} size="lg" />
              <ReportButton input={result.input} assessment={result.assessment} />
            </div>
            <p className="text-sm text-muted-foreground">{pick(trustStateHelp[result.assessment.state])}</p>
            <ReasonList reasons={result.assessment.reasons} />
            <div>
              <p className="mb-1 text-xs text-muted-foreground">{tr("Risk score (prototype heuristic)", "درجة الخطورة (تقدير تجريبي)")}</p>
              <RiskMeter score={result.assessment.riskScore} />
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-64 place-items-center rounded-2xl border border-dashed bg-card/60 p-8 text-center">
            <div>
              <ScanSearch className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">{tr("Your result will appear here", "ستظهر النتيجة هنا")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tr("With a plain explanation of every check.", "مع شرح واضح لكل فحص.")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
