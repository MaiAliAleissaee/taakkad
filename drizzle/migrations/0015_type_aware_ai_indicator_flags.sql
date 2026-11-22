CREATE OR REPLACE FUNCTION public.flagged_ai_indicator_values(candidate_indicators jsonb,workspace_user uuid DEFAULT NULL) RETURNS text[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; result text[];
BEGIN
IF jsonb_typeof(candidate_indicators) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid check'; END IF;
IF jsonb_array_length(candidate_indicators)>20 THEN RAISE EXCEPTION 'Invalid check'; END IF;
FOR item IN SELECT value FROM jsonb_array_elements(candidate_indicators) LOOP
IF jsonb_typeof(item->'type') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'value') IS DISTINCT FROM 'string' OR item->>'type' NOT IN ('domain','url','ip','phone','social_handle','email') OR length(item->>'value') NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid check'; END IF;
END LOOP;
WITH source AS (SELECT coalesce((SELECT payload FROM public.security_workspaces WHERE user_id=workspace_user),(SELECT payload FROM public.security_templates WHERE id='original')) AS payload), indicators AS (SELECT i FROM source,jsonb_array_elements(payload->'alerts') a,jsonb_array_elements(a->'indicators') i WHERE a->>'status' IN ('escalated','confirmed')), candidates AS (SELECT value c FROM jsonb_array_elements(candidate_indicators)) SELECT coalesce(array_agg(DISTINCT c->>'value'),'{}'::text[]) INTO result FROM candidates WHERE EXISTS(SELECT 1 FROM indicators WHERE i->>'type'=c->>'type' AND CASE WHEN c->>'type'='phone' THEN regexp_replace(i->>'value','[\s().-]','','g')=regexp_replace(c->>'value','[\s().-]','','g') ELSE lower(regexp_replace(regexp_replace(regexp_replace(regexp_replace(i->>'value','^https?://','','i'),'^www\.','','i'),'/$','','g'),'\s','','g'))=lower(regexp_replace(regexp_replace(regexp_replace(regexp_replace(c->>'value','^https?://','','i'),'^www\.','','i'),'/$','','g'),'\s','','g')) END);
RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.flagged_ai_indicator_values(jsonb,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.flagged_ai_indicator_values(jsonb,uuid) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.reserve_trust_ai_usage(visitor_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE today date := (now() AT TIME ZONE 'UTC')::date; global_hits integer; times timestamptz[]; previous_day date := today-1;
BEGIN
IF visitor_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid request'; END IF;
PERFORM pg_advisory_xact_lock(7721942026);
SELECT hits INTO global_hits FROM public.ai_usage_budgets WHERE usage_day=today AND bucket='global';
IF coalesce(global_hits,0)>=200 THEN RETURN false; END IF;
SELECT coalesce(array_agg(DISTINCT t),'{}'::timestamptz[]) INTO times FROM public.ai_usage_budgets b CROSS JOIN LATERAL unnest(b.recent) t WHERE b.bucket=visitor_hash AND b.usage_day IN (today,previous_day) AND t>now()-interval '10 minutes';
IF cardinality(times)>=5 THEN RETURN false; END IF;
INSERT INTO public.ai_usage_budgets(usage_day,bucket,hits) VALUES(today,'global',1) ON CONFLICT(usage_day,bucket) DO UPDATE SET hits=public.ai_usage_budgets.hits+1;
INSERT INTO public.ai_usage_budgets(usage_day,bucket,hits,recent) VALUES(today,visitor_hash,1,array_append(times,now())) ON CONFLICT(usage_day,bucket) DO UPDATE SET hits=public.ai_usage_budgets.hits+1,recent=array_append(times,now());
RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_trust_ai_usage(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_trust_ai_usage(text) TO service_role;