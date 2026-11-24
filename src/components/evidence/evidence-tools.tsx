import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileJson, FileText, Paperclip, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/common/native-select";
import { useI18n } from "@/lib/i18n/i18n";
import { readEvidencePackage, attachPrivateEvidence, approveEvidenceAction } from "@/lib/evidence/evidence.functions";
import { attachmentInputSchema, actionInputSchema, MAX_FILE_BYTES, validateFile, type EvidenceSubject, type ActionMeta } from "@/lib/evidence/schema";
import { actionLabels, provenanceLabels, evidenceTimes, type EvidencePackage } from "@/lib/evidence/model";
import { attachmentBlob, downloadEvidence, printEvidence } from "@/lib/evidence/download";
export function EvidenceTools({ subject }: { subject: EvidenceSubject }) {
  const { tr, pick, dir } = useI18n();
  const read = useServerFn(readEvidencePackage), attach = useServerFn(attachPrivateEvidence), approve = useServerFn(approveEvidenceAction);
  const [pack,setPack] = useState<EvidencePackage | null>(null); const [open,setOpen] = useState(false); const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const [file,setFile] = useState<File | null>(null); const [source,setSource] = useState(""); const [capture,setCapture] = useState(""); const [synthetic,setSynthetic] = useState(false);
  const [action,setAction] = useState<ActionMeta["action"]>("preserve"); const [note,setNote] = useState(""); const [confirmed,setConfirmed] = useState(false);
  const key = `${subject.kind}-${subject.id}`;
  const reportError = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    const messages: Record<string,[string,string]> = {
      invalid_file: ["File must be nonempty and no larger than 512 KiB.","يجب ألا يكون الملف فارغاً وألا يتجاوز 512 كيلوبايت."],
      file_type_mismatch: ["The file bytes do not match PNG, JPEG, PDF or UTF-8 text.","بايتات الملف لا تطابق PNG أو JPEG أو PDF أو نص UTF-8."],
      capture_in_future: ["Capture time cannot be in the future. Enter UTC time.","لا يمكن أن يكون وقت الالتقاط في المستقبل. أدخل وقت UTC."],
      integrity_mismatch: ["File integrity check failed. No evidence package was exported.","فشل فحص سلامة الملف. لم تُصدر حزمة الأدلة."],
      evidence_forbidden: ["Your active staff session cannot access this evidence subject.","لا يمكن لجلسة الموظف النشطة الوصول إلى موضوع الأدلة هذا."],
      subject_unavailable: ["This record is unavailable in your authorized workspace.","هذا السجل غير متاح في مساحة عملك المصرح بها."],
      evidence_limit_or_save_failed: ["Not saved: maximum six files or 100 events per record, 30 saves per ten minutes; otherwise reload and retry.","لم يُحفظ: الحد ستة ملفات أو 100 حدث لكل سجل و30 عملية حفظ كل عشر دقائق؛ وإلا أعد التحميل وحاول مجدداً."],
    }; const pair = messages[code]; setError(pair ? tr(pair[0],pair[1]) : tr("Unable to access or save evidence. Check your session and retry; no security controls were bypassed.","تعذّر الوصول إلى الأدلة أو حفظها. تحقق من جلستك وحاول مجدداً؛ لم يتم تجاوز أي ضوابط أمنية."));
  };
  async function load() { setBusy(true); setError(""); try { setPack(await read({data:subject})); setOpen(true); } catch(e) { reportError(e); } finally { setBusy(false); } }
  async function upload() {
    if (!file) { setError(tr("Choose an evidence file.","اختر ملف دليل.")); return; }
    setError("");setBusy(true);
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("invalid_file");
      const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
      const parsed = attachmentInputSchema.safeParse({...subject,name:file.name,mime:file.type,content:btoa(binary),source,capturedAt:capture ? `${capture.length === 16 ? `${capture}:00` : capture}Z` : "",synthetic});
      if (!parsed.success) { setError(tr(`Check evidence field: ${parsed.error.issues[0]?.path.join(".") ?? "file"}. Source and UTC capture time are required; allowed files: PNG, JPEG, PDF, UTF-8 text (512 KiB).`, `راجع حقل الدليل: ${parsed.error.issues[0]?.path.join(".") ?? "file"}. يلزم المصدر ووقت الالتقاط UTC؛ الملفات: PNG وJPEG وPDF ونص UTF-8 (512 كيلوبايت).`)); return; }
      if (Date.parse(parsed.data.capturedAt)>Date.now()+300000) throw new Error("capture_in_future");
      await validateFile(parsed.data.content,parsed.data.mime);
      setPack(await attach({data:parsed.data})); setFile(null);setSource("");setCapture("");
    } catch(e) { reportError(e); } finally { setBusy(false); }
  }
  async function decision() {
    const parsed = actionInputSchema.safeParse({...subject,action,note,confirmed});
    if (!parsed.success) { setError(tr("Enter a decision note (1–2000 characters) and explicitly confirm human review.","أدخل ملاحظة قرار (1–2000 حرف) وأكد المراجعة البشرية صراحةً.")); return; }
    setBusy(true);setError("");try { setPack(await approve({data:parsed.data}));setNote("");setConfirmed(false); } catch(e) { reportError(e); } finally {setBusy(false);}
  }
  return <section dir={dir} className="mt-4 space-y-3 border-t pt-4">
    <Button size="sm" variant="outline" disabled={busy} onClick={() => { if (open) setOpen(false); else void load(); }}><Paperclip />{tr("Private evidence & report","الأدلة الخاصة والتقرير")}</Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {open && pack && <div className="space-y-5">
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => void load()}><RefreshCw />{tr("Refresh evidence","تحديث الأدلة")}</Button><Button size="sm" variant="outline" onClick={() => downloadEvidence(new Blob([JSON.stringify(pack,null,2)],{type:"application/json;charset=utf-8"}),`taakkad-${subject.kind}-evidence.json`)}><FileJson />JSON</Button><Button size="sm" variant="outline" onClick={() => { if (!printEvidence(pack)) setError(tr("Allow the report window to open, then choose Save as PDF.","اسمح بفتح نافذة التقرير ثم اختر حفظ كـ PDF.")); }}><FileText />{tr("PDF · Save as PDF","PDF · حفظ كـ PDF")}</Button></div>
      <h4 className="font-semibold">{tr("Risk explanation & uncertainty","تفسير الخطر وعدم اليقين")}</h4><p className="text-sm">{pick(pack.risk)}</p>
      <ul className="space-y-2 text-xs text-muted-foreground">{pack.uncertainty.map((u,i) => <li key={i}>{pick(u)}</li>)}</ul>
      {!!pack.uaeGuidance?.length && <details><summary className="cursor-pointer text-sm font-semibold">{tr("UAE prevention & police review", "الوقاية والمراجعة الشرطية الإماراتية")}</summary><ul className="mt-2 space-y-2 text-sm text-muted-foreground">{pack.uaeGuidance.map((g,i) => <li key={i}>{pick(g)}</li>)}</ul><ul className="mt-2 space-y-1 text-xs">{pack.uaeSources.map(source => <li key={source.url}><a className="underline" href={source.url} target="_blank" rel="noopener noreferrer">{pick(source.title)}</a></li>)}</ul></details>}
      {pack.urlFindings.map((u,i) => <div key={i} className="space-y-2 border-s-2 ps-3 text-sm"><p dir="ltr" className="break-all font-mono text-xs">{u.value}</p><p>{tr(`Rule index: ${u.ruleIndex} · URL ML: ${u.ml ? `${u.ml.version}, output ${u.ml.score.toFixed(4)}, ${u.ml.flagged ? "flagged" : "not flagged"}` : "unavailable"}`, `مؤشر القواعد: ${u.ruleIndex} · ML للروابط: ${u.ml ? `${u.ml.version}، المخرج ${u.ml.score.toFixed(4)}، ${u.ml.flagged ? "مُعلّم" : "غير مُعلّم"}` : "غير متاح"}`)}</p><ul className="space-y-1">{u.signals.map(s => <li key={s.code}>{tr(s.en,s.ar)} · {tr(`rule weight +${s.weight}`,`وزن القاعدة +${s.weight}`)}</li>)}</ul></div>)}
      <details><summary className="cursor-pointer text-sm font-semibold">{tr("Evidence timeline · UTC / UAE","التسلسل الزمني للأدلة · UTC / الإمارات")}</summary><ol className="mt-3 space-y-3">{[...pack.timeline].sort((a,b) => (a.at ? Date.parse(a.at)||0 : 0)-(b.at ? Date.parse(b.at)||0 : 0)).map((e,i) => { const time=evidenceTimes(e.at); return <li key={i} className="space-y-1 border-s ps-3 text-xs"><p className="font-semibold">{pick(e.title)}</p><Badge variant="outline">{pick(provenanceLabels[e.provenance])}</Badge><p dir="ltr">UTC: {time.utc}</p><p>{tr(time.uaeEn,time.uaeAr)}</p><p dir="auto" className="whitespace-pre-wrap break-all">{pick(e.detail)}</p><p dir="auto" className="break-all">{tr("Source: ","المصدر: ")}{e.source}</p></li>; })}</ol></details>
      <details><summary className="cursor-pointer text-sm font-semibold">{tr("Shared indicators — review leads only","المؤشرات المشتركة — دلائل مراجعة فقط")}</summary><ul className="mt-2 space-y-2 text-xs">{pack.links.length ? pack.links.map((l,i) => <li key={i} className="border-s ps-3"><p dir="auto">{l.label}{l.synthetic && ` · ${tr("Fictional","خيالي")}`}</p><p dir="ltr" className="break-all">{l.shared.join(" · ")}</p></li>) : <li>{tr("No exact linked indicators.","لا توجد مؤشرات مرتبطة مطابقة.")}</li>}</ul></details>
      <div className="space-y-3"><h4 className="font-semibold">{tr("Private evidence files","ملفات الأدلة الخاصة")}</h4>{pack.attachments.map(a => <div key={a.id} className="space-y-1 border-s ps-3 text-xs"><div className="flex items-center gap-2"><span dir="auto" className="break-all">{a.metadata.name}</span><Button size="icon" variant="ghost" title={tr("Download integrity-checked file","تنزيل الملف المفحوص السلامة")} aria-label={tr("Download integrity-checked file","تنزيل الملف المفحوص السلامة")} onClick={() => downloadEvidence(attachmentBlob(a.content,a.metadata.mime),a.metadata.name)}><Download /></Button></div><p>{pick(provenanceLabels[a.metadata.provenance])}</p><p dir="ltr" className="break-all">SHA-256: {a.metadata.sha256}</p></div>)}
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={e => {e.preventDefault();void upload();}}><div><Label htmlFor={`file-${key}`}>{tr("Screenshot / evidence (512 KiB maximum)","لقطة شاشة أو دليل (512 كيلوبايت كحد أقصى)")}</Label><Input id={`file-${key}`} type="file" accept="image/png,image/jpeg,application/pdf,text/plain" onChange={e => setFile(e.target.files?.[0] ?? null)} /></div><div><Label htmlFor={`source-${key}`}>{tr("Source / capture reference","المصدر أو مرجع الالتقاط")}</Label><Input id={`source-${key}`} required maxLength={1000} value={source} dir="auto" onChange={e => setSource(e.target.value)} /></div><div><Label htmlFor={`capture-${key}`}>{tr("Declared capture time (UTC)","وقت الالتقاط المصرح به (UTC)")}</Label><Input id={`capture-${key}`} type="datetime-local" required value={capture} dir="ltr" onChange={e => setCapture(e.target.value)} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={synthetic} onChange={e => setSynthetic(e.target.checked)} />{tr("Fictional demonstration evidence","دليل تجريبي خيالي")}</label><Button type="submit" disabled={busy || pack.attachments.length>=6}><Paperclip />{tr("Save private evidence","حفظ الدليل الخاص")}</Button></form></div>
      <div className="space-y-3"><h4 className="font-semibold">{tr("Recommended actions — human approval","الإجراءات الموصى بها — اعتماد بشري")}</h4><ul className="space-y-1 text-sm">{pack.recommendations.map(a => <li key={a}>{pick(actionLabels[a])}</li>)}</ul><form className="space-y-3" onSubmit={e=>{e.preventDefault();void decision();}}><NativeSelect aria-label={tr("Review action","إجراء المراجعة")} value={action} onChange={e => setAction(e.target.value as ActionMeta["action"])}>{(Object.keys(actionLabels) as ActionMeta["action"][]).map(a=><option key={a} value={a}>{pick(actionLabels[a])}</option>)}</NativeSelect><Textarea aria-label={tr("Human decision note","ملاحظة القرار البشري")} dir="auto" required maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} />{tr("I reviewed the evidence and approve this preparation action. Nothing will be sent externally.","راجعت الأدلة وأعتمد إجراء الإعداد هذا. لن يُرسل شيء خارجياً.")}</label><Button type="submit" disabled={busy || !confirmed || !note.trim()}><CheckCircle2 />{tr("Record human approval","تسجيل الاعتماد البشري")}</Button></form><ol className="space-y-2 text-xs">{pack.actions.map(a=><li key={a.id} className="border-s ps-3"><p>{pick(actionLabels[a.metadata.action])} · {a.at}</p><p dir="auto">{a.metadata.note}</p></li>)}</ol></div>
    </div>}
  </section>;
}
