-- Run against a privileged test connection; every change rolls back.
BEGIN;
DO $$
DECLARE
  target uuid := gen_random_uuid();
  analyst uuid;
  session_uuid uuid;
  operation text;
  report jsonb := '{"channel":"email","sender":"boundary-test.example","body":"fictional security boundary test"}';
  marker text := 'private-boundary-marker.example';
  count_before bigint;
BEGIN
  -- Real active authorization is used only inside this rollback transaction.
  SELECT r.user_id,s.id INTO analyst,session_uuid FROM public.user_roles r
    JOIN auth.sessions s ON s.user_id=r.user_id
    JOIN public.security_workspaces w ON w.user_id=r.user_id
    WHERE r.role IN ('security_analyst','security_supervisor') LIMIT 1;
  IF analyst IS NULL THEN RAISE EXCEPTION 'Active analyst workspace required for positive contract test'; END IF;

  FOREACH operation IN ARRAY ARRAY['flagged_message_values','flagged_ai_indicator_values','submit_security_report','submit_ai_security_report'] LOOP
    PERFORM set_config('request.jwt.claims','{}',true);
    BEGIN
      CASE operation
        WHEN 'flagged_message_values' THEN PERFORM public.flagged_message_values(ARRAY[marker],target);
        WHEN 'flagged_ai_indicator_values' THEN PERFORM public.flagged_ai_indicator_values(jsonb_build_array(jsonb_build_object('type','domain','value',marker)),target);
        WHEN 'submit_security_report' THEN PERFORM public.submit_security_report(report,target);
        ELSE PERFORM public.submit_ai_security_report(report,target);
      END CASE;
      RAISE EXCEPTION 'Anonymous workspace operation unexpectedly allowed: %',operation;
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;

    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',analyst,'session_id',session_uuid,'role','authenticated')::text,true);
    BEGIN
      CASE operation
        WHEN 'flagged_message_values' THEN PERFORM public.flagged_message_values(ARRAY[marker],target);
        WHEN 'flagged_ai_indicator_values' THEN PERFORM public.flagged_ai_indicator_values(jsonb_build_array(jsonb_build_object('type','domain','value',marker)),target);
        WHEN 'submit_security_report' THEN PERFORM public.submit_security_report(report,target);
        ELSE PERFORM public.submit_ai_security_report(report,target);
      END CASE;
      RAISE EXCEPTION 'Cross-owner workspace operation unexpectedly allowed: %',operation;
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  END LOOP;

  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',analyst,'session_id',gen_random_uuid(),'role','authenticated')::text,true);
  BEGIN
    PERFORM public.flagged_message_values(ARRAY[marker],analyst);
    RAISE EXCEPTION 'Inactive session unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',analyst,'session_id',session_uuid,'role','authenticated')::text,true);
  UPDATE public.security_workspaces SET payload=jsonb_set(payload,'{alerts}',coalesce(payload->'alerts','[]'::jsonb)||jsonb_build_array(jsonb_build_object('status','confirmed','indicators',jsonb_build_array(jsonb_build_object('type','domain','value',marker))))) WHERE user_id=analyst;
  IF public.flagged_message_values(ARRAY[marker],analyst) IS DISTINCT FROM ARRAY[marker] THEN RAISE EXCEPTION 'Owner indicator read failed'; END IF;
  IF public.flagged_ai_indicator_values(jsonb_build_array(jsonb_build_object('type','domain','value',marker)),analyst) IS DISTINCT FROM ARRAY[marker] THEN RAISE EXCEPTION 'Owner typed indicator read failed'; END IF;
  SELECT count(*) INTO count_before FROM public.security_reports WHERE recipient=analyst;
  PERFORM public.submit_security_report(report,analyst);
  PERFORM public.submit_ai_security_report(report,analyst);
  IF (SELECT count(*) FROM public.security_reports WHERE recipient=analyst)<>count_before+2 THEN RAISE EXCEPTION 'Owner report routing failed'; END IF;

  PERFORM set_config('request.jwt.claims','{}',true);
  IF public.flagged_message_values(ARRAY[marker]) IS DISTINCT FROM '{}'::text[] THEN RAISE EXCEPTION 'Public check leaked private indicator'; END IF;
  IF public.flagged_ai_indicator_values(jsonb_build_array(jsonb_build_object('type','domain','value',marker))) IS DISTINCT FROM '{}'::text[] THEN RAISE EXCEPTION 'Public typed check leaked private indicator'; END IF;
  SELECT count(*) INTO count_before FROM public.security_reports WHERE recipient IS NULL;
  PERFORM public.submit_security_report(report);
  PERFORM public.submit_ai_security_report(report);
  IF (SELECT count(*) FROM public.security_reports WHERE recipient IS NULL)<>count_before+2 THEN RAISE EXCEPTION 'Shared write-only reports broken'; END IF;
END $$;
ROLLBACK;