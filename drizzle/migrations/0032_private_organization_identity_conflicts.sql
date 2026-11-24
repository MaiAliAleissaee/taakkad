ALTER TABLE public.organization_applications ADD COLUMN relationship_declaration jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.organization_applications ADD COLUMN identity_technical jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.organization_applications ADD COLUMN conflict_review jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.organization_applications.relationship_declaration IS 'Private applicant assertion, not proof of ownership; never included in public projections.';
COMMENT ON COLUMN public.organization_applications.identity_technical IS 'Server-observed fixed-origin DNS/RDAP snapshots only; shared infrastructure never proves fraud.';
CREATE FUNCTION public.normalize_identity_indicator(kind text, raw text) RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE v text:=lower(btrim(normalize(coalesce(raw,''),NFKC)));
BEGIN
 v:=translate(v,'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789');
 IF kind IN('domain','website') THEN
  v:=regexp_replace(v,'^https?://',''); v:=split_part(split_part(split_part(v,'/',1),'?',1),'#',1); v:=split_part(v,':',1); v:=regexp_replace(v,'^www\.',''); RETURN rtrim(v,'.');
 ELSIF kind='phone' THEN
  v:=regexp_replace(v,'[^0-9+]','','g');
  IF v ~ '^(\+971|00971|971|0)(5[024568][0-9]{7}|[234679][0-9]{7})$' THEN v:=regexp_replace(v,'^(\+971|00971|971|0)','+971'); END IF;
  RETURN v;
 ELSIF kind='social' THEN
  v:=regexp_replace(v,'[?#].*$',''); v:=rtrim(v,'/'); IF v ~ '^https?://' THEN v:=regexp_replace(v,'^.*/',''); END IF; RETURN regexp_replace(v,'^@','');
 ELSIF kind IN('name','sms') THEN
  v:=translate(v,'أإآى','اااي'); RETURN regexp_replace(v,'[[:space:][:punct:]ـًٌٍَُِّْ]','','g');
 END IF;
 RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.normalize_identity_indicator(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_identity_indicator(text,text) TO service_role;
CREATE FUNCTION public.identity_edit_distance(left_value text,right_value text) RETURNS integer LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE a text:=left(left_value,160); b text:=left(right_value,160); previous integer[]; current_row integer[]; i integer; j integer;
BEGIN
 IF a=b THEN RETURN 0; END IF;
 IF abs(length(a)-length(b))>3 THEN RETURN 99; END IF;
 SELECT array_agg(x) INTO previous FROM generate_series(0,length(b)) x;
 FOR i IN 1..length(a) LOOP
  current_row:=ARRAY[i];
  FOR j IN 1..length(b) LOOP
   current_row:=array_append(current_row,least(current_row[j]+1,previous[j+1]+1,previous[j]+CASE WHEN substr(a,i,1)=substr(b,j,1) THEN 0 ELSE 1 END));
  END LOOP;
  previous:=current_row;
 END LOOP;
 RETURN previous[length(b)+1];
END $$;
REVOKE ALL ON FUNCTION public.identity_edit_distance(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.identity_edit_distance(text,text) TO service_role;
CREATE FUNCTION public.organization_identity_indicators(p jsonb,t jsonb DEFAULT '[]') RETURNS TABLE(kind text,value text) LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT DISTINCT x.kind,public.normalize_identity_indicator(x.kind,x.value) FROM (
  SELECT 'name'::text kind, n.value FROM jsonb_each_text(coalesce(p->'name','{}')) n
  UNION ALL SELECT 'domain',d.value FROM jsonb_array_elements_text(coalesce(p->'domains','[]')) d
  UNION ALL SELECT CASE WHEN c->>'type'='website' THEN 'domain' ELSE c->>'type' END,c->>'value' FROM jsonb_array_elements(coalesce(p->'channels','[]')) c WHERE coalesce(c->>'status','pending') NOT IN('inactive','revoked','rejected')
  UNION ALL SELECT 'email',p->>'contactEmail'
  UNION ALL SELECT 'ip',a.value FROM jsonb_array_elements(t) snapshot CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(snapshot->'observation'->'addresses','[]')) a
  UNION ALL SELECT CASE WHEN r->>'type'='2' THEN 'dns_ns' WHEN r->>'type'='15' THEN 'dns_mx' ELSE 'dns_caa' END,r->>'data' FROM jsonb_array_elements(t) snapshot CROSS JOIN LATERAL jsonb_array_elements(coalesce(snapshot->'observation'->'records','[]')) r WHERE r->>'type' IN('2','15','257')
  UNION ALL SELECT 'asn',a.value FROM jsonb_array_elements(t) snapshot CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(snapshot->'observation'->'asns','[]')) a
 ) x WHERE coalesce(x.value,'')<>'';
