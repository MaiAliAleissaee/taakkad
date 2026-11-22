CREATE OR REPLACE FUNCTION public.commit_organization_application(actor_id uuid, application_id uuid, operation text, expected_revision integer, next_payload jsonb, next_documents jsonb, next_status text, decision_note text, event_details jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_row public.organization_applications; officer boolean; now_at timestamptz := clock_timestamp(); saved_id uuid; org_id text; projection jsonb;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=actor_id AND role='organization_verification_officer') INTO officer;
 IF actor_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 IF operation='create' THEN
  IF next_status <> 'pending' OR next_payload->>'status' <> 'pending' THEN RAISE EXCEPTION 'Invalid registration'; END IF;
  saved_id:=gen_random_uuid(); org_id:='org-'||saved_id::text;
  next_payload:=jsonb_set(jsonb_set(next_payload,'{id}',to_jsonb(org_id)),'{registeredAt}',to_jsonb(now_at));
  INSERT INTO public.organization_applications(id,owner_id,organization_id,payload,documents,submitted_at,audit) VALUES(saved_id,actor_id,org_id,next_payload,next_documents,now_at,jsonb_build_array(jsonb_build_object('at',now_at,'actor',actor_id,'operation','create','payload',next_payload,'documents',next_documents)));
  RETURN saved_id;
 END IF;
 SELECT * INTO current_row FROM public.organization_applications WHERE id=application_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Application unavailable'; END IF;
 IF current_row.revision <> expected_revision THEN RAISE EXCEPTION 'Application changed; reload before saving'; END IF;
 IF operation IN ('review','officer_channel') THEN
  IF NOT officer OR current_row.owner_id=actor_id THEN RAISE EXCEPTION 'Independent officer required'; END IF;
 ELSIF operation IN ('edit','owner_channel') THEN
  IF current_row.owner_id <> actor_id THEN RAISE EXCEPTION 'Not application owner'; END IF;
  IF NOT(now_at < current_row.submitted_at + interval '24 hours' OR current_row.status='needs_information') THEN RAISE EXCEPTION 'Editing deadline passed'; END IF;
  IF next_status <> 'pending' OR next_payload->>'status' <> 'pending' THEN RAISE EXCEPTION 'Edits require independent review'; END IF;
 ELSE RAISE EXCEPTION 'Invalid operation'; END IF;
 IF next_payload->>'id' IS DISTINCT FROM current_row.organization_id THEN RAISE EXCEPTION 'Cannot change organization identity'; END IF;
 next_payload:=jsonb_set(next_payload,'{registeredAt}',to_jsonb(current_row.submitted_at));
 UPDATE public.organization_applications SET payload=next_payload,documents=next_documents,status=next_status,correction_note=CASE WHEN next_status='needs_information' THEN decision_note ELSE '' END,revision=revision+1,audit=audit||jsonb_build_array(jsonb_build_object('at',now_at,'actor',actor_id,'operation',operation,'note',decision_note,'before',payload,'after',next_payload,'previousDocuments',documents,'documents',next_documents,'details',event_details)) WHERE id=application_id;
 org_id:=current_row.organization_id;
 IF next_status='approved' THEN
  projection:=jsonb_build_object('id',org_id,'name',next_payload->'name','type',next_payload->'type','domains',next_payload->'domains','status','verified','registeredAt',current_row.submitted_at,'verifiedAt',now_at,'keyFingerprint',next_payload->'keyFingerprint','contactEmail','','channels',(SELECT coalesce(jsonb_agg(c-'submittedAt'-'reviewedAt'),'[]'::jsonb) FROM jsonb_array_elements(next_payload->'channels') c WHERE c->>'status'='verified'));
  INSERT INTO public.organization_public_registry(organization_id,payload) VALUES(org_id,projection) ON CONFLICT(organization_id) DO UPDATE SET payload=excluded.payload;
 ELSE
  SELECT payload INTO projection FROM public.organization_public_registry WHERE organization_id=org_id;
  IF projection IS NULL AND current_row.owner_id='00000000-0000-4000-8000-000000000001'::uuid THEN
   projection:=jsonb_build_object('id',org_id,'name',current_row.payload->'name','type',current_row.payload->'type','domains',current_row.payload->'domains','registeredAt',current_row.submitted_at,'keyFingerprint',current_row.payload->'keyFingerprint','contactEmail','');
  END IF;
  IF projection IS NOT NULL THEN
   projection:=jsonb_set(jsonb_set(projection,'{status}','"suspended"'::jsonb),'{channels}','[]'::jsonb);
   INSERT INTO public.organization_public_registry(organization_id,payload) VALUES(org_id,projection) ON CONFLICT(organization_id) DO UPDATE SET payload=excluded.payload;
  END IF;
 END IF;
 RETURN application_id;
END $$;
REVOKE ALL ON FUNCTION public.commit_organization_application(uuid,uuid,text,integer,jsonb,jsonb,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_organization_application(uuid,uuid,text,integer,jsonb,jsonb,text,text,jsonb) TO service_role;