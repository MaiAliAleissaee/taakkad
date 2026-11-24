import { ScanSearch, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { NativeSelect } from "@/components/common/native-select";
import { RiskMeter } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useServerFn } from "@tanstack/react-start";
import { analyzePrivateMessage } from "@/lib/services/ai-analysis.functions";
import { correlatePrivateIndicators } from "@/lib/services/ai-correlation.functions";
import type { correlateIndicators } from "@/lib/services/ai-correlation";
import type { AiOutcome } from "@/lib/services/ai-schema";
import { minimizeAiInput } from "@/lib/services/ai-privacy";
import { combinedRiskScore, overallRisk } from "@/lib/services/hybrid-analysis";
import { analyzeUrl } from "@/lib/services/url/analyze";
import { getUrlIntelligence } from "@/lib/services/url/intelligence.functions";
import type { UrlIntelligence } from "@/lib/services/url/intelligence";
import { UrlFindings } from "./url-findings";
import { useStaffSession } from "@/lib/security/session";
import { AiFindings } from "./ai-findings";
import { UaeFindings } from "./uae-findings";
import { ScreenshotInput, type ScreenshotReview } from "./screenshot-input";
import { combineScreenshot, assessScreenshot, extractionIncomplete } from "@/lib/screenshot/model";

export function MessageChecker() {
  const { tr, pick } = useI18n();
  const staff = useStaffSession();
  const analyze = useServerFn(analyzePrivateMessage);
  const correlate = useServerFn(correlatePrivateIndicators);
  const lookupDomain = useServerFn(getUrlIntelligence);
  const [useRdap, setUseRdap] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const { organizations } = useDemoState();
  const emptyInput = { channel: "sms" as PublicCheckChannel, sender: "", url: "", body: "", claimedOrgId: undefined as string | undefined };
  const [input, setInput] = useState(emptyInput);
  const [screenshot, setScreenshot] = useState<ScreenshotReview | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const merged = screenshot ? combineScreenshot(input,screenshot.review) : null;
  const [checked, setChecked] = useState<{ input: MessageInput; blocklist: BlockedIndicator[]; ai: AiOutcome | null; intelligence: UrlIntelligence | null; flaggedValues: string[]; flagsAvailable: boolean; leads: ReturnType<typeof correlateIndicators>; screenshot: { urls: string[]; uncertain: boolean; conflicts: string[]; confidence: number } | null } | null>(null);
  const result = checked ? { input: checked.input, assessment: checked.screenshot ? assessScreenshot(checked.input,checked.screenshot.urls,{organizations,blocklist:checked.blocklist},checked.screenshot.uncertain,checked.screenshot.conflicts.length>0) : assessMessage(checked.input, { organizations, blocklist: checked.blocklist }) } : null;
  const technical = result?.input.url ? analyzeUrl(result.input.url) : null;
  const [error, setError] = useState<"empty" | "unavailable" | null>(null);
  const [busy, setBusy] = useState(false);
  const workspace = usePublicWorkspace();
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);
  useEffect(() => { request.current += 1; setChecked(null); setBusy(false);setScreenshot(null);setImageVersion(v=>v+1);setOcrBusy(false); }, [staff.user?.id]);
  useEffect(() => { if (!staff.user) setUseAi(false); }, [staff.user?.id]);

  const run = async () => {
    if (ocrBusy) return;
    const value = merged ? merged.input : preparePrivateCheck(input);
    if (!value) {
      setError("empty");
      return;
    }
    const id = ++request.current;
    setError(null); setChecked(null); setBusy(true);
    try {
      const candidates = [...new Set([privateCheckCandidates(value),...(merged?.urls ?? []).map(url=>privateCheckCandidates({...value,url}))].flat())].slice(0,60);
      const flags = candidates.length ? await supabase.rpc("flagged_message_values", { candidate_values: candidates, ...(workspace ? { workspace_user: workspace } : {}) }) : { data: [], error: null };
      if (id !== request.current) return;
      if (flags.error) throw new Error("Unavailable");
      let ai: AiOutcome | null = null;
      let intelligence: UrlIntelligence | null = null;
      const urlAnalysis = value.url ? analyzeUrl(value.url) : null;
      if (useRdap && urlAnalysis) {
        if (urlAnalysis.networkEligible && urlAnalysis.domain) {
          try { intelligence = await lookupDomain({ data: { domain: urlAnalysis.domain, host: urlAnalysis.host } }); }
          catch { intelligence = { rdap: { status: "unavailable", reason: "service" }, redirects: { status: "unverified", reason: "safe_expansion_unavailable", checkedHops: 0 } }; }
        } else intelligence = { rdap: { status: "unavailable", reason: "blocked" }, redirects: { status: "unverified", reason: "safe_expansion_unavailable", checkedHops: 0 } };
        if (id !== request.current) return;
      }
      let flaggedValues: string[] = [];
      let flagsAvailable = true;
      let leads: ReturnType<typeof correlateIndicators> = [];
      if (useAi && staff.user) {
        try { ai = await analyze({ data: minimizeAiInput(value) }); }
        catch { ai = { status: "unavailable", reason: "service" }; }
        if (id !== request.current) return;
        if (ai.status === "performed" && ai.findings.indicators.length > 0) {
          const extractedFlags = await supabase.rpc("flagged_ai_indicator_values", { candidate_indicators: ai.findings.indicators, ...(workspace ? { workspace_user: workspace } : {}) });
          flagsAvailable = !extractedFlags.error;
          flaggedValues = extractedFlags.data ?? [];
          if (staff.securityAccess) {
            try { leads = await correlate({ data: ai.findings.indicators }); } catch { /* Restricted data remains unavailable, never inferred. */ }
          }
        }
      }
      if (id !== request.current) return;
      setChecked({ input: value, blocklist: (flags.data ?? []).map(item => ({ type: "domain", value: item, caseId: "restricted" })), ai, intelligence, flaggedValues, flagsAvailable, leads, screenshot:screenshot && merged ? {urls:merged.urls,uncertain:extractionIncomplete(screenshot.data) || screenshot.data.uncertainWords.length>0 || merged.truncated,conflicts:merged.conflicts,confidence:screenshot.data.confidence} : null });
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
          <p className="mt-1 text-sm text-muted-foreground">{tr("Your result stays in this visit. Sender and link values are matched for safety; links are never opened. Optional AI analysis sends redacted content to the AI service. Reporting separately shares content with authorized staff.", "تبقى نتيجتك ضمن هذه الزيارة. تُطابق قيم المرسل والرابط أمنياً ولا تُفتح الروابط. يرسل التحليل الاختياري بالذكاء الاصطناعي محتوى منقّحاً إلى خدمة الذكاء الاصطناعي. يشارك الإبلاغ المحتوى بشكل منفصل مع الموظفين المصرّح لهم.")}</p>
        </div>
        <ScreenshotInput key={imageVersion} value={screenshot} onChange={value=>{request.current+=1;setBusy(false);setChecked(null);setError(null);setScreenshot(value);}} onBusy={setOcrBusy} />
        {!!merged?.conflicts.length && <p role="status" className="text-sm text-unverified">{tr("Screenshot and manual inputs disagree: ","تختلف بيانات اللقطة والمدخلات اليدوية: ")}{merged.conflicts.map(c=>c==="url" ? tr("link","الرابط") : tr("sender","المرسل")).join(" · ")}. {tr("Both are retained for checking; review the discrepancy.","تُحتفظ بالقيمتين للفحص؛ راجع الاختلاف.")}</p>}
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
        <div className="space-y-2">
          <div className="flex items-start gap-2"><Checkbox id="chk-ai" checked={useAi} disabled={busy || !staff.user} onCheckedChange={value => setUseAi(value === true)} /><Label htmlFor="chk-ai" className="leading-relaxed">{tr("Include real AI analysis of redacted content", "تضمين تحليل فعلي بالذكاء الاصطناعي للمحتوى المنقّح")}</Label></div>
          {!staff.user && <Button asChild variant="link" size="sm"><Link to="/auth">{tr("Sign in for paid AI analysis", "سجّل الدخول للتحليل المدفوع بالذكاء الاصطناعي")}</Link></Button>}
          <div className="flex items-start gap-2"><Checkbox id="chk-rdap" checked={useRdap} disabled={busy} onCheckedChange={value => setUseRdap(value === true)} /><Label htmlFor="chk-rdap" className="leading-relaxed">{tr("Look up registration and DNS/network metadata (domain/host only sent to RDAP, Google DNS and RIPE; RDAP: .com, .net, .org)", "استعلام التسجيل وDNS وبيانات الشبكة (يُرسل النطاق والمضيف فقط إلى RDAP وGoogle DNS وRIPE؛ التسجيل: .com و.net و.org)")}</Label></div>
          <p className="text-xs text-muted-foreground">{tr("Remove passwords, OTPs, identity numbers and unnecessary personal details before submitting. Automatic redaction is a safeguard, not a guarantee.", "أزل كلمات المرور ورموز التحقق وأرقام الهوية والبيانات الشخصية غير الضرورية قبل الإرسال. التنقيح الآلي إجراء وقائي وليس ضماناً.")}</p>
        </div>
        {error ? <p role="alert" className="text-sm text-destructive">{error === "empty" ? tr("Enter message text, a sender or a link to check.", "أدخل نص رسالة أو مرسلاً أو رابطاً للفحص.") : tr("The safety check is unavailable. Please try again; no result has been confirmed.", "فحص الأمان غير متاح. حاول مجدداً؛ لم تُؤكد أي نتيجة.")}</p> : null}
        <Button type="submit" disabled={busy || ocrBusy} className="w-full"><ScanSearch />{busy ? tr("Checking…", "جارٍ الفحص…") : tr("Check now", "افحص الآن")}</Button>
      </form>

      <div aria-live="polite">
        {result ? (
          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-card" role="region" aria-label={tr("Your private result", "نتيجتك الخاصة")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TrustBadge state={result.assessment.state} size="lg" label={result.assessment.state === "verified" ? tr("Verified Channel", "قناة موثّقة") : result.assessment.state === "unverified" ? tr("Unverified Channel", "قناة غير موثّقة") : tr("Suspicious Indicators", "مؤشرات مشبوهة")} />
              <Button type="button" size="icon" variant="ghost" title={tr("Clear private check", "مسح الفحص الخاص")} aria-label={tr("Clear private check", "مسح الفحص الخاص")} onClick={() => { request.current += 1; setChecked(null); setInput(emptyInput); setError(null); setBusy(false);setScreenshot(null);setImageVersion(v=>v+1);setOcrBusy(false); }}><X /></Button>
            </div>
            <p className="text-sm text-muted-foreground">{pick(trustStateHelp[result.assessment.state])}</p>
            {checked?.screenshot && <section className="space-y-1 border-t pt-3 text-xs"><h3 className="font-semibold">{tr("Screenshot-derived assessment","تقييم مستخلص من لقطة الشاشة")}</h3><p>{tr("OCR confidence: ","ثقة القراءة: ")}{Math.round(checked.screenshot.confidence)}% · {tr("not a safety probability","ليست احتمالاً للأمان")}</p>{checked.screenshot.uncertain && <p className="text-unverified">{tr("Incomplete or uncertain extraction; no complete screenshot verification is claimed.","استخراج غير مكتمل أو غير مؤكد؛ لا يُدّعى توثيق اللقطة كاملة.")}</p>}{checked.screenshot.conflicts.length>0 && <p className="text-unverified">{tr("Conflicting screenshot/manual values remain unresolved; every extracted link was checked locally.","لا يزال تعارض قيم اللقطة والحقول اليدوية دون حل؛ فُحص كل رابط مستخرج محلياً.")}</p>}<p className="text-muted-foreground">{tr("Registry matches apply only to the supplied channel values, not image authenticity or hidden hyperlink destinations.","تنطبق مطابقات السجل على قيم القنوات المقدمة فقط، وليس أصالة الصورة أو وجهات الروابط المخفية.")}</p></section>}
            <h3 className="text-sm font-semibold">{tr("Registry facts, rule checks and local ML warnings", "حقائق السجل وفحوص القواعد وتحذيرات التعلم الآلي المحلي")}</h3>
            <ReasonList reasons={result.assessment.reasons.filter(reason => !reason.code.startsWith("content_"))} />
            {result.assessment.reasons.some(reason => reason.code.startsWith("content_")) && <><h3 className="text-sm font-semibold">{tr("Heuristic warning signs", "علامات تحذير استدلالية")}</h3><ReasonList reasons={result.assessment.reasons.filter(reason => reason.code.startsWith("content_"))} /></>}
            <p className="text-sm font-medium">{tr("A registered channel does not guarantee the authenticity of this individual message.", "تسجيل القناة لا يضمن أصالة هذه الرسالة الفردية.")}</p>
            <UaeFindings input={result.input} />
            {checked?.screenshot?.uncertain && checked.ai?.status!=="performed" ? <p className="text-sm text-unverified">{tr("A complete risk assessment is unavailable because extraction is uncertain. Scores below cover readable values only, not screenshot safety.","تقييم الخطورة الكامل غير متاح لأن الاستخراج غير مؤكد. تغطي الدرجات أدناه القيم المقروءة فقط، وليس أمان اللقطة.")}</p> : <AiFindings outcome={checked?.ai ?? null} risk={overallRisk(result.assessment, checked?.ai ?? null, !!checked?.flaggedValues.length)} flaggedValues={checked?.flaggedValues ?? []} />}
            {technical && <UrlFindings analysis={technical} intelligence={checked?.intelligence ?? null} score={combinedRiskScore(result.assessment, checked?.ai ?? null, !!checked?.flaggedValues.length)} />}
            {checked?.screenshot?.urls.filter(url=>url!==result.input.url).map(url=><section key={url} className="border-t pt-3"><p className="break-all text-xs" dir="ltr">{url}</p><UrlFindings analysis={analyzeUrl(url)} intelligence={null} score={assessMessage({...result.input,url},{organizations,blocklist:checked.blocklist}).riskScore} /></section>)}
            {checked && !checked.flagsAvailable && <p role="status" className="text-sm text-muted-foreground">{tr("Extracted-indicator database matching was unavailable; no match has been confirmed.", "تعذّرت مطابقة المؤشرات المستخرجة في قاعدة البيانات؛ لم تُؤكّد أي مطابقة.")}</p>}
            {staff.securityAccess && checked && checked.leads.length > 0 && <section className="space-y-2 border-t pt-3"><h3 className="text-sm font-semibold">{tr("Restricted investigation leads — human review required", "خيوط تحقيق مقيّدة — تتطلب مراجعة بشرية")}</h3>{checked.leads.map(lead => <p key={`${lead.type}:${lead.value}`} className="break-all text-sm" dir="auto">{lead.value}: {lead.cases.map(item => item.caseId).join(", ")}</p>)}<p className="text-xs text-muted-foreground">{tr("Exact shared indicators only; no common offender is inferred.", "مؤشرات مشتركة متطابقة فقط؛ لا يُستنتج مرتكب مشترك.")}</p></section>}
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">{tr("Recommended safety actions", "إجراءات الأمان الموصى بها")}</h3>
              <ul className="list-disc space-y-1 ps-5 text-muted-foreground">
                <li>{tr("Contact the organization through an independently confirmed official channel.", "تواصل مع الجهة عبر قناة رسمية تم التأكد منها بشكل مستقل.")}</li>
                <li>{tr("Never share passwords, verification codes or payment details in response to an unexpected message.", "لا تشارك كلمات المرور أو رموز التحقق أو بيانات الدفع استجابةً لرسالة غير متوقعة.")}</li>
                {result.assessment.state !== "verified" && <li>{tr("Avoid opening the link or making a payment until the sender and request are independently confirmed.", "تجنب فتح الرابط أو إجراء دفع حتى يتم التأكد من المرسل والطلب بشكل مستقل.")}</li>}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">{tr("Local risk score: rules + URL ML (not a probability)", "درجة الخطورة المحلية: قواعد + تعلم آلي للروابط (ليست احتمالاً)")}</p>
              <RiskMeter score={result.assessment.riskScore} />
            </div>
            {(result.assessment.state !== "verified" || (checked?.ai?.status === "performed" && checked.ai.findings.risk !== "low") || !!checked?.flaggedValues.length) && <div className="space-y-2"><p className="text-xs text-muted-foreground">{tr("Reporting shares this message and extracted indicators with authorized security staff for review, not with other visitors. It does not confirm or automatically escalate a criminal case.", "الإبلاغ يشارك هذه الرسالة والمؤشرات المستخرجة مع موظفي الأمن المصرّح لهم للمراجعة، وليس مع الزوار الآخرين. ولا يؤكد قضية جنائية أو يصعّدها تلقائياً.")}</p><ReportButton key={JSON.stringify(result.input)} input={result.input} assessment={result.assessment} aiIndicators={checked?.ai?.status === "performed" ? checked.ai.findings.indicators : undefined} allowVerifiedReport={!!checked?.flaggedValues.length || (checked?.ai?.status === "performed" && checked.ai.findings.risk !== "low")} /></div>}
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
