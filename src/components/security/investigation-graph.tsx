import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { TransformComponent, TransformWrapper, useControls } from "react-zoom-pan-pinch";
import { AtSign, Fingerprint, Globe, Link2, Mail, Maximize, MessageSquareText, Minus, Phone, ShieldAlert, ZoomIn, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/common/native-select";
import { Mono } from "@/components/common/bits";
import type { ImpersonationAlert, IndicatorType } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/i18n";
import { alertStatusLabel, evidenceLabel, indicatorLabel } from "@/lib/i18n/labels";
import { buildInvestigation, indicatorKey } from "@/lib/services/investigation";
import { cn } from "@/lib/utils";

const icons: Record<IndicatorType, LucideIcon> = { ip: Fingerprint, domain: Globe, url: Link2, phone: Phone, email: Mail, sms_sender: MessageSquareText, social_handle: AtSign };

function AutoFit({ viewport, height }: { viewport: RefObject<HTMLDivElement | null>; height: number }) {
  const { centerView } = useControls();
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const resize = new ResizeObserver(() => {
      centerView(Math.min((el.clientWidth - 24) / 800, (el.clientHeight - 24) / height, 1), 0);
    });
    resize.observe(el);
    return () => resize.disconnect();
  }, [viewport, height, centerView]);
  return null;
}

