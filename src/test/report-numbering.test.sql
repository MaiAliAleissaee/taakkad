-- No saved records or numbering counters persist from this integration test.
BEGIN;
DO $$
DECLARE base jsonb; first_number text; second_number text; next_number text;
BEGIN
  IF has_table_privilege('anon','public.security_report_number_ledger','SELECT')
     OR has_table_privilege('authenticated','public.security_report_number_counters','UPDATE') THEN
    RAISE EXCEPTION 'Numbering ledger must stay private';
  END IF;
  SELECT payload->'alerts'->0 INTO base FROM public.security_templates WHERE id='original';
  base := jsonb_set(jsonb_set(base,'{id}','"polish-number-test-a"'),'{detectedAt}', '"2026-11-22T09:00:00Z"');
  INSERT INTO public.security_templates(id,payload) VALUES('polish-number-test', jsonb_build_object('alerts',jsonb_build_array(base),'lookalikes','[]'::jsonb));
  SELECT payload->'alerts'->0->>'reportNumber' INTO first_number FROM public.security_templates WHERE id='polish-number-test';
  IF first_number NOT LIKE '%/2026' THEN RAISE EXCEPTION 'Expected year-specific number'; END IF;
  UPDATE public.security_templates SET payload=jsonb_set(payload,'{alerts}',jsonb_build_array(jsonb_set(base,'{id}','"polish-number-test-b"'),base)) WHERE id='polish-number-test';
  SELECT payload->'alerts'->0->>'reportNumber' INTO second_number FROM public.security_templates WHERE id='polish-number-test';
  IF first_number=second_number THEN RAISE EXCEPTION 'Different identities must not collide'; END IF;
  IF (SELECT payload->'alerts'->1->>'reportNumber' FROM public.security_templates WHERE id='polish-number-test') <> first_number THEN RAISE EXCEPTION 'Reordering must not renumber'; END IF;
  UPDATE public.security_templates SET payload=jsonb_set(payload,'{alerts}','[]'::jsonb) WHERE id='polish-number-test';
  UPDATE public.security_templates SET payload=jsonb_set(payload,'{alerts}',jsonb_build_array(base)) WHERE id='polish-number-test';
  IF (SELECT payload->'alerts'->0->>'reportNumber' FROM public.security_templates WHERE id='polish-number-test') <> first_number THEN RAISE EXCEPTION 'Removed numbers must remain assigned'; END IF;
  base := jsonb_set(jsonb_set(base,'{id}','"polish-number-test-c"'),'{detectedAt}','"2027-01-01T00:00:00Z"');
  UPDATE public.security_templates SET payload=jsonb_set(payload,'{alerts}',jsonb_build_array(base)) WHERE id='polish-number-test';
  SELECT payload->'alerts'->0->>'reportNumber' INTO next_number FROM public.security_templates WHERE id='polish-number-test';
  IF next_number NOT LIKE '%/2027' THEN RAISE EXCEPTION 'Future reports must use their own year'; END IF;
END $$;
ROLLBACK;