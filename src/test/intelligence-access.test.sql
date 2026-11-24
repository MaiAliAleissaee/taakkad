-- Transactional database authorization/limiter checks; no account, role, or intelligence data persists.
BEGIN;
DO $$
DECLARE analyst uuid; officer uuid; active_session text; rejected boolean := false;
BEGIN
 SELECT user_id INTO analyst FROM public.staff_login_identifiers WHERE staff_id='HAM1234';
 SELECT user_id INTO officer FROM public.staff_login_identifiers WHERE staff_id='HAM123';
 SELECT id::text INTO active_session FROM auth.sessions WHERE user_id=analyst ORDER BY created_at DESC LIMIT 1;
 IF analyst IS NULL OR officer IS NULL OR active_session IS NULL THEN RAISE EXCEPTION 'Existing accounts and active analyst session required for database fixture'; END IF;
 IF has_table_privilege('anon','public.analyst_intelligence_workspaces','SELECT') OR has_table_privilege('authenticated','public.analyst_intelligence_workspaces','UPDATE') OR has_function_privilege('authenticated','public.commit_analyst_intelligence(uuid,jsonb,integer)','EXECUTE') OR has_function_privilege('authenticated','public.save_analyst_intelligence(jsonb,integer)','EXECUTE') THEN RAISE EXCEPTION 'Evidence mutation must be server-only'; END IF;
 -- Local transaction-only counter setup; keep production counters unchanged after rollback.
 INSERT INTO public.organization_request_limits(bucket,started_at,count) VALUES('analyst-intelligence:'||analyst::text,now(),29) ON CONFLICT(bucket) DO UPDATE SET started_at=now(),count=29;
 PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', analyst, 'session_id', active_session)::text, true);
 SET LOCAL ROLE authenticated;
 IF public.has_security_access() IS DISTINCT FROM true THEN RAISE EXCEPTION 'Valid database session fixture must pass existing check'; END IF;
 PERFORM public.read_analyst_intelligence();
 IF public.reserve_analyst_intelligence_check() IS DISTINCT FROM true THEN RAISE EXCEPTION '30th check must pass'; END IF;
 IF public.reserve_analyst_intelligence_check() IS DISTINCT FROM false THEN RAISE EXCEPTION '31st check must fail'; END IF;
 PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', analyst, 'session_id', gen_random_uuid())::text, true);
 BEGIN PERFORM public.read_analyst_intelligence(); EXCEPTION WHEN raise_exception THEN rejected := true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Non-active session must be denied'; END IF;
 rejected := false;
 PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', officer, 'session_id', active_session)::text, true);
 BEGIN PERFORM public.read_analyst_intelligence(); EXCEPTION WHEN raise_exception THEN rejected := true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Officer must be denied'; END IF;
END $$;
ROLLBACK;
