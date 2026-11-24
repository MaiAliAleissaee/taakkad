import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { readOrganizationConflicts, refreshOrganizationTechnical } from "@/lib/organizations/conflicts.functions";
import { relationshipLabels, relationshipSchema, identityIndicatorLabels, similarityAdvisories } from "@/lib/organizations/relationship";
import { useI18n } from "@/lib/i18n/i18n";
import { Button } from "@/components/ui/button";

export function ConflictReview({ id, revision, userId, declaration, independent, changed }: { id: string; revision: number; userId: string; declaration: unknown; independent: boolean; changed: () => Promise<void> }) {
  const { tr, pick, date } = useI18n();
  const read = useServerFn(readOrganizationConflicts);
  const refresh = useServerFn(refreshOrganizationTechnical);
  const query = useQuery({ queryKey: ["organization-conflicts", userId, id, revision], queryFn: () => read({ data: { id } }), retry: false });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const data = query.data;
  const parsedDeclaration = relationshipSchema.safeParse(declaration);
  const relationship = data?.relationship ?? (parsedDeclaration.success ? parsedDeclaration.data : null);
  const matches = similarityAdvisories(data?.conflicts ?? []);
  async function checkTechnical() {
    if (!data) return; setBusy(true); setError("");
    try {
      await refresh({ data: { id, revision: data.revision } });
      await changed(); await query.refetch();
    } catch { setError(tr("Technical check unavailable or the application changed. Existing review actions remain available.", "الفحص التقني غير متاح أو تغيّر الطلب. تبقى إجراءات المراجعة الأصلية متاحة.")); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3 border-b pb-5" aria-label={tr("Corporate relationship and similarity advice", "العلاقة المؤسسية وتنبيه التشابه") }>
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{tr("Declared corporate relationship", "العلاقة المؤسسية المصرّح بها")}</h3><Button variant="outline" size="sm" disabled={busy || !data || !independent} onClick={() => void checkTechnical()}><RefreshCw />{tr("Check DNS / registration", "فحص DNS / التسجيل")}</Button></div>
    {query.isPending && <p role="status" className="text-sm text-muted-foreground">{tr("Loading private relationship and similarity information…", "جارٍ تحميل بيانات العلاقة والتشابه الخاصة…")}</p>}
    {query.isError && <p role="status" className="text-sm text-muted-foreground">{tr("Similarity information unavailable. Existing review actions remain available.", "بيانات التشابه غير متاحة. تبقى إجراءات المراجعة الأصلية متاحة.")}</p>}
    <p className="text-sm">{relationship ? pick(relationshipLabels[relationship.kind]) : tr("Not declared in this older application", "لم يُصرّح بها في هذا الطلب السابق")}{relationship?.kind !== "none" && relationship?.organization && <> · <span dir="auto">{relationship.organization}</span></>}</p>
    {relationship?.kind !== "none" && relationship && <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">{tr("Private declaration details", "تفاصيل الإفادة الخاصة")}</summary><p dir="auto" className="mt-2 whitespace-pre-wrap break-words">{relationship.explanation}</p>{relationship.evidence && <p dir="auto" className="mt-2 whitespace-pre-wrap break-words">{relationship.evidence}</p>}</details>}
    {data && <>
      {matches.length > 0 && <div role="status" className="space-y-2 rounded-md border border-unverified/40 bg-muted p-3">
        <p className="flex items-center gap-2 text-sm font-medium"><ShieldAlert className="size-4 text-unverified" />{tr("Similarity notice — advisory only", "تنبيه تشابه — استشاري فقط")}</p>
        <ul className="space-y-2 text-sm">{matches.map((c, i) => <li key={`${c.organizationId}:${c.indicator}:${i}`} className="min-w-0"><span dir="auto" className="font-medium">{pick(c.name)}</span> · {pick(identityIndicatorLabels[c.indicator]) || c.indicator} · {c.match === "exact" ? tr("Matching", "متطابق") : tr("Similar", "متشابه")}<p dir="ltr" className="break-all font-mono text-xs">{c.value}{c.value !== c.matchedValue && <> ↔ {c.matchedValue}</>}</p></li>)}</ul>
        <p className="text-xs text-muted-foreground">{tr("Shared IP addresses or infrastructure are context, not proof of fraud. Similarity does not block approval or verify ownership.", "عناوين IP أو البنية التقنية المشتركة معلومات سياقية وليست دليلاً على الاحتيال. التشابه لا يمنع الاعتماد ولا يثبت الملكية.")}</p>
      </div>}
      <details className="text-sm"><summary className="cursor-pointer font-medium">{tr("Technical evidence & source timestamps", "الأدلة التقنية والمصادر وأوقات الرصد")}</summary>{data.technical.length ? data.technical.map(s => <div key={s.domain} className="mt-3 space-y-1"><p dir="ltr" className="break-all font-mono">{s.domain}</p>{s.observation ? <><p>{date(s.observation.checkedAt, true)} · DNS: {s.observation.dns === "resolved" ? tr("Resolved", "تم الحل") : s.observation.dns === "no_records" ? tr("No records", "لا توجد سجلات") : tr("Unavailable", "غير متاح")} · RDAP: {s.observation.registration === "confirmed" ? tr("Registration record found", "عُثر على سجل التسجيل") : s.observation.registration === "not_found" ? tr("Not found", "لم يُعثر عليه") : s.observation.registration === "unsupported" ? tr("Unsupported", "غير مدعوم") : tr("Unavailable", "غير متاح")}</p><p dir="ltr" className="break-all text-xs">{s.observation.dnsSource} · {s.observation.rdapSource ?? "—"} · {s.observation.networkSource ?? "—"}</p><pre dir="ltr" className="whitespace-pre-wrap break-all text-xs">{JSON.stringify({ addresses: s.observation.addresses, records: s.observation.records, asns: s.observation.asns }, null, 2)}</pre></> : <p>{tr("Unavailable / ineligible domain; no technical indicators fabricated.", "غير متاح / نطاق غير مؤهّل؛ لم تُختلق مؤشرات تقنية.")}</p>}</div>) : <p className="mt-2 text-muted-foreground">{tr("No technical snapshots recorded. Metadata checks never visit the organization's website.", "لم تُحفظ لقطات تقنية. لا تزور فحوص البيانات موقع الجهة.")}</p>}</details>
    </>}
    {error && <p role="status" className="text-sm text-muted-foreground">{error}</p>}
  </section>;
}
