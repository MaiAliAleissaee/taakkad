import { ScanSearch, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { NativeSelect } from "@/components/common/native-select";
import { RiskMeter } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { BlockedIndicator } from "@/lib/services/blocklist";
import { usePublicWorkspace } from "@/lib/data/hooks";
import { useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel, trustStateHelp } from "@/lib/i18n/labels";
import { assessMessage, type MessageInput } from "@/lib/services/verification";
import { preparePrivateCheck, privateCheckCandidates, type PublicCheckChannel } from "@/lib/services/private-check";
import { ReasonList } from "./reason-list";
import { ReportButton } from "./report-button";
import { TrustBadge } from "./trust-badge";

export function MessageChecker() {
  const { tr, pick } = useI18n();
  const { organizations } = useDemoState();
  const emptyInput = { channel: "sms" as PublicCheckChannel, sender: "", url: "", body: "", claimedOrgId: undefined as string | undefined };
  const [input, setInput] = useState(emptyInput);
  const [checked, setChecked] = useState<{ input: MessageInput; blocklist: BlockedIndicator[] } | null>(null);
  const result = checked ? { input: checked.input, assessment: assessMessage(checked.input, { organizations, blocklist: checked.blocklist }) } : null;
  const [error, setError] = useState<"empty" | "unavailable" | null>(null);
  const [busy, setBusy] = useState(false);
  const workspace = usePublicWorkspace();
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);

  const run = async () => {
    const value = preparePrivateCheck(input);
    if (!value) {
      setError("empty");
      return;
    }
    const id = ++request.current;
    setError(null); setChecked(null); setBusy(true);
    try {
      const candidates = privateCheckCandidates(value);
      const flags = candidates.length ? await supabase.rpc("flagged_message_values", { candidate_values: candidates, ...(workspace ? { workspace_user: workspace } : {}) }) : { data: [], error: null };
      if (id !== request.current) return;
      if (flags.error) throw new Error("Unavailable");
      setChecked({ input: value, blocklist: (flags.data ?? []).map(item => ({ type: "domain", value: item, caseId: "restricted" })) });
    } catch { if (id === request.current) setError("unavailable"); }
    finally { if (id === request.current) setBusy(false); }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void run();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-card p-5 shadow-card" noValidate>
        <div>
          <h2 className="text-lg font-semibold">{tr("Check a message or link", "افحص رسالة أو رابطاً")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("Your message stays in this visit unless you choose to report it. Only sender and link values are sent for safety matching; links are never opened.", "تبقى رسالتك ضمن هذه الزيارة ما لم تختر الإبلاغ عنها. تُرسل قيم المرسل والرابط فقط لمطابقة مؤشرات الخطر؛ ولا تُفتح الروابط.")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="chk-channel">{tr("Received via", "وصلت عبر")}</Label>
            <NativeSelect id="chk-channel" value={input.channel} onChange={(e) => setInput({ ...input, channel: e.target.value as PublicCheckChannel })}>
              {(["sms", "whatsapp", "email", "website", "phone", "social", "other"] as const).map((c) => <option key={c} value={c}>{c === "whatsapp" ? tr("WhatsApp", "واتساب") : c === "sms" ? tr("SMS message", "رسالة نصية") : pick(channelLabel[c])}</option>)}
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
          <Label htmlFor="chk-sender">{tr("Sender (email, number, sender ID or handle) — optional", "المرسل (بريد أو رقم أو معرّف أو حساب) — اختياري")}</Label>
          <Input id="chk-sender" maxLength={500} dir="ltr" className="font-mono" value={input.sender} onChange={(e) => setInput({ ...input, sender: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chk-url">{tr("Link in the message (optional)", "الرابط في الرسالة (اختياري)")}</Label>
          <Input id="chk-url" maxLength={2000} dir="ltr" className="font-mono" value={input.url ?? ""} onChange={(e) => setInput({ ...input, url: e.target.value })} placeholder="https://…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chk-body">{tr("Message text (optional)", "نص الرسالة (اختياري)")}</Label>
          <Textarea id="chk-body" dir="auto" maxLength={10000} rows={3} value={input.body} onChange={(e) => setInput({ ...input, body: e.target.value })} />
        </div>
        {error ? <p role="alert" className="text-sm text-destructive">{error === "empty" ? tr("Enter message text, a sender or a link to check.", "أدخل نص رسالة أو مرسلاً أو رابطاً للفحص.") : tr("The safety check is unavailable. Please try again; no result has been confirmed.", "فحص الأمان غير متاح. حاول مجدداً؛ لم تُؤكد أي نتيجة.")}</p> : null}
        <Button type="submit" disabled={busy} className="w-full"><ScanSearch />{busy ? tr("Checking…", "جارٍ الفحص…") : tr("Check now", "افحص الآن")}</Button>
      </form>

      <div aria-live="polite">
        {result ? (
          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-card" role="region" aria-label={tr("Your private result", "نتيجتك الخاصة")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TrustBadge state={result.assessment.state} size="lg" label={result.assessment.state === "verified" ? tr("Verified Channel", "قناة موثّقة") : result.assessment.state === "unverified" ? tr("Unverified Channel", "قناة غير موثّقة") : tr("Suspicious Indicators", "مؤشرات مشبوهة")} />
              <Button type="button" size="icon" variant="ghost" title={tr("Clear private check", "مسح الفحص الخاص")} aria-label={tr("Clear private check", "مسح الفحص الخاص")} onClick={() => { request.current += 1; setChecked(null); setInput(emptyInput); setError(null); setBusy(false); }}><X /></Button>
            </div>
            <p className="text-sm text-muted-foreground">{pick(trustStateHelp[result.assessment.state])}</p>
            <ReasonList reasons={result.assessment.reasons} />
            <p className="text-sm font-medium">{tr("A registered channel does not guarantee the authenticity of this individual message.", "تسجيل القناة لا يضمن أصالة هذه الرسالة الفردية.")}</p>
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">{tr("Recommended safety actions", "إجراءات الأمان الموصى بها")}</h3>
              <ul className="list-disc space-y-1 ps-5 text-muted-foreground">
                <li>{tr("Contact the organization through an independently confirmed official channel.", "تواصل مع الجهة عبر قناة رسمية تم التأكد منها بشكل مستقل.")}</li>
                <li>{tr("Never share passwords, verification codes or payment details in response to an unexpected message.", "لا تشارك كلمات المرور أو رموز التحقق أو بيانات الدفع استجابةً لرسالة غير متوقعة.")}</li>
                {result.assessment.state !== "verified" && <li>{tr("Avoid opening the link or making a payment until the sender and request are independently confirmed.", "تجنب فتح الرابط أو إجراء دفع حتى يتم التأكد من المرسل والطلب بشكل مستقل.")}</li>}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">{tr("Risk score (prototype heuristic)", "درجة الخطورة (تقدير تجريبي)")}</p>
              <RiskMeter score={result.assessment.riskScore} />
            </div>
            {result.assessment.state !== "verified" && <div className="space-y-2"><p className="text-xs text-muted-foreground">{tr("Reporting shares this message with authorized security staff for review, not with other visitors.", "الإبلاغ يشارك هذه الرسالة مع موظفي الأمن المصرّح لهم للمراجعة، وليس مع الزوار الآخرين.")}</p><ReportButton key={JSON.stringify(result.input)} input={result.input} assessment={result.assessment} /></div>}
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