export function InvestigationGraph({ alerts, initialCaseId, onOpenCase }: { alerts: ImpersonationAlert[]; initialCaseId?: string | undefined; onOpenCase: (id: string) => void }) {
  const { tr, pick, date, num, lang } = useI18n();
  const graph = useMemo(() => buildInvestigation(alerts), [alerts]);
  const [scope, setScope] = useState(initialCaseId ?? alerts[0]?.id ?? "all");
  const [selection, setSelection] = useState(initialCaseId ?? alerts[0]?.id ?? "");
  const viewport = useRef<HTMLDivElement>(null);
  const anchor = alerts.find((c) => c.id === scope);
  const relatedIds = new Set(anchor ? graph.indicators.filter((i) => i.cases.some((c) => c.id === anchor.id)).flatMap((i) => i.cases.map((c) => c.id)) : alerts.map((c) => c.id));
  if (anchor) relatedIds.add(anchor.id);
  const visibleCases = alerts.filter((c) => relatedIds.has(c.id));
  const visibleIndicators = graph.indicators.filter((i) => i.cases.some((c) => relatedIds.has(c.id)));
  const height = Math.max(520, visibleIndicators.length * 82 + 70, visibleCases.length * 105 + 70);
  const caseX = lang === "ar" ? 535 : 30;
  const indicatorX = lang === "ar" ? 30 : 430;
  const caseY = (index: number) => 65 + index * ((height - 170) / Math.max(visibleCases.length - 1, 1));
  const indicatorY = (index: number) => 55 + index * 82;
  const selectedIndicator = graph.indicators.find((i) => i.id === selection);
  const selectedCase = alerts.find((c) => c.id === selection);
  const associated = selectedIndicator?.cases ?? (selectedCase ? [selectedCase] : []);
  const leads = graph.leads.filter((l) => scope === "all" || l.cases.some((c) => relatedIds.has(c.id)));
  const fit = (center: (scale?: number, duration?: number) => void) => {
    const el = viewport.current;
    if (el) center(Math.min((el.clientWidth - 24) / 800, (el.clientHeight - 24) / height, 1), 0);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">{tr("Investigation graph", "شبكة التحقيق")}</h2><p className="mt-1 text-xs text-muted-foreground">{tr("Fictional cases · Investigative leads only", "قضايا خيالية · خيوط تحقيق فقط")}</p></div>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>{tr("Case network", "شبكة القضية")}</span>
          <NativeSelect className="w-48" value={scope} onChange={(e) => { setScope(e.target.value); setSelection(e.target.value === "all" ? alerts[0]?.id ?? "" : e.target.value); }}>
            <option value="all">{tr("All cases", "كل القضايا")}</option>
            {alerts.map((c) => <option key={c.id} value={c.id}>{c.caseId}</option>)}
          </NativeSelect>
        </label>
      </div>

      <div className="flex items-start gap-3 border-s-4 border-unverified bg-unverified-soft px-4 py-3 text-sm text-unverified">
        <ShieldAlert className="mt-0.5 size-5 shrink-0" />
        <p>{tr("Every relationship is an investigative lead requiring human review. Shared indicators do not establish the same offender; shared hosting or infrastructure may explain a match.", "كل علاقة هي خيط تحقيق يتطلب مراجعة بشرية. المؤشرات المشتركة لا تثبت وحدة مرتكب الجريمة؛ فقد تفسر الاستضافة أو البنية التحتية المشتركة هذا التطابق.")}</p>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-3"><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-primary" />{num(visibleCases.length)} {tr("cases", "قضايا")}</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-info" />{num(visibleIndicators.length)} {tr("indicators", "مؤشرات")}</span><span className="flex items-center gap-1.5 text-unverified"><Link2 className="size-3.5" />{tr("Shared indicator", "مؤشر مشترك")}</span></div>
          </div>
          <TransformWrapper key={`${scope}:${lang}`} minScale={0.15} maxScale={2.5} limitToBounds={false} wheel={{ step: 0.06 }} panning={{ excluded: ["button"] }} doubleClick={{ disabled: true }}>
            {({ zoomIn, zoomOut, centerView }) => (
              <div ref={viewport} className="investigation-surface relative h-[520px] sm:h-[560px]" dir="ltr">
                <AutoFit viewport={viewport} height={height} />
                <div className="absolute end-3 top-3 z-10 flex gap-1 rounded-md border bg-card p-1 shadow-card">
                  <Button variant="ghost" size="icon" aria-label={tr("Zoom in", "تكبير")} title={tr("Zoom in", "تكبير")} onClick={() => zoomIn(0.5, 0)}><ZoomIn /></Button>
                  <Button variant="ghost" size="icon" aria-label={tr("Zoom out", "تصغير")} title={tr("Zoom out", "تصغير")} onClick={() => zoomOut(0.5, 0)}><Minus /></Button>
                  <Button variant="ghost" size="icon" aria-label={tr("Fit graph", "ملاءمة الشبكة")} title={tr("Fit graph", "ملاءمة الشبكة")} onClick={() => fit(centerView)}><Maximize /></Button>
                </div>
                <TransformComponent wrapperClass="investigation-transform" contentClass="investigation-content">
                  <div className="relative" style={{ width: 800, height }} role="group" aria-label={tr("Case and indicator network", "شبكة القضايا والمؤشرات")}>
                    <svg className="pointer-events-none absolute inset-0" width={800} height={height} aria-hidden>
                      {visibleIndicators.flatMap((i, index) => i.cases.filter((c) => relatedIds.has(c.id)).map((c) => {
                        const cy = caseY(visibleCases.findIndex((v) => v.id === c.id)) + 37;
                        const iy = indicatorY(index) + 31;
                        return <path key={`${c.id}-${i.id}`} d={lang === "ar" ? `M 535 ${cy} C 455 ${cy}, 450 ${iy}, 370 ${iy}` : `M 265 ${cy} C 345 ${cy}, 350 ${iy}, 430 ${iy}`} className={cn("investigation-edge", i.cases.length > 1 && "investigation-edge-shared", (selection === i.id || selection === c.id) && "investigation-edge-selected")} />;
                      }))}
                    </svg>
                    {visibleCases.map((c, index) => <Button key={c.id} variant="outline" aria-label={`${tr("Case", "قضية")} ${c.caseId}`} aria-pressed={selection === c.id} onClick={() => setSelection(c.id)} className={cn("absolute h-[74px] w-[235px] justify-start gap-3 whitespace-normal border-primary/30 bg-card px-3 text-start shadow-card", selection === c.id && "border-emerald ring-2 ring-emerald")} style={{ left: caseX, top: caseY(index) }}><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><ShieldAlert /></span><span className="min-w-0"><span className="block font-mono text-sm">{c.caseId}</span><span className="mt-1 block text-xs text-muted-foreground" dir={tr("ltr", "rtl")}>{pick(alertStatusLabel[c.status])}</span></span></Button>)}
                    {visibleIndicators.map((i, index) => { const Icon = icons[i.type]; return <Button key={i.id} variant="outline" aria-label={`${pick(indicatorLabel[i.type])}: ${i.value}`} aria-pressed={selection === i.id} onClick={() => setSelection(i.id)} className={cn("absolute h-[62px] w-[340px] justify-start gap-3 whitespace-normal bg-card px-3 text-start shadow-card", i.cases.length > 1 ? "border-unverified bg-unverified-soft" : "border-info/30", selection === i.id && "ring-2 ring-emerald")} style={{ left: indicatorX, top: indicatorY(index) }}><Icon className={i.cases.length > 1 ? "text-unverified" : "text-info"} /><span className="min-w-0 flex-1"><span className="block break-all font-mono text-xs leading-snug">{i.value}</span><span className="mt-1 block text-[11px] text-muted-foreground" dir={tr("ltr", "rtl")}>{pick(indicatorLabel[i.type])}</span></span>{i.cases.length > 1 ? <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-unverified text-primary-foreground">{num(i.cases.length)}</span> : null}</Button>; })}
                    {visibleCases.length === 0 ? <p className="p-10 text-muted-foreground">{tr("No cases available", "لا توجد قضايا")}</p> : null}
                  </div>
                </TransformComponent>
              </div>
            )}
          </TransformWrapper>
        </div>

        <aside className="min-w-0 border-t pt-4 xl:border-s xl:border-t-0 xl:ps-5 xl:pt-0" aria-label={tr("Node details", "تفاصيل العقدة")}>
          <h3 className="text-sm font-semibold">{tr("Selected node", "العقدة المحددة")}</h3>
          <p className="mt-2 break-all font-mono text-base font-semibold">{selectedIndicator?.value ?? selectedCase?.caseId ?? tr("No selection", "لا يوجد تحديد")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{tr("Indicator type", "نوع المؤشر")}: {selectedIndicator ? pick(indicatorLabel[selectedIndicator.type]) : tr("Case · multiple indicator types", "قضية · أنواع مؤشرات متعددة")}</p>
          {selectedIndicator && selectedIndicator.cases.length > 1 ? <Badge variant="unverified" className="mt-3">{tr("Shared · human review required", "مشترك · يتطلب مراجعة بشرية")}</Badge> : null}
          <h4 className="mt-5 text-xs font-semibold uppercase">{tr("Associated cases & status", "القضايا المرتبطة وحالتها")}</h4>
          <div className="mt-2 divide-y">
            {associated.map((c) => <div key={c.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><Mono className="font-semibold">{c.caseId}</Mono><Badge variant="muted">{pick(alertStatusLabel[c.status])}</Badge></div><p className="mt-2 text-sm">{pick(c.title)}</p><Button className="mt-1 px-0" variant="link" size="sm" onClick={() => onOpenCase(c.id)}>{tr("Open case", "فتح القضية")}<Link2 /></Button></div>)}
          </div>
          {selectedCase ? <div className="mt-3"><h4 className="text-xs font-semibold">{tr("Case indicators", "مؤشرات القضية")}</h4><div className="mt-2 space-y-1">{selectedCase.indicators.map((i) => <Button key={indicatorKey(i.type, i.value)} variant="ghost" className="h-auto w-full justify-start whitespace-normal px-2 py-2 text-start" onClick={() => setSelection(indicatorKey(i.type, i.value))}><span className="min-w-0"><span className="block text-xs text-muted-foreground">{pick(indicatorLabel[i.type])}</span><Mono className="break-all">{i.value}</Mono></span></Button>)}</div></div> : null}
          <h4 className="mt-5 text-xs font-semibold">{tr("Associated case evidence (fictional)", "أدلة القضايا المرتبطة (خيالية)")}</h4>
          <div className="mt-2 max-h-80 space-y-3 overflow-y-auto pe-1">
            {associated.flatMap((c) => c.evidence.map((e) => <div key={`${c.id}-${e.id}`} className="border-s-2 ps-3 text-xs"><p className="font-medium">{c.caseId} · {pick(evidenceLabel[e.kind])}</p><p className="mt-1 leading-relaxed text-muted-foreground">{pick(e.description)}</p><p className="mt-1 text-muted-foreground">{date(e.capturedAt, true)}</p></div>))}
            {associated.length > 0 && associated.every((c) => !c.evidence.length) ? <p className="text-xs text-muted-foreground">{tr("No evidence recorded", "لا توجد أدلة مسجلة")}</p> : null}
          </div>
        </aside>
      </div>

      <section className="border-t pt-5">
        <div className="flex items-center gap-2"><Link2 className="size-5 text-info" /><h3 className="text-lg font-semibold">{tr("Potentially linked cases", "قضايا يُحتمل ارتباطها")}</h3><Badge variant="muted">{num(leads.length)}</Badge></div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {leads.map((lead) => <article key={lead.cases.map((c) => c.id).join("-")} className="rounded-lg border bg-card p-4"><div className="flex flex-wrap items-center gap-2">{lead.cases.map((c) => <Button key={c.id} variant="secondary" size="sm" onClick={() => { setScope(c.id); setSelection(c.id); }}>{c.caseId}</Button>)}<Badge variant="unverified">{tr("Human review required", "يتطلب مراجعة بشرية")}</Badge></div><p className="mt-3 text-sm">{tr("Potential connection: exact match on", "ارتباط محتمل: تطابق تام في")}</p><ul className="mt-2 space-y-1">{lead.indicators.map((i) => <li key={i.id} className="text-sm"><span className="text-muted-foreground">{pick(indicatorLabel[i.type])}: </span><Button variant="link" className="h-auto max-w-full whitespace-normal px-0 py-1 text-start" onClick={() => { setScope(lead.cases[0].id); setSelection(i.id); }}><Mono className="break-all">{i.value}</Mono></Button></li>)}</ul><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tr("This is not an offender attribution. Review the fictional evidence and corroborate ownership, timing and infrastructure before drawing conclusions.", "هذا ليس إسناداً للجريمة إلى مرتكب واحد. راجع الأدلة الخيالية وتحقق من الملكية والتوقيت والبنية التحتية قبل استخلاص النتائج.")}</p></article>)}
          {leads.length === 0 ? <p className="text-sm text-muted-foreground">{tr("No shared indicators in this network. This does not prove cases are unrelated.", "لا توجد مؤشرات مشتركة في هذه الشبكة. هذا لا يثبت أن القضايا غير مرتبطة.")}</p> : null}
        </div>
      </section>

      <details className="border-t pt-4"><summary className="cursor-pointer text-sm font-semibold">{tr("Indicator register", "سجل المؤشرات")} · {num(graph.indicators.length)}</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted text-xs text-muted-foreground"><tr><th className="p-3 text-start">{tr("Indicator", "المؤشر")}</th><th className="p-3 text-start">{tr("Type", "النوع")}</th><th className="p-3 text-start">{tr("Associated cases", "القضايا المرتبطة")}</th></tr></thead><tbody>{graph.indicators.map((i) => <tr key={i.id} className="border-b"><td className="p-3"><Button variant="link" className="h-auto whitespace-normal p-0 text-start" onClick={() => { setScope(i.cases[0]?.id ?? "all"); setSelection(i.id); }}><Mono className="break-all">{i.value}</Mono></Button></td><td className="p-3">{pick(indicatorLabel[i.type])}</td><td className="p-3"><div className="flex flex-wrap gap-1">{i.cases.map((c) => <Button key={c.id} variant="secondary" size="sm" onClick={() => onOpenCase(c.id)}>{c.caseId}</Button>)}</div></td></tr>)}</tbody></table></div></details>
    </div>
  );
}