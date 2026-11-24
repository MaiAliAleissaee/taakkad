import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert, RefreshCw, CheckCircle2 } from "lucide-react";
import { readOrganizationConflicts, resolveOrganizationConflicts, refreshOrganizationTechnical } from "@/lib/organizations/conflicts.functions";
import { relationshipLabels, identityIndicatorLabels, requiresConflictDecision } from "@/lib/organizations/relationship";
import { useI18n } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export function ConflictReview({ id, revision, userId, independent, changed, onApprovalReady }: { id: string; revision: number; userId: string; independent: boolean; changed: () => Promise<void>; onApprovalReady: (ready: boolean) => void }) {
  const { tr, pick, date } = useI18n();
  const read = useServerFn(readOrganizationConflicts);
  const resolve = useServerFn(resolveOrganizationConflicts);
  const refresh = useServerFn(refreshOrganizationTechnical);
  const query = useQuery({ queryKey: ["organization-conflicts", userId, id, revision], queryFn: () => read({ data: { id } }), retry: false });
  const [note, setNote] = useState(""); const [explanation, setExplanation] = useState(false); const [evidence, setEvidence] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const data = query.data;
  const ready = !!data && (!requiresConflictDecision(data.conflicts) || (data.resolved && data.review.actor === userId));
  useEffect(() => { onApprovalReady(ready); }, [ready, onApprovalReady]);
  async function act(action: "resolve" | "refresh") {
    if (!data) return; setBusy(true); setError("");
    try {
      if (action === "resolve") await resolve({ data: { id, revision: data.revision, note, explanationReviewed: true, evidenceReviewed: true } });
      else await refresh({ data: { id, revision: data.revision } });
      await changed(); await query.refetch(); setNote(""); setExplanation(false); setEvidence(false);
    } catch { setError(tr("Review unavailable or the application changed. Reload and check your access.", "تعذّرت المراجعة أو تغيّر الطلب. أعد التحميل وتحقق من صلاحياتك.")); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 border-b pb-5" aria-label={tr("Identity conflict review", "مراجعة تعارض الهوية")}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-semibold"><ShieldAlert className="size-5 text-unverified" />{tr("Identity conflicts & declared relationships", "تعارضات الهوية والعلاقات المصرّح بها")}</h3><Button variant="outline" size="sm" disabled={busy || !data || !independent} onClick={() => void act("refresh")}><RefreshCw />{tr("Check DNS / registration", "فحص DNS / التسجيل")}</Button></div>
    <p className="text-sm text-muted-foreground">{tr("Matches are private review leads, not fraud findings. Shared hosting or DNS alone never establishes fraud; a declaration does not clear a conflict.", "المطابقات مؤشرات مراجعة خاصة وليست أحكام احتيال. لا تثبت الاستضافة أو DNS المشتركة الاحتيال، ولا تحسم الإفادة التعارض.")}</p>
    {query.isPending && <p role="status">{tr("Checking private identity conflicts…", "جارٍ فحص تعارضات الهوية الخاصة…")}</p>}
    {query.isError && <p role="alert" className="text-sm text-destructive">{tr("Conflict checks unavailable. Approval is blocked until checks succeed.", "فحوص التعارض غير متاحة. يتوقف الاعتماد حتى نجاح الفحص.")}</p>}
    {data && <>
      <dl className="space-y-2 text-sm"><dt className="font-medium">{tr("Applicant declaration — not independently verified", "إفادة مقدم الطلب — غير موثّقة بشكل مستقل")}</dt><dd>{data.relationship ? pick(relationshipLabels[data.relationship.kind]) : tr("Not declared in this older application", "لم يُصرّح بها في هذا الطلب السابق")}</dd>{data.relationship?.kind !== "none" && data.relationship && <><dd dir="auto" className="break-words">{data.relationship.organization}</dd><dd dir="auto" className="whitespace-pre-wrap break-words">{data.relationship.explanation}</dd><dt className="text-muted-foreground">{tr("Declared supporting evidence / reference", "الأدلة الداعمة / المرجع المصرّح به")}</dt><dd dir="auto" className="whitespace-pre-wrap break-words">{data.relationship.evidence || tr("None supplied; record uncertainty in the review.", "لم تُقدّم؛ وثّق عدم اليقين في المراجعة.")}</dd></>}</dl>
      {data.conflicts.length ? <div className="grid gap-3 md:grid-cols-2">{data.conflicts.map((c, i) => <article key={`${c.organizationId}:${c.indicator}:${i}`} className="min-w-0 space-y-2 rounded-lg border bg-card p-4">
        <h4 dir="auto" className="break-words font-semibold">{pick(c.name)}</h4><Badge variant={c.severity === "high" ? "suspicious" : "unverified"}>{c.severity === "high" ? tr("High — enhanced review", "مرتفع — مراجعة معزّزة") : c.severity === "medium" ? tr("Medium", "متوسط") : tr("Low — infrastructure only", "منخفض — بنية تقنية فقط")}</Badge>
        <p className="text-xs text-muted-foreground">{c.match === "exact" ? tr("Exact match", "تطابق تام") : tr("Approximate match", "تشابه تقريبي")} · {pick(identityIndicatorLabels[c.indicator]) || c.indicator}</p><p dir="ltr" className="break-all font-mono text-xs">{c.value}{c.value !== c.matchedValue && <> ↔ {c.matchedValue}</>}</p>
        <p className="text-sm">{c.reason === "shared_infrastructure" ? tr("Shared observed infrastructure; may be an unrelated service provider.", "بنية تقنية مرصودة مشتركة؛ قد تكون لمزود خدمة غير ذي علاقة.") : c.reason === "similar_identity" ? tr("Similar name or lookalike domain; human review required, not an identity conclusion.", "اسم متشابه أو نطاق شبيه؛ يتطلب مراجعة بشرية وليس استنتاج هوية.") : tr("An existing organization or relevant application uses the same channel/domain; review authorization and supporting evidence.", "جهة قائمة أو طلب ذو صلة يستخدم القناة أو النطاق نفسه؛ راجع التفويض والأدلة الداعمة.")}</p>
        <p className="text-xs text-muted-foreground">{c.provenance === "technical_snapshot" ? tr("Source: stored DNS / routing snapshot", "المصدر: لقطة DNS / توجيه محفوظة") : c.provenance === "registry" ? tr("Source: existing registry record", "المصدر: سجل جهة قائم") : tr("Source: stored application assertion", "المصدر: إفادة طلب محفوظة")}</p>
      </article>)}</div> : <p className="text-sm">{tr("No identity overlaps found in the current records. This is not ownership verification.", "لم تُكتشف تعارضات هوية في السجلات الحالية. لا يُعد ذلك تحققاً من الملكية.")}</p>}
      <details className="text-sm"><summary className="cursor-pointer font-medium">{tr("Technical evidence & source timestamps", "الأدلة التقنية والمصادر وأوقات الرصد")}</summary>{data.technical.length ? data.technical.map(s => <div key={s.domain} className="mt-3 space-y-1"><p dir="ltr" className="break-all font-mono">{s.domain}</p>{s.observation ? <><p>{date(s.observation.checkedAt, true)} · DNS: {s.observation.dns === "resolved" ? tr("Resolved", "تم الحل") : s.observation.dns === "no_records" ? tr("No records", "لا توجد سجلات") : tr("Unavailable", "غير متاح")} · RDAP: {s.observation.registration === "confirmed" ? tr("Registration record found", "عُثر على سجل التسجيل") : s.observation.registration === "not_found" ? tr("Not found", "لم يُعثر عليه") : s.observation.registration === "unsupported" ? tr("Unsupported", "غير مدعوم") : tr("Unavailable", "غير متاح")}</p><p dir="ltr" className="break-all text-xs">{s.observation.dnsSource} · {s.observation.rdapSource ?? "—"} · {s.observation.networkSource ?? "—"}</p><pre dir="ltr" className="whitespace-pre-wrap break-all text-xs">{JSON.stringify({ addresses: s.observation.addresses, records: s.observation.records, asns: s.observation.asns }, null, 2)}</pre></> : <p>{tr("Unavailable / ineligible domain; no technical indicators fabricated.", "غير متاح / نطاق غير مؤهّل؛ لم تُختلق مؤشرات تقنية.")}</p>}</div>) : <p className="mt-2 text-muted-foreground">{tr("No technical snapshots recorded. Metadata checks never visit the organization's website.", "لم تُحفظ لقطات تقنية. لا تزور فحوص البيانات موقع الجهة.")}</p>}</details>
      {data.review.note && <div className="border-s-4 border-emerald ps-3 text-sm"><p className="font-medium">{data.resolved ? tr("Documented human review (not ownership verification)", "مراجعة بشرية موثّقة (ليست تحققاً من الملكية)") : tr("Previous review — changed evidence requires a new decision", "مراجعة سابقة — تغيّر الأدلة يتطلب قراراً جديداً")}</p><p dir="auto" className="whitespace-pre-wrap break-words">{data.review.note}</p></div>}
      {data.conflicts.length > 0 && independent && <div className="max-w-2xl space-y-3"><Label htmlFor="conflict-note">{tr("Document the relationship, evidence, uncertainty and conflict disposition", "وثّق العلاقة والأدلة وعدم اليقين وقرار معالجة التعارض")}</Label><Textarea id="conflict-note" dir="auto" maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /><label className="flex items-start gap-2 text-sm"><Checkbox checked={explanation} onCheckedChange={v => setExplanation(v === true)} />{tr("I reviewed the declaration or absence of a relationship explanation.", "راجعت الإفادة أو غياب شرح للعلاقة.")}</label><label className="flex items-start gap-2 text-sm"><Checkbox checked={evidence} onCheckedChange={v => setEvidence(v === true)} />{tr("I reviewed available supporting evidence below and documented any missing or unverified evidence.", "راجعت الأدلة الداعمة المتاحة أدناه ووثّقت أي أدلة ناقصة أو غير موثّقة.")}</label><Button disabled={busy || note.trim().length < 20 || !explanation || !evidence} onClick={() => void act("resolve")}><CheckCircle2 />{tr("Save documented conflict decision", "حفظ قرار التعارض الموثّق")}</Button>{!ready && <p className="text-sm text-destructive">{tr("High-risk overlaps require your documented conflict decision before approval.", "تتطلب التعارضات مرتفعة الخطورة قرار تعارض موثّقاً منك قبل الاعتماد.")}</p>}</div>}
    </>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}