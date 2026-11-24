ALTER TABLE public.organization_demo_tracking ADD COLUMN secret_hash text CHECK(secret_hash IS NULL OR secret_hash ~ '^[a-f0-9]{64}$');
ALTER TABLE public.organization_demo_tracking ADD COLUMN recovery_audit jsonb NOT NULL DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.organization_demo_tracking.secret_hash IS 'SHA-256 of a server-issued 256-bit receipt secret; null legacy records require independently verified officer recovery, never code-only access.';
CREATE FUNCTION public.submit_secure_demo_organization(application_payload jsonb, receipt_hash text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tracking_code text;
BEGIN
 IF receipt_hash IS NULL OR receipt_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid receipt'; END IF;
 tracking_code := public.submit_demo_organization(application_payload);
 UPDATE public.organization_demo_tracking SET secret_hash=receipt_hash WHERE code=tracking_code AND secret_hash IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Receipt assignment failed'; END IF;
 RETURN tracking_code;
END $$;
REVOKE ALL ON FUNCTION public.submit_secure_demo_organization(jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_secure_demo_organization(jsonb,text) TO service_role;
CREATE FUNCTION public.read_secure_demo_tracking(tracking_code text, receipt_hash text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF tracking_code IS NULL OR tracking_code !~ '^[1-9][0-9]{4}$' OR receipt_hash IS NULL OR receipt_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organization_demo_tracking t WHERE t.code=tracking_code AND t.secret_hash=receipt_hash) THEN RETURN NULL; END IF;
 RETURN public.read_demo_organization_tracking(tracking_code);
END $$;
REVOKE ALL ON FUNCTION public.read_secure_demo_tracking(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.read_secure_demo_tracking(text,text) TO service_role;
REVOKE ALL ON FUNCTION public.read_demo_organization_tracking(text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.submit_demo_organization(jsonb) FROM PUBLIC,anon,authenticated,service_role;
COMMENT ON FUNCTION public.read_demo_organization_tracking(text) IS 'DEPRECATED external number-only access; internal status projection invoked only after receipt validation.';
CREATE FUNCTION public.recover_demo_tracking_receipt(actor_id uuid,application_uuid uuid,receipt_hash text,review_note text,identity_confirmed boolean) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tracking_code text;
BEGIN
 IF actor_id IS NULL OR identity_confirmed IS DISTINCT FROM true OR receipt_hash IS NULL OR receipt_hash !~ '^[a-f0-9]{64}$' OR review_note IS NULL OR length(trim(review_note)) NOT BETWEEN 10 AND 1000 THEN RAISE EXCEPTION 'Recovery denied'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=actor_id AND role='organization_verification_officer') THEN RAISE EXCEPTION 'Recovery denied'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organization_applications WHERE id=application_uuid AND demo_registration) THEN RAISE EXCEPTION 'Recovery denied'; END IF;
 UPDATE public.organization_demo_tracking SET secret_hash=receipt_hash,recovery_audit=recovery_audit||jsonb_build_array(jsonb_build_object('at',clock_timestamp(),'actor',actor_id,'operation','receipt_recovery','note',trim(review_note),'identityConfirmed',true)) WHERE application_id=application_uuid RETURNING code INTO tracking_code;
 IF NOT FOUND THEN RAISE EXCEPTION 'Recovery denied'; END IF;
 RETURN tracking_code;
END $$;
REVOKE ALL ON FUNCTION public.recover_demo_tracking_receipt(uuid,uuid,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recover_demo_tracking_receipt(uuid,uuid,text,text,boolean) TO service_role;
CREATE FUNCTION public.reserve_public_security_action(action_kind text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF action_kind NOT IN ('check','report') THEN RAISE EXCEPTION 'Invalid public action'; END IF;
 IF NOT public.organization_rate_limit('public-security-'||action_kind,CASE WHEN action_kind='check' THEN 6000 ELSE 500 END,3600) THEN RAISE EXCEPTION 'Public request limit reached'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.reserve_public_security_action(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_public_security_action(text) TO service_role;
ALTER FUNCTION public.flagged_message_values(text[],uuid) VOLATILE;
ALTER FUNCTION public.flagged_ai_indicator_values(jsonb,uuid) VOLATILE;
DO $$
DECLARE signature text; definition text; action_kind text;
BEGIN
 FOREACH signature IN ARRAY ARRAY['public.flagged_message_values(text[],uuid)','public.flagged_ai_indicator_values(jsonb,uuid)','public.submit_security_report(jsonb,uuid)','public.submit_ai_security_report(jsonb,uuid)'] LOOP
  definition := pg_get_functiondef(signature::regprocedure);
  action_kind := CASE WHEN signature LIKE 'public.flagged_%' THEN 'check' ELSE 'report' END;
  IF position('public.reserve_public_security_action' IN definition)=0 THEN
   definition:=replace(definition,'PERFORM public.authorize_public_security_workspace(workspace_user);','PERFORM public.authorize_public_security_workspace(workspace_user);'||E'\nIF workspace_user IS NULL THEN PERFORM public.reserve_public_security_action('||quote_literal(action_kind)||'); END IF;');
   EXECUTE definition;
  END IF;
 END LOOP;
END $$;