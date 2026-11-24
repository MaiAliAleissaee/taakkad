import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { subjectSchema, attachmentInputSchema, actionInputSchema, validateFile } from "./schema";
export const readEvidencePackage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => subjectSchema.parse(input)).handler(async ({context,data}) => {
  const { authorizedPackage } = await import("./evidence.server");
  return authorizedPackage(context.supabase,context.userId,data);
});
export const attachPrivateEvidence = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => attachmentInputSchema.parse(input)).handler(async ({context,data}) => {
  const { authorizedPackage } = await import("./evidence.server");
  await authorizedPackage(context.supabase,context.userId,{kind:data.kind,id:data.id});
  if (Date.parse(data.capturedAt) > Date.now()+300000) throw new Error("capture_in_future");
  const integrity = await validateFile(data.content,data.mime);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.rpc("append_private_evidence", {actor_id:context.userId,kind:data.kind,subject:data.id,event:"attachment",meta:{name:data.name,mime:data.mime,source:data.source,capturedAt:data.capturedAt,provenance:data.synthetic ? "synthetic" : "staff_submission",...integrity},file_content:data.content});
  if (result.error) throw new Error("evidence_limit_or_save_failed");
  return authorizedPackage(context.supabase,context.userId,{kind:data.kind,id:data.id});
});
export const approveEvidenceAction = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => actionInputSchema.parse(input)).handler(async ({context,data}) => {
  const { authorizedPackage } = await import("./evidence.server");
  await authorizedPackage(context.supabase,context.userId,{kind:data.kind,id:data.id});
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.rpc("append_private_evidence", {actor_id:context.userId,kind:data.kind,subject:data.id,event:"action",meta:{action:data.action,note:data.note,confirmed:data.confirmed},file_content:""});
  if (result.error) throw new Error("evidence_limit_or_save_failed");
  return authorizedPackage(context.supabase,context.userId,{kind:data.kind,id:data.id});
});
