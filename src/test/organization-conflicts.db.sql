-- Privileged, rollback-only contract checks. Never grants roles or creates auth sessions.
-- Uses an existing officer only inside the rollback; never simulates an active Auth session.
BEGIN;
DO $$
DECLARE subject_id uuid; other_id uuid; conflicts jsonb; actor uuid; payload jsonb; high_count integer; tracking_code text;
BEGIN
 SELECT user_id INTO actor FROM public.user_roles WHERE role='organization_verification_officer' ORDER BY user_id LIMIT 1;
 IF public.normalize_identity_indicator('phone','٠٥٠٢١١١١١١') <> '+971502111111' THEN RAISE EXCEPTION 'UAE phone normalization failed'; END IF;
 IF public.normalize_identity_indicator('website','https://WWW.NAKLAH.EXAMPLE./path') <> 'naklah.example' THEN RAISE EXCEPTION 'Website normalization failed'; END IF;
 IF public.normalize_identity_indicator('email',' NAKLAH@HOTMAIL.EXAMPLE ') <> 'naklah@hotmail.example' THEN RAISE EXCEPTION 'Email normalization failed'; END IF;
 IF public.normalize_identity_indicator('social','https://social.example/NaKlah_') <> 'naklah_' THEN RAISE EXCEPTION 'Social normalization failed'; END IF;
 IF public.normalize_identity_indicator('sms','NAKLAH SMS') <> 'naklahsms' THEN RAISE EXCEPTION 'SMS normalization failed'; END IF;
 IF public.identity_edit_distance('uaepass.example','uaepasss.example') <> 1 THEN RAISE EXCEPTION 'Approximate comparison failed'; END IF;
 IF has_function_privilege('anon','public.read_organization_identity_conflicts(uuid)','EXECUTE') OR has_function_privilege('anon','public.resolve_organization_identity_conflicts(uuid,integer,text,boolean,boolean)','EXECUTE') THEN RAISE EXCEPTION 'Anonymous conflict permission regression'; END IF;
 IF has_function_privilege('authenticated','public.save_organization_identity_technical(uuid,uuid,integer,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Fabricated technical evidence access'; END IF;
 payload:=jsonb_build_object('id','test','name',jsonb_build_object('en','Rollback conflict test','ar','اختبار تعارض مؤقت'),'type','business','domains',jsonb_build_array('rollback-conflict.example'),'contactEmail','naklah@hotmail.example','status','pending','channels',jsonb_build_array(jsonb_build_object('type','email','value','NAKLAH@HOTMAIL.EXAMPLE','status','pending'),jsonb_build_object('type','phone','value','+971 50 211 1111','status','pending'),jsonb_build_object('type','sms','value','NAKLAH SMS','status','pending')),'relationshipDeclaration',jsonb_build_object('kind','parent','organization','شركة نخلة','explanation','Fictional rollback relationship assertion','evidence','No independently verified evidence'));
 payload:=jsonb_set(payload,'{channels}',payload->'channels'||jsonb_build_array(jsonb_build_object('type','website','value','https://rollback-conflict.example','status','pending'),jsonb_build_object('type','social','value','@ROLLBACK-UNIQUE','status','pending')));
 tracking_code:=public.submit_secure_demo_organization(payload,repeat('a',64));
 SELECT application_id INTO subject_id FROM public.organization_demo_tracking WHERE code=tracking_code;
 IF subject_id IS NULL THEN RAISE EXCEPTION 'Fixture receipt missing'; END IF;
 IF (SELECT a.payload ? 'relationshipDeclaration' FROM public.organization_applications a WHERE a.id=subject_id) OR (SELECT a.relationship_declaration->>'kind' FROM public.organization_applications a WHERE a.id=subject_id)<>'parent' THEN RAISE EXCEPTION 'Private declaration separation failed'; END IF;
 conflicts:=public.organization_identity_conflicts(subject_id);
 SELECT count(*) INTO high_count FROM jsonb_array_elements(conflicts) c WHERE c->>'severity'='high' AND c->>'indicator' IN('email','phone','sms');
 IF high_count<3 THEN RAISE EXCEPTION 'Exact communication conflict detection failed: %',conflicts; END IF;
 BEGIN
  PERFORM public.review_demo_organization(actor,subject_id,0,'approved','Attempt without documented conflict resolution');
  RAISE EXCEPTION 'High-risk approval bypass succeeded';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM NOT LIKE 'Unresolved high-risk identity conflicts%' THEN RAISE; END IF;
 END;
 IF EXISTS(SELECT 1 FROM public.organization_demo_registry WHERE application_id=subject_id AND approved) THEN RAISE EXCEPTION 'Blocked application leaked to registry'; END IF;
 BEGIN
  PERFORM public.resolve_organization_identity_conflicts(subject_id,0,'Unauthorized fabricated conflict resolution',true,true);
  RAISE EXCEPTION 'Resolution without live officer session succeeded';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'Documented officer review required' THEN RAISE; END IF;
 END;
 -- Service-side review fixture exercises only the atomic guard/projection contract,
 -- not the authenticated human resolution command (which needs a genuine session).
 UPDATE public.organization_applications SET conflict_review=jsonb_build_object('fingerprint',public.organization_conflict_fingerprint(subject_id),'actor',actor,'note','Fixture-only documented corporate authorization; not real ownership verification') WHERE id=subject_id;
 PERFORM public.review_demo_organization(actor,subject_id,0,'approved','Fixture-only approval after stored documented review');
 IF (SELECT count(*) FROM public.organization_demo_registry WHERE application_id=subject_id AND approved AND simulated)<>1 THEN RAISE EXCEPTION 'Approval public projection failed'; END IF;
 PERFORM public.review_demo_organization(actor,subject_id,1,'approved','Idempotent prototype reapproval with current documented review');
 IF (SELECT count(*) FROM public.organization_demo_registry WHERE application_id=subject_id)<>1 THEN RAISE EXCEPTION 'Duplicate approved registry projection'; END IF;
 -- Technical matches are only low-risk, even when an IP or DNS value is identical.
 UPDATE public.organization_applications SET identity_technical='[{"domain":"rollback-conflict.example","observation":{"addresses":["192.0.2.123"],"records":[{"type":2,"data":"ns.shared.example"}],"asns":[64500]}}]' WHERE id=subject_id;
 BEGIN
  PERFORM public.review_demo_organization(actor,subject_id,2,'approved','Attempt with stale technical evidence review');
  RAISE EXCEPTION 'Stale conflict review approval succeeded';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM NOT LIKE 'Unresolved high-risk identity conflicts%' THEN RAISE; END IF;
 END;
 payload:=jsonb_build_object('id','other','name',jsonb_build_object('en','Unrelated infrastructure operator','ar','جهة مختلفة'),'type','business','domains',jsonb_build_array('completely-unrelated.example'),'contactEmail','unrelated@completely-unrelated.example','status','pending','channels',jsonb_build_array(jsonb_build_object('type','sms','value','OTHER-SENDER','status','pending')));
 payload:=jsonb_set(payload,'{channels}',payload->'channels'||jsonb_build_array(jsonb_build_object('type','website','value','https://completely-unrelated.example','status','pending'),jsonb_build_object('type','social','value','@INFRA-UNIQUE','status','pending'),jsonb_build_object('type','email','value','unrelated@completely-unrelated.example','status','pending'),jsonb_build_object('type','phone','value','0600000000','status','pending')));
 tracking_code:=public.submit_secure_demo_organization(payload,repeat('b',64));
 SELECT application_id INTO other_id FROM public.organization_demo_tracking WHERE code=tracking_code;
 UPDATE public.organization_applications SET identity_technical='[{"domain":"completely-unrelated.example","observation":{"addresses":["192.0.2.123"],"records":[{"type":2,"data":"ns.shared.example"}],"asns":[64500]}}]' WHERE id=other_id;
 conflicts:=public.organization_identity_conflicts(subject_id);
 IF (SELECT count(*) FROM jsonb_array_elements(conflicts) c WHERE c->>'reason'='shared_infrastructure' AND c->>'severity'='low')<3 OR EXISTS(SELECT 1 FROM jsonb_array_elements(conflicts) c WHERE c->>'reason'='shared_infrastructure' AND c->>'severity'='high') THEN RAISE EXCEPTION 'Shared infrastructure severity regression'; END IF;
END $$;
ROLLBACK;