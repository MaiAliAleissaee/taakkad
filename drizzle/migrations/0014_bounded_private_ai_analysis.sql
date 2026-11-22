CREATE TABLE public.ai_usage_budgets (usage_day date NOT NULL, bucket text NOT NULL, hits integer NOT NULL DEFAULT 0, recent timestamptz[] NOT NULL DEFAULT '{}', PRIMARY KEY(usage_day,bucket));
GRANT ALL ON public.ai_usage_budgets TO service_role;
REVOKE ALL ON public.ai_usage_budgets FROM anon, authenticated;
ALTER TABLE public.ai_usage_budgets ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.reserve_trust_ai_usage(visitor_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE today date := (now() AT TIME ZONE 'UTC')::date; global_hits integer; times timestamptz[]; previous_day date := today-1;
BEGIN
IF visitor_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid request'; END IF;
PERFORM pg_advisory_xact_lock(7721942026);
SELECT hits INTO global_hits FROM public.ai_usage_budgets WHERE usage_day=today AND bucket='global';
IF coalesce(global_hits,0)>=200 THEN RETURN false; END IF;
SELECT coalesce(array_agg(t),'{}'::timestamptz[]) INTO times FROM public.ai_usage_budgets b CROSS JOIN LATERAL unnest(b.recent) t WHERE b.bucket=visitor_hash AND b.usage_day IN (today,previous_day) AND t>now()-interval '10 minutes';
IF cardinality(times)>=5 THEN RETURN false; END IF;
INSERT INTO public.ai_usage_budgets(usage_day,bucket,hits) VALUES(today,'global',1) ON CONFLICT(usage_day,bucket) DO UPDATE SET hits=public.ai_usage_budgets.hits+1;
INSERT INTO public.ai_usage_budgets(usage_day,bucket,hits,recent) VALUES(today,visitor_hash,1,array_append(times,now())) ON CONFLICT(usage_day,bucket) DO UPDATE SET hits=public.ai_usage_budgets.hits+1,recent=array_append(times,now());
RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_trust_ai_usage(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_trust_ai_usage(text) TO service_role;
CREATE OR REPLACE FUNCTION public.submit_ai_security_report(report_input jsonb,workspace_user uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; clean jsonb; supplied jsonb := coalesce(report_input->'aiIndicators','[]'::jsonb);
BEGIN
IF jsonb_typeof(report_input) IS DISTINCT FROM 'object' OR octet_length(report_input::text)>40000 OR jsonb_typeof(report_input->'channel') IS DISTINCT FROM 'string' OR jsonb_typeof(report_input->'sender') IS DISTINCT FROM 'string' OR jsonb_typeof(report_input->'body') IS DISTINCT FROM 'string' OR report_input->>'channel' NOT IN ('email','sms','phone','website','social','other') OR length(report_input->>'sender')>500 OR length(report_input->>'body')>10000 OR (report_input ? 'url' AND (jsonb_typeof(report_input->'url') IS DISTINCT FROM 'string' OR length(report_input->>'url')>2000)) OR (report_input ? 'claimedOrgId' AND (jsonb_typeof(report_input->'claimedOrgId') IS DISTINCT FROM 'string' OR length(report_input->>'claimedOrgId')>200)) THEN RAISE EXCEPTION 'Invalid report'; END IF;
IF jsonb_typeof(supplied) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid indicators'; END IF;
IF jsonb_array_length(supplied)>20 THEN RAISE EXCEPTION 'Invalid indicators'; END IF;
FOR item IN SELECT value FROM jsonb_array_elements(supplied) LOOP
IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR jsonb_typeof(item->'type') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'value') IS DISTINCT FROM 'string' OR item->>'type' NOT IN ('domain','url','ip','phone','social_handle','email') OR length(item->>'value') NOT BETWEEN 1 AND 2000 OR position(lower(item->>'value') in lower(concat_ws(E'\n',report_input->>'sender',report_input->>'url',report_input->>'body')))=0 OR EXISTS(SELECT 1 FROM jsonb_object_keys(item) k WHERE k NOT IN ('type','value')) THEN RAISE EXCEPTION 'Ungrounded indicator'; END IF;
END LOOP;
IF length(trim(report_input->>'body'))=0 AND length(trim(report_input->>'sender'))=0 AND coalesce(length(trim(report_input->>'url')),0)=0 THEN RAISE EXCEPTION 'Empty report'; END IF;
clean := jsonb_build_object('channel',report_input->>'channel','sender',report_input->>'sender','body',report_input->>'body','aiIndicators',supplied) || CASE WHEN report_input ? 'url' THEN jsonb_build_object('url',report_input->>'url') ELSE '{}'::jsonb END || CASE WHEN report_input ? 'claimedOrgId' THEN jsonb_build_object('claimedOrgId',report_input->>'claimedOrgId') ELSE '{}'::jsonb END;
INSERT INTO public.security_reports(recipient,input) VALUES(workspace_user,clean);
END $$;
REVOKE ALL ON FUNCTION public.submit_ai_security_report(jsonb,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_ai_security_report(jsonb,uuid) TO anon,authenticated,service_role;