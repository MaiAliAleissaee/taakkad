import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { snapshotSchema } from "@/lib/security/schema";
import { workspaceSchema } from "@/lib/intelligence/schema";
import { organizationPayload } from "@/lib/organizations/applications.server";
import { applicationEvidence, caseEvidence, intelligenceEvidence, type EvidencePackage } from "./model";
import { actionMetaSchema, attachmentMetaSchema, validateFile, type EvidenceSubject } from "./schema";
export async function authorizedPackage(client: SupabaseClient<Database>, userId: string, subject: EvidenceSubject): Promise<EvidencePackage> {
  const access = await client.rpc("has_private_evidence_access", { subject_kind: subject.kind });
  if (access.error || access.data !== true) throw new Error("evidence_forbidden");
  let pack: EvidencePackage;
  if (subject.kind === "application") {
    const row = await client.from("organization_applications").select("*").eq("id",subject.id).single();
    if (row.error || !row.data) throw new Error("subject_unavailable");
    pack = applicationEvidence({ ...row.data, payload: organizationPayload(row.data.payload) });
  } else {
    const workspace = await client.from("security_workspaces").select("payload").eq("user_id",userId).maybeSingle();
    if (workspace.error) throw new Error("subject_unavailable");
    const reports = workspace.data ? snapshotSchema.parse(workspace.data.payload).alerts : [];
    if (subject.kind === "case") {
      const record = reports.find(r => r.id === subject.id); if (!record) throw new Error("subject_unavailable");
      pack = caseEvidence(record,reports);
    } else {
      const result = await client.rpc("read_analyst_intelligence"); if (result.error) throw new Error("subject_unavailable");
      const records = workspaceSchema.parse(result.data).records; const record = records.find(r => r.id === subject.id);
      if (!record) throw new Error("subject_unavailable");
      pack = intelligenceEvidence(record,records,reports);
    }
  }
  const items = await client.from("private_evidence_items").select("*").eq("user_id",userId).eq("subject_kind",subject.kind).eq("subject_id",subject.id).order("created_at");
  if (items.error) throw new Error("evidence_unavailable");
  for (const item of items.data) {
    if (item.event_kind === "attachment") {
      const metadata = attachmentMetaSchema.parse(item.metadata);
      const check = await validateFile(item.content_base64,metadata.mime);
      if (check.sha256 !== metadata.sha256 || check.bytes !== metadata.bytes) throw new Error("integrity_mismatch");
      pack.attachments.push({ id: item.id, createdAt: item.created_at, metadata, content: item.content_base64 });
      pack.timeline.push({ at: item.created_at, title: { en: "Evidence file accepted and hashed", ar: "قبول ملف الدليل وحساب بصمته" }, detail: { en: `${metadata.name} · SHA-256 ${metadata.sha256}`, ar: `${metadata.name} · SHA-256 ${metadata.sha256}` }, source: metadata.source, provenance: metadata.provenance });
      pack.timeline.push({ at: metadata.capturedAt, title: { en: "Declared file capture time", ar: "وقت التقاط الملف المصرح به" }, detail: { en: "Staff supplied, not independently certified", ar: "قدمه الموظف وليس موثقاً بشكل مستقل" }, source: metadata.source, provenance: metadata.provenance });
    } else {
      const metadata = actionMetaSchema.parse(item.metadata); pack.actions.push({ id: item.id, at: item.created_at, metadata });
      pack.timeline.push({ at: item.created_at, title: { en: "Human preparation decision", ar: "قرار إعداد بشري" }, detail: { en: metadata.note, ar: metadata.note }, source: "Private authenticated staff audit", provenance: "human_review" });
    }
  }
  return pack;
}
