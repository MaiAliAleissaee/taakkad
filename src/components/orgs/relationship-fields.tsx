import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/common/native-select";
import { useI18n } from "@/lib/i18n/i18n";
import { relationshipKinds, relationshipLabels, type Relationship } from "@/lib/organizations/relationship";

export function RelationshipFields({ value, onChange, invalid = false }: { value: Relationship; onChange: (value: Relationship) => void; invalid?: boolean }) {
  const { tr, pick } = useI18n();
  return <fieldset className="space-y-3 border-t pt-4">
    <Label htmlFor="relationship-kind">{tr("Corporate relationship", "العلاقة المؤسسية")}</Label>
    <NativeSelect id="relationship-kind" value={value.kind} onChange={e => { const kind = relationshipKinds.find(k => k === e.target.value); if (kind) onChange({ ...value, kind }); }}>
      {relationshipKinds.map(k => <option key={k} value={k}>{pick(relationshipLabels[k])}</option>)}
    </NativeSelect>
    {value.kind !== "none" && <>
      <div className="space-y-1.5"><Label htmlFor="relationship-organization">{tr("Related organization", "الجهة ذات العلاقة")}</Label><Input id="relationship-organization" dir="auto" maxLength={200} value={value.organization} onChange={e => onChange({ ...value, organization: e.target.value })} required /></div>
      <div className="space-y-1.5"><Label htmlFor="relationship-explanation">{tr("Relationship and shared channels (private)", "العلاقة وقنوات التواصل المشتركة (خاص)")}</Label><Textarea id="relationship-explanation" dir="auto" maxLength={2000} value={value.explanation} onChange={e => onChange({ ...value, explanation: e.target.value })} required /></div>
      <div className="space-y-1.5"><Label htmlFor="relationship-evidence">{tr("Supporting evidence description or reference (private)", "وصف أو مرجع الأدلة الداعمة (خاص)")}</Label><Textarea id="relationship-evidence" dir="auto" maxLength={2000} value={value.evidence} onChange={e => onChange({ ...value, evidence: e.target.value })} /></div>
    </>}
    {invalid && <p role="alert" className="text-xs text-destructive">{tr("Specify the related organization and an explanation of at least 10 characters.", "حدّد الجهة ذات العلاقة وأضف شرحاً لا يقل عن 10 أحرف.")}</p>}
    <p className="text-xs text-muted-foreground">{tr("Declarations remain private. Similarities are advisory and do not establish ownership or fraud.", "تبقى الإفادات خاصة. التشابهات استشارية ولا تثبت الملكية أو الاحتيال.")}</p>
  </fieldset>;
}