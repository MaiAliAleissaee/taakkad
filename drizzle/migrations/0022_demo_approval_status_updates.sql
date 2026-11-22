ALTER TABLE public.organization_applications ADD COLUMN status_updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.organization_applications a SET status_updated_at=COALESCE((SELECT (event->>'at')::timestamptz FROM jsonb_array_elements(a.audit) WITH ORDINALITY AS e(event,position) WHERE event->>'operation' IN ('demo_review','review') AND event->>'at' ~ '^\d{4}-\d{2}-\d{2}T' ORDER BY position DESC LIMIT 1),a.submitted_at);
CREATE FUNCTION public.stamp_application_status_update() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF TG_OP='INSERT' THEN NEW.status_updated_at:=NEW.submitted_at; ELSIF NEW.status IS DISTINCT FROM OLD.status OR NEW.demo_under_review IS DISTINCT FROM OLD.demo_under_review THEN NEW.status_updated_at:=clock_timestamp(); END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.stamp_application_status_update() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER stamp_application_status_update BEFORE INSERT OR UPDATE ON public.organization_applications FOR EACH ROW EXECUTE FUNCTION public.stamp_application_status_update();
CREATE FUNCTION public.read_demo_organization_tracking(tracking_code text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT jsonb_build_object('status',CASE WHEN a.status='pending' AND a.demo_under_review THEN 'under_review' WHEN a.status IN('pending','approved','rejected','needs_information') THEN a.status ELSE 'rejected' END,'updatedAt',a.status_updated_at) FROM public.organization_demo_tracking t JOIN public.organization_applications a ON a.id=t.application_id WHERE t.code=tracking_code; $$;
REVOKE ALL ON FUNCTION public.read_demo_organization_tracking(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.read_demo_organization_tracking(text) TO service_role;
CREATE OR REPLACE FUNCTION public.review_demo_organization(actor_id uuid, application_uuid uuid, expected_revision integer, decision text, decision_note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.organization_applications; at_time timestamptz:=clock_timestamp();
BEGIN
 IF actor_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=actor_id AND role='organization_verification_officer') THEN RAISE EXCEPTION 'Officer required'; END IF;
 SELECT * INTO a FROM public.organization_applications WHERE id=application_uuid FOR UPDATE;
 IF NOT FOUND OR NOT a.demo_registration OR a.owner_id=actor_id THEN RAISE EXCEPTION 'Independent demo review required'; END IF;
 IF a.revision<>expected_revision OR NOT(a.status IN('pending','needs_information') OR (a.status='approved' AND decision='approved')) THEN RAISE EXCEPTION 'Application changed or decision final'; END IF;
 IF decision NOT IN('under_review','approved','rejected','needs_information') OR (decision<>'under_review' AND (length(btrim(decision_note)) NOT BETWEEN 1 AND 1000)) THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 UPDATE public.organization_applications SET status=CASE WHEN decision='under_review' THEN 'pending' ELSE decision END,demo_under_review=decision='under_review',status_updated_at=at_time,revision=revision+1,correction_note=CASE WHEN decision='needs_information' THEN decision_note ELSE '' END,audit=audit||jsonb_build_array(jsonb_build_object('at',at_time,'actor',actor_id,'operation','demo_review','decision',decision,'note',decision_note,'simulated',true)) WHERE id=application_uuid;
 IF decision='approved' THEN
  INSERT INTO public.organization_demo_registry(application_id,name,channels,approved) VALUES(application_uuid,a.payload->'name',(SELECT jsonb_agg(jsonb_build_object('type',c->>'type','value',c->>'value','status','simulated')) FROM jsonb_array_elements(a.payload->'channels') c),true) ON CONFLICT(application_id) DO UPDATE SET name=excluded.name,channels=excluded.channels,approved=true;
 ELSE UPDATE public.organization_demo_registry SET approved=false WHERE application_id=application_uuid; END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_demo_organization(uuid,uuid,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_demo_organization(uuid,uuid,integer,text,text) TO service_role;