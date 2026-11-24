import type { Bi, ImpersonationAlert, Indicator, Organization } from "@/lib/domain/types";
import { formatDisplayDate } from "@/lib/i18n/date";
import { analyzeUrl } from "@/lib/services/url/analyze";
import { classifyUrlMl } from "@/lib/services/url/ml";
import { indicatorKey } from "@/lib/services/investigation";
import { priority, correlate } from "@/lib/intelligence/engine";
import type { IntelligenceRecord } from "@/lib/intelligence/schema";
import type { EvidenceSubject, AttachmentMeta, ActionMeta } from "./schema";
export type Provenance = "technical" | "prediction" | "generated" | "user_report" | "synthetic" | "staff_submission" | "human_review";
export const provenanceLabels: Record<Provenance, Bi> = {
  technical: { en: "Verified technical observation — not identity or intent", ar: "ملاحظة تقنية متحقق منها — ليست إثباتاً للهوية أو النية" },
  prediction: { en: "Model prediction — not a fact", ar: "توقع النموذج — ليس حقيقة" },
  generated: { en: "Deterministically generated candidate — not discovered or observed", ar: "مرشح مولد بقواعد حتمية — ليس مكتشفاً أو مرصوداً" },
  user_report: { en: "User / applicant assertion — unverified", ar: "ادعاء مستخدم أو مقدم طلب — غير متحقق منه" },
  synthetic: { en: "Fictional demonstration evidence", ar: "دليل تجريبي خيالي" },
  staff_submission: { en: "Staff-supplied evidence — source authenticity unverified", ar: "دليل قدمه موظف — أصالة المصدر غير متحقق منها" },
  human_review: { en: "Human review decision — no external submission", ar: "قرار مراجعة بشري — دون إرسال خارجي" },
};
export const actionLabels: Record<ActionMeta["action"], Bi> = {
  preserve: { en: "Preserve source material and integrity hashes", ar: "حفظ مواد المصدر وبصمات السلامة" },
  verify: { en: "Independently verify identity, source and technical observations", ar: "التحقق المستقل من الهوية والمصدر والملاحظات التقنية" },
  request_information: { en: "Request additional evidence through the existing review process", ar: "طلب أدلة إضافية عبر إجراءات المراجعة القائمة" },
  prepare_request: { en: "Approve preparation for authorized police / takedown review (not sent)", ar: "اعتماد الإعداد لمراجعة الشرطة أو طلب إزالة مصرح به (لم يُرسل)" },
};
export interface TimelineEvent { at: string | null; title: Bi; detail: Bi; source: string; provenance: Provenance }
export interface EvidencePackage {
  schemaVersion: "taakkad-evidence-1"; subject: EvidenceSubject; reference: string; title: Bi; generatedAt: string;
  risk: Bi; indicators: Indicator[]; timeline: TimelineEvent[];
  urlFindings: Array<{ value: string; ruleIndex: number; signals: ReturnType<typeof analyzeUrl>["signals"]; ml: ReturnType<typeof classifyUrlMl> }>;
  links: Array<{ id: string; label: string; shared: string[]; synthetic: boolean }>;
  attachments: Array<{ id: string; createdAt: string; metadata: AttachmentMeta; content: string }>;
  actions: Array<{ id: string; at: string; metadata: ActionMeta }>;
  recommendations: Array<ActionMeta["action"]>; uncertainty: Bi[];
}
export function evidenceTimes(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return { utc: "Unknown / غير معروف", uaeEn: "Unknown", uaeAr: "غير معروف" };
  return { utc: new Date(value).toISOString(), uaeEn: `${formatDisplayDate(value, "en", true)} UAE (UTC+4)`, uaeAr: `${formatDisplayDate(value, "ar", true)} الإمارات (UTC+4)` };
}
const uncertainty: Bi[] = [
  { en: "Risk indices and URL ML outputs are not calibrated probabilities or proof of fraud. Listed URL patterns are rule contributions, not exact ML feature attribution.", ar: "مؤشرات الخطر ومخرجات نموذج الروابط ليست احتمالات معايرة أو إثباتاً للاحتيال. أنماط الروابط المذكورة مساهمات قواعد وليست تفسيراً دقيقاً لسمات نموذج ML." },
  { en: "No new website visits, DNS or registration checks were made for this report; missing or dated metadata remains unknown or stale.", ar: "لم تُجرَ زيارات مواقع أو فحوص DNS أو تسجيل جديدة لهذا التقرير؛ تبقى البيانات المفقودة أو القديمة غير معروفة أو قديمة." },
  { en: "Original visitor AI analyses are not stored in staff reports and are unavailable here; no AI finding is invented. URL ML is recomputed locally with the existing frozen model.", ar: "لا تُحفظ تحليلات الزوار الأصلية بالذكاء الاصطناعي في تقارير الموظفين ولا تتاح هنا؛ لا تُختلق نتائج AI. يُعاد حساب ML للروابط محلياً بالنموذج المجمد القائم." },
  { en: "Shared indicators are review leads, never attribution of guilt. SHA-256 proves byte consistency, not source authenticity, capture time or legal admissibility.", ar: "المؤشرات المشتركة دلائل للمراجعة وليست نسبة للذنب. تثبت SHA-256 تطابق البايتات وليس أصالة المصدر أو وقت الالتقاط أو المقبولية القانونية." },
];
function base(subject: EvidenceSubject, title: Bi, reference: string, indicators: Indicator[], risk: Bi, timeline: TimelineEvent[]): EvidencePackage {
  const urls = [...new Set(indicators.filter(i => i.type === "url" || i.type === "domain").map(i => i.value))].slice(0,10);
  return { schemaVersion: "taakkad-evidence-1", subject, reference, title, generatedAt: new Date().toISOString(), risk, indicators, timeline,
    urlFindings: urls.map(value => { const rules = analyzeUrl(value); return { value, ruleIndex: rules.riskScore, signals: rules.signals, ml: classifyUrlMl(value) }; }), links: [], attachments: [], actions: [], recommendations: ["preserve", "verify"], uncertainty };
}
export function caseEvidence(record: ImpersonationAlert, reports: ImpersonationAlert[]): EvidencePackage {
  const provenance: Provenance = record.source === "public_report" ? "user_report" : "synthetic";
  const pack = base({ kind: "case", id: record.id }, record.title, record.reportNumber ?? record.caseId, record.indicators,
    { en: `${record.severity} · stored risk index ${record.riskScore}/100 (${provenance === "synthetic" ? "fictional" : "rule-based"})`, ar: `${({ critical: "حرجة", high: "مرتفعة", medium: "متوسطة", low: "منخفضة" })[record.severity]} · مؤشر الخطر المحفوظ ${record.riskScore}/100 (${provenance === "synthetic" ? "خيالي" : "قائم على القواعد"})` },
    [{ at: record.detectedAt, title: { en: "Report received / detection recorded", ar: "استلام البلاغ أو تسجيل الرصد" }, detail: record.summary, source: record.source, provenance }, ...record.evidence.map(e => ({ at: e.capturedAt, title: { en: e.kind, ar: ({ message: "رسالة", whois: "بيانات التسجيل", dns: "DNS", screenshot: "لقطة شاشة", report: "بلاغ" })[e.kind] }, detail: e.description, source: record.source, provenance })), ...record.notes.map(n => ({ at: n.at, title: { en: "Analyst note", ar: "ملاحظة المحلل" }, detail: { en: n.text, ar: n.text }, source: "Stored staff note", provenance: "staff_submission" as const }))]);
  const keys = new Set(record.indicators.map(i => indicatorKey(i.type,i.value)));
  pack.links = reports.filter(r => r.id !== record.id).flatMap(r => { const shared = [...new Set(r.indicators.filter(i => keys.has(indicatorKey(i.type,i.value))).map(i => `${i.type}: ${i.value}`))]; return shared.length ? [{ id: r.id, label: r.reportNumber ?? r.caseId, shared, synthetic: r.source !== "public_report" }] : []; });
  if (record.severity === "high" || record.severity === "critical") pack.recommendations.push("prepare_request");
  return pack;
}
export function intelligenceEvidence(record: IntelligenceRecord, records: IntelligenceRecord[], reports: ImpersonationAlert[]): EvidencePackage {
  const p = priority(record); const o = record.observation;
  const pack = base({ kind: "intelligence", id: record.id }, { en: record.title, ar: record.title }, record.sourceReference, record.indicators,
    { en: `${p.risk} human-review priority`, ar: `${p.risk === "high" ? "مرتفعة" : p.risk === "medium" ? "متوسطة" : "منخفضة"} أولوية مراجعة بشرية` },
    [{ at: record.createdAt, title: { en: "Lead recorded", ar: "تسجيل المؤشر" }, detail: { en: record.notes, ar: record.notes }, source: record.sourceReference, provenance: record.synthetic ? "synthetic" : record.source === "generated" ? "generated" : "staff_submission" }]);
  if (record.sourceObservedAt) pack.timeline.push({ at: record.sourceObservedAt, title: { en: "Claimed source capture time", ar: "وقت التقاط المصدر المصرح به" }, detail: { en: "Supplied by analyst, not independently timestamped", ar: "قدمه المحلل؛ ليس توقيتاً مستقلاً موثقاً" }, source: record.sourceReference, provenance: record.synthetic ? "synthetic" : "staff_submission" });
  if (o) pack.timeline.push({ at: o.checkedAt, title: { en: "DNS / RDAP / routing snapshot", ar: "لقطة DNS / RDAP / التوجيه" }, detail: { en: JSON.stringify(o), ar: JSON.stringify(o) }, source: [o.dnsSource,o.rdapSource,o.networkSource].filter(Boolean).join(" · "), provenance: record.synthetic ? "synthetic" : "technical" });
  if (o?.registeredAt) pack.timeline.push({ at: o.registeredAt, title: { en: "RDAP registration event", ar: "حدث التسجيل عبر RDAP" }, detail: { en: "Registry event, not domain identity or intent", ar: "حدث سجل التسجيل وليس هوية النطاق أو نيته" }, source: o.rdapSource ?? "RDAP", provenance: record.synthetic ? "synthetic" : "technical" });
  const links = correlate(record,records,reports); pack.links = [...links.reports,...links.records];
  if (p.earlyWarning) pack.recommendations.push("prepare_request");
  return pack;
}
export function applicationEvidence(row: { id: string; payload: Organization; submitted_at: string; demo_registration: boolean; status: string; audit: unknown }): EvidencePackage {
  const pack = base({ kind: "application", id: row.id }, row.payload.name, row.id, row.payload.channels.map(c => ({ type: c.type === "website" ? "url" : c.type === "sms" ? "sms_sender" : c.type === "social" ? "social_handle" : c.type === "other" ? "domain" : c.type, value: c.value })),
    { en: `Application status: ${row.status} — not a fraud score`, ar: `حالة الطلب: ${({ pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض", needs_information: "مطلوب معلومات إضافية", suspended: "موقوف", removed: "مزال" } as Record<string,string>)[row.status] ?? row.status} — ليست درجة احتيال` },
    [{ at: row.submitted_at, title: { en: "Application submitted", ar: "تقديم الطلب" }, detail: { en: "Applicant identity/channel claims", ar: "ادعاءات مقدم الطلب بشأن الهوية والقنوات" }, source: "Private organization application", provenance: row.demo_registration ? "synthetic" : "user_report" }]);
  if (Array.isArray(row.audit)) for (const item of row.audit) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    pack.timeline.push({ at: typeof r["at"] === "string" ? r["at"] : null, title: { en: "Application review event", ar: "حدث مراجعة الطلب" }, detail: { en: JSON.stringify(item), ar: JSON.stringify(item) }, source: "Existing private decision audit", provenance: row.demo_registration ? "synthetic" : "human_review" });
  }
  pack.recommendations.push("request_information"); return pack;
}
export function reportLines(pack: EvidencePackage): string[] {
  const lines = ["Taakkad / تأكّد — PRIVATE EVIDENCE / أدلة خاصة", pack.title.en, pack.title.ar, `Reference / المرجع: ${pack.reference}`, `Generated / أُنشئ: ${pack.generatedAt}`, pack.risk.en, pack.risk.ar, "Authorized human review only. Nothing submitted externally. / للمراجعة البشرية المصرح بها فقط. لم يُرسل شيء خارجياً."];
  for (const u of pack.uncertainty) lines.push(u.en,u.ar);
  lines.push("Indicators / المؤشرات", ...pack.indicators.map(i => `${i.type}: ${i.value}`));
  lines.push("URL explanations / تفسير الروابط");
  for (const u of pack.urlFindings) { lines.push(u.value, `Rule index / مؤشر القواعد: ${u.ruleIndex}`, u.ml ? `Frozen URL ML / نموذج الروابط المجمد: ${u.ml.version}; score ${u.ml.score.toFixed(4)}; flagged ${u.ml.flagged}` : "ML unavailable / ML غير متاح"); for (const s of u.signals) lines.push(`${s.code} (+${s.weight} rule weight): ${s.en}`,s.ar); }
  lines.push("Timeline / التسلسل الزمني");
  for (const t of [...pack.timeline].sort((a,b) => (a.at ? Date.parse(a.at) || 0 : 0)-(b.at ? Date.parse(b.at) || 0 : 0))) { const time = evidenceTimes(t.at); lines.push(time.utc,time.uaeEn,time.uaeAr,t.title.en,t.title.ar,provenanceLabels[t.provenance].en,provenanceLabels[t.provenance].ar,t.detail.en,t.detail.ar,`Source / المصدر: ${t.source}`); }
  lines.push("Linked indicators — no guilt attribution / مؤشرات مرتبطة — دون نسبة الذنب", ...pack.links.map(l => `${l.label}${l.synthetic ? " [Synthetic / خيالي]" : ""}: ${l.shared.join(" · ")}`));
  lines.push("Attachments / المرفقات"); for (const a of pack.attachments) lines.push(`${a.metadata.name} (${a.metadata.bytes} bytes)`, `SHA-256: ${a.metadata.sha256}`, `Source / المصدر: ${a.metadata.source}`, `Claimed capture / الالتقاط المصرح به: ${a.metadata.capturedAt}`, provenanceLabels[a.metadata.provenance].en,provenanceLabels[a.metadata.provenance].ar);
  lines.push("Recommended actions / الإجراءات الموصى بها"); for (const a of pack.recommendations) lines.push(actionLabels[a].en,actionLabels[a].ar);
  lines.push("Human decisions / القرارات البشرية"); for (const a of pack.actions) lines.push(a.at,actionLabels[a.metadata.action].en,actionLabels[a.metadata.action].ar,a.metadata.note);
  return lines;
}
