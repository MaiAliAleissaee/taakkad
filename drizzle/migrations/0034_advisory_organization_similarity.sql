CREATE OR REPLACE FUNCTION public.guard_organization_identity_approval() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE declaration jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(834771);
 IF NEW.payload ? 'relationshipDeclaration' THEN
  declaration:=NEW.payload->'relationshipDeclaration';
  IF jsonb_typeof(declaration)<>'object' OR coalesce(declaration->>'kind','') NOT IN('none','parent','subsidiary','sister','common_ownership','shared_channels','shared_provider','other') OR octet_length(declaration::text)>18000 THEN RAISE EXCEPTION 'Invalid relationship declaration'; END IF;
  NEW.relationship_declaration:=declaration;
  NEW.payload:=NEW.payload-'relationshipDeclaration';
 END IF;
 -- Similarity is contextual advice only. Original role-authorized review commands
 -- still enforce independence, revisions, decision notes and simulated projections.
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_organization_identity_approval() FROM PUBLIC,anon,authenticated;
COMMENT ON FUNCTION public.guard_organization_identity_approval() IS 'Protects private relationship declarations; similarity never gates an authorized approval.';
COMMENT ON COLUMN public.organization_applications.conflict_review IS 'Historical private conflict dispositions retained for audit; not an approval requirement.';
COMMENT ON FUNCTION public.resolve_organization_identity_conflicts(uuid,integer,text,boolean,boolean) IS 'Historical optional private review command; not used by the simplified approval workflow.';