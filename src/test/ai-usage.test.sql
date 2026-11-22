-- Transactional integration tests: no counters, accounts, or case records persist.
BEGIN;
DO $$
DECLARE today date := (now() AT TIME ZONE 'UTC')::date;
        visitor text := repeat('a',64);
        fresh text := repeat('b',64);
BEGIN
  IF has_table_privilege('anon','public.ai_usage_budgets','SELECT') OR
     has_table_privilege('authenticated','public.ai_usage_budgets','UPDATE') OR
     has_function_privilege('anon','public.reserve_trust_ai_usage(text)','EXECUTE') THEN
    RAISE EXCEPTION 'Usage counters must be service-only';
  END IF;
  INSERT INTO public.ai_usage_budgets(usage_day,bucket,hits,recent)
  VALUES(today,visitor,4,ARRAY[now()-interval '4 seconds',now()-interval '3 seconds',now()-interval '2 seconds',now()-interval '1 second'])
  ON CONFLICT(usage_day,bucket) DO UPDATE SET hits=4,recent=excluded.recent;
  INSERT INTO public.ai_usage_budgets(usage_day,bucket,hits)
  VALUES(today,'global',0) ON CONFLICT(usage_day,bucket) DO UPDATE SET hits=0;
  IF public.reserve_trust_ai_usage(visitor) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Fifth request must be allowed'; END IF;
  IF public.reserve_trust_ai_usage(visitor) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Sixth request within ten minutes must be denied'; END IF;
  UPDATE public.ai_usage_budgets SET recent=ARRAY[now()-interval '11 minutes'] WHERE usage_day=today AND bucket=visitor;
  IF public.reserve_trust_ai_usage(visitor) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Expired rolling window must permit a request'; END IF;
  UPDATE public.ai_usage_budgets SET hits=199 WHERE usage_day=today AND bucket='global';
  IF public.reserve_trust_ai_usage(fresh) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Daily request 200 must be allowed'; END IF;
  IF public.reserve_trust_ai_usage(repeat('c',64)) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Daily request 201 must be denied'; END IF;
  IF public.flagged_ai_indicator_values('[{"type":"ip","value":"203.0.113.45"}]'::jsonb) IS DISTINCT FROM ARRAY['203.0.113.45'] THEN RAISE EXCEPTION 'Shared fictional IP must match'; END IF;
  IF public.flagged_ai_indicator_values('[{"type":"phone","value":"203.0.113.45"}]'::jsonb) IS DISTINCT FROM '{}'::text[] THEN RAISE EXCEPTION 'Wrong indicator type must not match'; END IF;
END $$;
ROLLBACK;