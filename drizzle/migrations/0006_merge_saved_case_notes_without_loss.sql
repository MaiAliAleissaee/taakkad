CREATE OR REPLACE FUNCTION public.import_security_snapshot(migration_id uuid,saved_payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_payload jsonb; template_payload jsonb; merged_alerts jsonb:='[]'; merged_lookalikes jsonb:='[]'; c jsonb; l jsonb; t jsonb; entry jsonb;
BEGIN
IF NOT public.has_security_access() THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF jsonb_typeof(saved_payload->'alerts') IS DISTINCT FROM 'array' OR jsonb_typeof(saved_payload->'lookalikes') IS DISTINCT FROM 'array' OR octet_length(saved_payload::text)>5000000 THEN RAISE EXCEPTION 'Invalid snapshot'; END IF;
PERFORM public.ensure_security_workspace();
SELECT payload INTO current_payload FROM public.security_workspaces WHERE user_id=auth.uid() FOR UPDATE;
IF EXISTS(SELECT 1 FROM public.security_migrations WHERE id=migration_id AND user_id=auth.uid()) THEN RETURN; END IF;
INSERT INTO public.security_migrations(id,user_id,payload) VALUES(migration_id,auth.uid(),saved_payload);
SELECT payload INTO template_payload FROM public.security_templates WHERE id='original';
FOR c IN SELECT value FROM jsonb_array_elements(current_payload->'alerts') LOOP
SELECT value INTO l FROM jsonb_array_elements(saved_payload->'alerts') WHERE value->>'id'=c->>'id' LIMIT 1;
SELECT value INTO t FROM jsonb_array_elements(template_payload->'alerts') WHERE value->>'id'=c->>'id' LIMIT 1;
IF l IS NULL THEN entry:=c; ELSIF c=t THEN entry:=l; ELSE
entry:=c || jsonb_build_object('notes',coalesce((SELECT jsonb_agg(v) FROM (SELECT value v FROM jsonb_array_elements(c->'notes') UNION ALL SELECT value FROM jsonb_array_elements(l->'notes') n WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c->'notes') x WHERE x->>'id'=n->>'id')) q),'[]'::jsonb),'evidence',coalesce((SELECT jsonb_agg(v) FROM (SELECT value v FROM jsonb_array_elements(c->'evidence') UNION ALL SELECT value FROM jsonb_array_elements(l->'evidence') n WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c->'evidence') x WHERE x->>'id'=n->>'id')) q),'[]'::jsonb),'indicators',coalesce((SELECT jsonb_agg(v) FROM (SELECT value v FROM jsonb_array_elements(c->'indicators') UNION ALL SELECT value FROM jsonb_array_elements(l->'indicators') n WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c->'indicators') x WHERE x->>'type'=n->>'type' AND x->>'value'=n->>'value')) q),'[]'::jsonb));
END IF;
merged_alerts:=merged_alerts || jsonb_build_array(entry);
END LOOP;
FOR l IN SELECT value FROM jsonb_array_elements(saved_payload->'alerts') LOOP
IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(current_payload->'alerts') x WHERE x->>'id'=l->>'id') THEN merged_alerts:=merged_alerts||jsonb_build_array(l); END IF;
END LOOP;
FOR c IN SELECT value FROM jsonb_array_elements(current_payload->'lookalikes') LOOP
SELECT value INTO l FROM jsonb_array_elements(saved_payload->'lookalikes') WHERE value->>'id'=c->>'id' LIMIT 1;
SELECT value INTO t FROM jsonb_array_elements(template_payload->'lookalikes') WHERE value->>'id'=c->>'id' LIMIT 1;
merged_lookalikes:=merged_lookalikes||jsonb_build_array(CASE WHEN l IS NOT NULL AND c=t THEN l ELSE c END);
END LOOP;
FOR l IN SELECT value FROM jsonb_array_elements(saved_payload->'lookalikes') LOOP
IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(current_payload->'lookalikes') x WHERE x->>'id'=l->>'id') THEN merged_lookalikes:=merged_lookalikes||jsonb_build_array(l); END IF;
END LOOP;
UPDATE public.security_workspaces SET payload=jsonb_build_object('alerts',merged_alerts,'lookalikes',merged_lookalikes),revision=revision+1 WHERE user_id=auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.import_security_snapshot(uuid,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.import_security_snapshot(uuid,jsonb) TO authenticated,service_role;