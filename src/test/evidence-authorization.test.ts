import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { authorizedPackage } from "@/lib/evidence/evidence.server";
import { createSeedState } from "./fixtures/security-seed";
const alerts=createSeedState().alerts;
function client(access: boolean, rows: unknown[] = []) {
 const rpc=vi.fn(async()=>({data:access,error:null}));
 const from=vi.fn((table:string)=>{
  const chain={select:vi.fn(()=>chain),eq:vi.fn(()=>chain),maybeSingle:vi.fn(async()=>({data:{payload:{alerts,lookalikes:[]}},error:null})),order:vi.fn(async()=>({data:rows,error:null}))};
  if(table!=="security_workspaces" && table!=="private_evidence_items") throw new Error("Unexpected table");return chain;
 });return {db:{rpc,from} as unknown as SupabaseClient<Database>,rpc,from};
}
describe("evidence authorization and readback",()=>{
 it("denies revoked or wrong-institution sessions before reading any records",async()=>{for(const kind of ["case","intelligence","application"] as const){const c=client(false);await expect(authorizedPackage(c.db,"owner",{kind,id:"record"})).rejects.toThrow("evidence_forbidden");expect(c.from).not.toHaveBeenCalled();expect(c.rpc).toHaveBeenCalledWith("has_private_evidence_access",{subject_kind:kind});}});
 it("rejects missing subject records instead of accepting a client snapshot",async()=>{const c=client(true);await expect(authorizedPackage(c.db,"owner",{kind:"case",id:"not-owned"})).rejects.toThrow("subject_unavailable");});
 it("returns only the authorized server subject and verifies attachment hashes on readback",async()=>{const first=alerts[0];if(!first)throw new Error("Missing seed");const meta={name:"abc.txt",mime:"text/plain",source:"Fictional fixture",capturedAt:"2026-11-24T10:00:00Z",provenance:"synthetic",bytes:3,sha256:"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"};const c=client(true,[{id:"file",event_kind:"attachment",created_at:"2026-11-24T10:01:00Z",metadata:meta,content_base64:"YWJj"}]);const pack=await authorizedPackage(c.db,"owner",{kind:"case",id:first.id});expect(pack.subject.id).toBe(first.id);expect(pack.attachments[0]?.content).toBe("YWJj");expect(pack.attachments[0]?.metadata.sha256).toBe(meta.sha256);});
 it("blocks exports when stored content does not match its integrity hash",async()=>{const first=alerts[0];if(!first)throw new Error("Missing seed");const c=client(true,[{id:"file",event_kind:"attachment",created_at:"2026-11-24T10:01:00Z",metadata:{name:"abc.txt",mime:"text/plain",source:"Fictional fixture",capturedAt:"2026-11-24T10:00:00Z",provenance:"synthetic",bytes:3,sha256:"0".repeat(64)},content_base64:"YWJj"}]);await expect(authorizedPackage(c.db,"owner",{kind:"case",id:first.id})).rejects.toThrow("integrity_mismatch");});
});