$$;
REVOKE ALL ON FUNCTION public.organization_identity_indicators(jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.organization_identity_indicators(jsonb,jsonb) TO service_role;
CREATE FUNCTION public.organization_identity_conflicts(subject_id uuid,subject_payload jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=public AS $$
 WITH subject AS (SELECT coalesce(subject_payload,a.payload) p,a.identity_technical t FROM public.organization_applications a WHERE a.id=subject_id),
 candidates AS (
  SELECT a.organization_id id,a.payload p,a.identity_technical t,'application'::text provenance FROM public.organization_applications a WHERE a.id<>subject_id AND a.status IN('pending','needs_information','approved')
  UNION ALL SELECT r.organization_id,r.payload,'[]'::jsonb,'registry' FROM public.organization_public_registry r WHERE r.payload->>'status'='verified' AND NOT EXISTS(SELECT 1 FROM public.organization_applications a WHERE a.organization_id=r.organization_id)
 ),
 matches AS (
  SELECT DISTINCT c.id,c.p->'name' name,s.kind,s.value,v.value matched_value,
   CASE WHEN s.value=v.value THEN 'exact' ELSE 'approximate' END match,
   CASE WHEN s.kind IN('ip','dns_ns','dns_mx','dns_caa','asn') THEN 'low' WHEN s.value=v.value AND s.kind<>'name' THEN 'high' ELSE 'medium' END severity,
   CASE WHEN s.kind IN('ip','dns_ns','dns_mx','dns_caa','asn') THEN 'shared_infrastructure' WHEN s.value<>v.value OR s.kind='name' THEN 'similar_identity' WHEN s.kind='domain' THEN 'domain_overlap' ELSE 'channel_overlap' END reason,
   CASE WHEN s.kind IN('ip','dns_ns','dns_mx','dns_caa','asn') THEN 'technical_snapshot' ELSE c.provenance END provenance
  FROM subject CROSS JOIN LATERAL public.organization_identity_indicators(subject.p,subject.t) s CROSS JOIN candidates c CROSS JOIN LATERAL public.organization_identity_indicators(c.p,c.t) v
  WHERE s.kind=v.kind AND s.value<>'' AND (s.value=v.value OR (s.kind IN('name','domain') AND least(length(s.value),length(v.value))>=5 AND public.identity_edit_distance(s.value,v.value)<=CASE WHEN s.kind='domain' THEN 1 ELSE 2 END))
 )
 SELECT coalesce(jsonb_agg(jsonb_build_object('organizationId',id,'name',name,'indicator',kind,'value',value,'matchedValue',matched_value,'match',match,'severity',severity,'reason',reason,'provenance',provenance) ORDER BY id,kind,value,matched_value),'[]') FROM matches;
$$;
REVOKE ALL ON FUNCTION public.organization_identity_conflicts(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.organization_identity_conflicts(uuid,jsonb) TO service_role;
CREATE FUNCTION public.organization_conflict_fingerprint(subject_id uuid,subject_payload jsonb DEFAULT NULL) RETURNS text LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=public AS $$
 SELECT md5(public.organization_identity_conflicts(subject_id,subject_payload)::text||a.relationship_declaration::text||a.documents::text||a.identity_technical::text||(SELECT coalesce(jsonb_agg(jsonb_build_object('kind',i.kind,'value',i.value) ORDER BY i.kind,i.value),'[]')::text FROM public.organization_identity_indicators(coalesce(subject_payload,a.payload),a.identity_technical) i)) FROM public.organization_applications a WHERE a.id=subject_id;
$$;
REVOKE ALL ON FUNCTION public.organization_conflict_fingerprint(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.organization_conflict_fingerprint(uuid,jsonb) TO service_role;
CREATE FUNCTION public.read_organization_identity_conflicts(application_uuid uuid) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.organization_applications; conflicts jsonb; fingerprint text;
BEGIN
 IF NOT public.has_organization_officer_access() THEN RAISE EXCEPTION 'Officer required'; END IF;
 SELECT * INTO a FROM public.organization_applications WHERE id=application_uuid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Application unavailable'; END IF;
 conflicts:=public.organization_identity_conflicts(a.id); fingerprint:=public.organization_conflict_fingerprint(a.id);
 RETURN jsonb_build_object('conflicts',conflicts,'relationship',a.relationship_declaration,'technical',a.identity_technical,'review',a.conflict_review,'resolved',a.conflict_review->>'fingerprint'=fingerprint,'revision',a.revision);
END $$;
REVOKE ALL ON FUNCTION public.read_organization_identity_conflicts(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.read_organization_identity_conflicts(uuid) TO authenticated,service_role;
CREATE FUNCTION public.resolve_organization_identity_conflicts(application_uuid uuid,expected_revision integer,review_note text,explanation_reviewed boolean,evidence_reviewed boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.organization_applications; conflicts jsonb; review jsonb;
BEGIN
 IF NOT public.has_organization_officer_access() OR explanation_reviewed IS DISTINCT FROM true OR evidence_reviewed IS DISTINCT FROM true OR review_note IS NULL OR length(btrim(review_note)) NOT BETWEEN 20 AND 2000 THEN RAISE EXCEPTION 'Documented officer review required'; END IF;
 PERFORM pg_advisory_xact_lock(834771);
 SELECT * INTO a FROM public.organization_applications WHERE id=application_uuid FOR UPDATE;
 IF NOT FOUND OR a.owner_id=auth.uid() OR a.revision<>expected_revision OR public.officer_is_application_contact(application_uuid) THEN RAISE EXCEPTION 'Independent current review required'; END IF;
 conflicts:=public.organization_identity_conflicts(a.id);
 review:=jsonb_build_object('fingerprint',public.organization_conflict_fingerprint(a.id),'actor',auth.uid(),'at',clock_timestamp(),'note',btrim(review_note),'explanationReviewed',true,'evidenceReviewed',true,'conflicts',conflicts,'relationship',a.relationship_declaration);
 UPDATE public.organization_applications SET conflict_review=review,revision=revision+1,audit=audit||jsonb_build_array(jsonb_build_object('operation','identity_conflict_resolution','actor',auth.uid(),'at',clock_timestamp(),'note',btrim(review_note),'details',review)) WHERE id=application_uuid;
END $$;
REVOKE ALL ON FUNCTION public.resolve_organization_identity_conflicts(uuid,integer,text,boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_organization_identity_conflicts(uuid,integer,text,boolean,boolean) TO authenticated;
CREATE FUNCTION public.save_organization_identity_technical(actor_id uuid,application_uuid uuid,expected_revision integer,snapshots jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF actor_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=actor_id AND role='organization_verification_officer') OR jsonb_typeof(snapshots)<>'array' OR jsonb_array_length(snapshots)>3 OR octet_length(snapshots::text)>60000 THEN RAISE EXCEPTION 'Invalid technical snapshot'; END IF;
 UPDATE public.organization_applications SET identity_technical=snapshots,conflict_review='{}',revision=revision+1,audit=audit||jsonb_build_array(jsonb_build_object('operation','identity_technical_snapshot','actor',actor_id,'at',clock_timestamp(),'note','Fixed-origin metadata recorded; not ownership verification')) WHERE id=application_uuid AND revision=expected_revision AND owner_id<>actor_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Independent current review required'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.save_organization_identity_technical(uuid,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_organization_identity_technical(uuid,uuid,integer,jsonb) TO service_role;
CREATE FUNCTION public.guard_organization_identity_approval() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE declaration jsonb; conflicts jsonb; last_event jsonb; reviewer uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(834771);
 IF NEW.payload ? 'relationshipDeclaration' THEN
  declaration:=NEW.payload->'relationshipDeclaration';
  IF jsonb_typeof(declaration)<>'object' OR coalesce(declaration->>'kind','') NOT IN('none','parent','subsidiary','sister','common_ownership','shared_channels','shared_provider','other') OR octet_length(declaration::text)>18000 THEN RAISE EXCEPTION 'Invalid relationship declaration'; END IF;
  NEW.relationship_declaration:=declaration; NEW.payload:=NEW.payload-'relationshipDeclaration'; NEW.conflict_review:='{}';
 END IF;
 IF TG_OP='UPDATE' THEN
  last_event:=NEW.audit->(jsonb_array_length(NEW.audit)-1);
  IF NEW.status='approved' AND (OLD.status<>'approved' OR (NEW.revision<>OLD.revision AND last_event->>'operation' IN('demo_review','review','officer_channel'))) THEN
   conflicts:=public.organization_identity_conflicts(NEW.id,NEW.payload);
   IF EXISTS(SELECT 1 FROM jsonb_array_elements(conflicts) c WHERE c->>'severity'='high') THEN
    IF NEW.relationship_declaration IS DISTINCT FROM OLD.relationship_declaration OR NEW.identity_technical IS DISTINCT FROM OLD.identity_technical OR NEW.documents IS DISTINCT FROM OLD.documents OR NEW.conflict_review->>'fingerprint' IS DISTINCT FROM public.organization_conflict_fingerprint(NEW.id,NEW.payload) OR length(coalesce(NEW.conflict_review->>'note',''))<20 THEN RAISE EXCEPTION 'Unresolved high-risk identity conflicts require documented review'; END IF;
    reviewer:=(last_event->>'actor')::uuid;
    IF NEW.conflict_review->>'actor' IS DISTINCT FROM reviewer::text THEN RAISE EXCEPTION 'Approving officer must review conflicts'; END IF;
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_organization_identity_approval() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_organization_identity_approval BEFORE INSERT OR UPDATE ON public.organization_applications FOR EACH ROW EXECUTE FUNCTION public.guard_organization_identity_approval();
DO $$
DECLARE signature text; definition text;
BEGIN
 FOREACH signature IN ARRAY ARRAY['public.review_demo_organization(uuid,uuid,integer,text,text)','public.commit_organization_application(uuid,uuid,text,integer,jsonb,jsonb,text,text,jsonb)'] LOOP
  definition:=pg_get_functiondef(signature::regprocedure);
  IF position('pg_advisory_xact_lock(834771)' IN definition)=0 THEN
   definition:=replace(definition,E'BEGIN\n',E'BEGIN\n PERFORM pg_advisory_xact_lock(834771);\n');
   EXECUTE definition;
  END IF;
 END LOOP;
END $$;