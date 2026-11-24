import { Camera, ImagePlus, RefreshCw, X, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n/i18n";
import { extractedIndicators, extractionIncomplete, MAX_IMAGE_BYTES, type ScreenshotData, type ReviewData, type ImageError } from "@/lib/screenshot/model";

export type ScreenshotReview = { data: ScreenshotData; review: ReviewData };
export function ScreenshotInput({ value,onChange,onBusy }: { value: ScreenshotReview | null; onChange: (v: ScreenshotReview | null)=>void; onBusy:(v:boolean)=>void }) {
  const { tr,pick } = useI18n();
  const [file,setFile] = useState<File|null>(null), [preview,setPreview] = useState(""), [progress,setProgress] = useState<number|null>(null), [error,setError] = useState<ImageError|null>(null), [consent,setConsent] = useState(false);
  const upload = useRef<HTMLInputElement>(null), camera = useRef<HTMLInputElement>(null), controller = useRef<AbortController|null>(null), objectUrl = useRef("");
  useEffect(()=>()=>{ controller.current?.abort(); if(objectUrl.current) URL.revokeObjectURL(objectUrl.current); },[]);
  function clearPreview() { if(objectUrl.current) URL.revokeObjectURL(objectUrl.current); objectUrl.current="";setPreview(""); }
  function remove() { controller.current?.abort();controller.current=null;clearPreview();setFile(null);setProgress(null);setError(null);setConsent(false);onChange(null);onBusy(false); }
  async function read(next: File) {
    controller.current?.abort(); const abort = new AbortController();controller.current=abort;
    clearPreview();setFile(next);setConsent(false);setError(null);setProgress(0);onChange(null);onBusy(true);
    try {
      if(next.size>MAX_IMAGE_BYTES || next.size===0) throw new Error("size");
      const { readScreenshot } = await import("@/lib/screenshot/reader");
      const data = await readScreenshot(next,abort.signal,setProgress,()=>{ if(!abort.signal.aborted){objectUrl.current=URL.createObjectURL(next);setPreview(objectUrl.current);} });
      if(abort.signal.aborted) return;
      const indicators = extractedIndicators(`${data.text}\n${data.qr.join("\n")}`);
      // Contact values found in a message are not automatically assumed to be its sender.
      onChange({ data,review:{ text:data.text,qr:data.qr.join("\n"),sender:"",url:indicators.urls[0] ?? "" } });
    } catch(e) { if(!abort.signal.aborted) { const code = e instanceof Error ? e.message : "ocr";setError(["size","type","dimensions","decode"].includes(code) ? code as ImageError : "ocr"); } }
    finally { if(!abort.signal.aborted) {setProgress(null);onBusy(false);} }
  }
  const indicators = value ? extractedIndicators(`${value.review.text}\n${value.review.qr}`) : null;
  const errors: Record<ImageError,[string,string]> = {
    type:["Choose a genuine PNG, JPEG or WebP image.","اختر صورة فعلية بصيغة PNG أو JPEG أو WebP."],
    size:["Image must be nonempty and at most 8 MiB.","يجب ألا تكون الصورة فارغة وألا تتجاوز 8 ميبيبايت."],
    dimensions:["Image exceeds 8192 pixels per side or 16 million pixels, or has invalid dimensions.","تتجاوز الصورة 8192 بكسلاً للضلع أو 16 مليون بكسل، أو أبعادها غير صالحة."],
    decode:["This image cannot be decoded. Choose another image.","تعذّرت قراءة هذه الصورة. اختر صورة أخرى."],
    ocr:["Local text reading failed. Retry or use the manual fields; no safety result was inferred.","تعذّرت قراءة النص محلياً. أعد المحاولة أو استخدم الحقول اليدوية؛ لم تُستنتج نتيجة أمان."],
  };
  const update = (patch: Partial<ReviewData>) => { if(value) onChange({...value,review:{...value.review,...patch}}); };
  return <section className="space-y-3 border-t pt-3" aria-label={tr("Screenshot analysis","تحليل لقطة الشاشة")}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{tr("Screenshot — optional","لقطة شاشة — اختياري")}</h3><div className="flex gap-1"><Button type="button" variant="outline" size="sm" onClick={()=>upload.current?.click()}><ImagePlus />{tr("Select image","اختر صورة")}</Button><Button type="button" variant="outline" size="icon" aria-label={tr("Take a photo","التقاط صورة")} title={tr("Take a photo","التقاط صورة")} onClick={()=>camera.current?.click()}><Camera /></Button></div></div>
    <input ref={upload} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label={tr("Screenshot file","ملف لقطة الشاشة")} onChange={e=>{const next=e.target.files?.[0];e.target.value="";if(next)void read(next);}} />
    <input ref={camera} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" className="hidden" aria-label={tr("Camera image","صورة الكاميرا")} onChange={e=>{const next=e.target.files?.[0];e.target.value="";if(next)void read(next);}} />
    <p className="text-xs text-muted-foreground">{tr("Text and QR reading stays on your device. Original images are not sent or saved. PNG / JPEG / WebP · up to 8 MiB.","تظل قراءة النص ورموز QR على جهازك. لا تُرسل الصور الأصلية ولا تُحفظ. PNG / JPEG / WebP · حتى 8 ميبيبايت.")}</p>
    {file && <div className="flex min-w-0 items-center justify-between gap-2"><span dir="auto" className="min-w-0 break-all text-xs">{file.name}</span><div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="icon" title={tr("Retry image reading","إعادة قراءة الصورة")} aria-label={tr("Retry image reading","إعادة قراءة الصورة")} disabled={progress!==null} onClick={()=>void read(file)}><RefreshCw /></Button><Button type="button" variant="ghost" size="icon" title={tr("Remove image","إزالة الصورة")} aria-label={tr("Remove image","إزالة الصورة")} onClick={remove}><X /></Button></div></div>}
    {preview && <img src={preview} alt={tr("Selected screenshot","لقطة الشاشة المختارة")} className="max-h-52 w-full object-contain" />}
    {progress!==null && <div role="status" className="space-y-1"><p className="text-xs">{tr("Reading on your device…","تجري القراءة على جهازك…")} {progress}%</p><progress max={100} value={progress} className="h-2 w-full accent-primary" /></div>}
    {error && <p role="alert" className="text-sm text-destructive">{tr(...errors[error])}</p>}
    {value && <div className="space-y-3">
      <p className="text-xs">{tr("OCR confidence (not a risk score): ","ثقة القراءة (ليست درجة خطورة): ")}{Math.round(value.data.confidence)}%</p>
      {(extractionIncomplete(value.data) || value.data.uncertainWords.length>0) && <p role="status" className="text-xs text-unverified">{tr("Some text is unreadable, uncertain or may be cropped. Review it; absence of extracted indicators does not mean safety.","بعض النص غير مقروء أو غير مؤكد أو قد يكون مقتطعاً. راجعه؛ غياب المؤشرات المستخرجة لا يعني الأمان.")} {value.data.uncertainWords.length>0 && <bdi>{value.data.uncertainWords.join(" · ")}</bdi>}</p>}
      <div className="space-y-1"><Label htmlFor="screenshot-text">{tr("Extracted text — editable","النص المستخرج — قابل للتعديل")}</Label><Textarea id="screenshot-text" dir="auto" rows={4} maxLength={10000} value={value.review.text} onChange={e=>update({text:e.target.value})} /></div>
      <div className="space-y-1"><Label htmlFor="screenshot-qr">{tr("Decoded QR content — editable","محتوى QR المقروء — قابل للتعديل")}</Label><Textarea id="screenshot-qr" dir="auto" rows={2} maxLength={10000} value={value.review.qr} onChange={e=>update({qr:e.target.value})} /></div>
      <div className="space-y-1"><Label htmlFor="screenshot-url">{tr("Extracted link — editable","الرابط المستخرج — قابل للتعديل")}</Label><Input id="screenshot-url" dir="ltr" maxLength={2000} value={value.review.url} onChange={e=>update({url:e.target.value})} /></div>
      <div className="space-y-1"><Label htmlFor="screenshot-sender">{tr("Visible sender — optional; contacts below are not assumed to be the sender","المرسل الظاهر — اختياري؛ لا تُعتبر جهات الاتصال أدناه مرسلاً تلقائياً")}</Label><Input id="screenshot-sender" dir="auto" maxLength={500} value={value.review.sender} onChange={e=>update({sender:e.target.value})} /></div>
      {indicators && <div className="space-y-1 break-all text-xs" dir="auto">{[...indicators.urls,...indicators.phones,...indicators.emails].map(v=><p key={v}><bdi>{v}</bdi></p>)}{indicators.organizations.map(o=><p key={o.en}>{pick(o)} · {tr("mentioned, not verified","مذكورة وليست موثقة")}</p>)}</div>}
      <p className="text-xs text-muted-foreground">{tr("Screenshots cannot verify hidden link destinations, logos, visual authenticity or the complete conversation. QR destinations are never opened.","لا تثبت اللقطات الوجهات المخفية للروابط أو الشعارات أو الأصالة البصرية أو المحادثة كاملة. لا تُفتح وجهات QR.")}</p>
      <div className="space-y-2 border-t pt-2"><div className="flex items-start gap-2"><Checkbox id="screenshot-consent" checked={consent} onCheckedChange={v=>setConsent(v===true)} /><Label htmlFor="screenshot-consent" className="text-xs leading-relaxed">{tr("I choose to save the original locally for private evidence attachment.","أختار حفظ الأصل محلياً لإرفاقه كدليل خاص.")}</Label></div><Button type="button" variant="outline" size="sm" disabled={!consent} onClick={()=>{if(!consent||!file)return;const url=URL.createObjectURL(file);const a=document.createElement("a");a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}><Download />{tr("Save original for private evidence","حفظ الأصل للدليل الخاص")}</Button><p className="text-xs text-muted-foreground">{tr("Public reports contain reviewed text, not the image. Authorized staff may attach the saved original to the report using its existing private evidence upload (PNG/JPEG, 512 KiB maximum; WebP requires conversion).", "تحتوي البلاغات العامة على النص المراجع وليس الصورة. يمكن للموظف المصرح له إرفاق الأصل المحفوظ بالبلاغ عبر رفع الأدلة الخاصة الحالي (PNG/JPEG، حتى 512 كيلوبايت؛ يلزم تحويل WebP).")}</p></div>
    </div>}
  </section>;
}