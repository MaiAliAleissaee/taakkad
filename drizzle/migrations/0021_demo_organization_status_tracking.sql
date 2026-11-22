ALTER TABLE public.organization_applications ADD COLUMN demo_registration boolean NOT NULL DEFAULT false;
ALTER TABLE public.organization_applications ADD COLUMN demo_under_review boolean NOT NULL DEFAULT false;
CREATE TABLE public.organization_demo_tracking(code text PRIMARY KEY CHECK(code ~ '^[1-9][0-9]{4}$'), application_id uuid UNIQUE REFERENCES public.organization_applications(id) ON DELETE SET NULL);
GRANT ALL ON public.organization_demo_tracking TO service_role;
REVOKE ALL ON public.organization_demo_tracking FROM anon,authenticated;
ALTER TABLE public.organization_demo_tracking ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.organization_demo_registry(application_id uuid PRIMARY KEY REFERENCES public.organization_applications(id) ON DELETE CASCADE, name jsonb NOT NULL, channels jsonb NOT NULL, simulated boolean NOT NULL DEFAULT true CHECK(simulated), approved boolean NOT NULL DEFAULT false);
GRANT SELECT ON public.organization_demo_registry TO anon,authenticated;
GRANT ALL ON public.organization_demo_registry TO service_role;
REVOKE INSERT,UPDATE,DELETE ON public.organization_demo_registry FROM anon,authenticated;
ALTER TABLE public.organization_demo_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY approved_simulated_registry ON public.organization_demo_registry FOR SELECT TO anon,authenticated USING(approved AND simulated);
CREATE FUNCTION public.allocate_demo_tracking(application_uuid uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE candidate text;
BEGIN
 PERFORM pg_advisory_xact_lock(7348621);
 SELECT code INTO candidate FROM public.organization_demo_tracking WHERE application_id=application_uuid;
 IF candidate IS NOT NULL THEN RETURN candidate; END IF;
 IF (SELECT count(*) FROM public.organization_demo_tracking)>=90000 THEN RAISE EXCEPTION 'Demo tracking capacity reached'; END IF;
 LOOP
  candidate:=(10000+floor(random()*90000)::integer)::text;
  INSERT INTO public.organization_demo_tracking(code,application_id) VALUES(candidate,application_uuid) ON CONFLICT DO NOTHING;
  IF FOUND THEN RETURN candidate; END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.allocate_demo_tracking(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_demo_tracking(uuid) TO service_role;
SELECT public.allocate_demo_tracking(id) FROM public.organization_applications;
CREATE FUNCTION public.assign_demo_tracking() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN PERFORM public.allocate_demo_tracking(NEW.id); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.assign_demo_tracking() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER assign_demo_tracking AFTER INSERT ON public.organization_applications FOR EACH ROW EXECUTE FUNCTION public.assign_demo_tracking();
CREATE FUNCTION public.guard_demo_trust() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.demo_registration AND (NEW.payload->>'status' IS DISTINCT FROM 'pending' OR EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.payload->'channels') c WHERE c->>'status' IS DISTINCT FROM 'pending')) THEN RAISE EXCEPTION 'Simulated channels cannot become verified'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_demo_trust BEFORE INSERT OR UPDATE ON public.organization_applications FOR EACH ROW EXECUTE FUNCTION public.guard_demo_trust();
CREATE FUNCTION public.guard_demo_public_projection() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.organization_applications WHERE organization_id=NEW.organization_id AND demo_registration) THEN RAISE EXCEPTION 'Demo organizations belong only in simulated registry'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_demo_public_projection() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_demo_public_projection BEFORE INSERT OR UPDATE ON public.organization_public_registry FOR EACH ROW EXECUTE FUNCTION public.guard_demo_public_projection();
CREATE FUNCTION public.submit_demo_organization(application_payload jsonb) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE saved_id uuid:=gen_random_uuid(); org_id text; at_time timestamptz:=clock_timestamp();
BEGIN
 IF application_payload->>'status' IS DISTINCT FROM 'pending' OR jsonb_array_length(application_payload->'channels')<>5 THEN RAISE EXCEPTION 'Invalid demo submission'; END IF;
 org_id:='demo-org-'||saved_id::text;
 application_payload:=jsonb_set(jsonb_set(application_payload,'{id}',to_jsonb(org_id)),'{registeredAt}',to_jsonb(at_time));
 INSERT INTO public.organization_applications(id,owner_id,organization_id,payload,demo_registration,audit) VALUES(saved_id,gen_random_uuid(),org_id,application_payload,true,jsonb_build_array(jsonb_build_object('at',at_time,'operation','demo_create','note','Simulated / تجريبي')));
 RETURN (SELECT code FROM public.organization_demo_tracking WHERE application_id=saved_id);
END $$;
REVOKE ALL ON FUNCTION public.submit_demo_organization(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_demo_organization(jsonb) TO service_role;
CREATE FUNCTION public.read_demo_organization_status(tracking_code text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT CASE WHEN a.status='pending' AND a.demo_under_review THEN 'under_review' WHEN a.status IN('pending','approved','rejected','needs_information') THEN a.status ELSE 'rejected' END FROM public.organization_demo_tracking t JOIN public.organization_applications a ON a.id=t.application_id WHERE t.code=tracking_code;
$$;
REVOKE ALL ON FUNCTION public.read_demo_organization_status(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.read_demo_organization_status(text) TO service_role;
CREATE FUNCTION public.review_demo_organization(actor_id uuid, application_uuid uuid, expected_revision integer, decision text, decision_note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.organization_applications; at_time timestamptz:=clock_timestamp();
BEGIN
 IF actor_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=actor_id AND role='organization_verification_officer') THEN RAISE EXCEPTION 'Officer required'; END IF;
 SELECT * INTO a FROM public.organization_applications WHERE id=application_uuid FOR UPDATE;
 IF NOT FOUND OR NOT a.demo_registration OR a.owner_id=actor_id THEN RAISE EXCEPTION 'Independent demo review required'; END IF;
 IF a.revision<>expected_revision OR a.status NOT IN('pending','needs_information') THEN RAISE EXCEPTION 'Application changed or decision final'; END IF;
 IF decision NOT IN('under_review','approved','rejected','needs_information') OR (decision<>'under_review' AND (length(btrim(decision_note)) NOT BETWEEN 1 AND 1000)) THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 UPDATE public.organization_applications SET status=CASE WHEN decision='under_review' THEN 'pending' ELSE decision END,demo_under_review=decision='under_review',revision=revision+1,correction_note=CASE WHEN decision='needs_information' THEN decision_note ELSE '' END,audit=audit||jsonb_build_array(jsonb_build_object('at',at_time,'actor',actor_id,'operation','demo_review','decision',decision,'note',decision_note,'simulated',true)) WHERE id=application_uuid;
 IF decision='approved' THEN
  INSERT INTO public.organization_demo_registry(application_id,name,channels,approved) VALUES(application_uuid,a.payload->'name',(SELECT jsonb_agg(jsonb_build_object('type',c->>'type','value',c->>'value','status','simulated')) FROM jsonb_array_elements(a.payload->'channels') c),true) ON CONFLICT(application_id) DO UPDATE SET name=excluded.name,channels=excluded.channels,approved=true;
 ELSE UPDATE public.organization_demo_registry SET approved=false WHERE application_id=application_uuid; END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_demo_organization(uuid,uuid,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_demo_organization(uuid,uuid,integer,text,text) TO service_role;