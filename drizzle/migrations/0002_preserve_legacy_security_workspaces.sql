CREATE TABLE public.security_migrations (id uuid PRIMARY KEY, user_id uuid NOT NULL, payload jsonb NOT NULL, imported_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.security_migrations TO authenticated; GRANT ALL ON public.security_migrations TO service_role;
ALTER TABLE public.security_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY security_migrations_read ON public.security_migrations FOR SELECT TO authenticated USING(public.has_security_access() AND user_id=auth.uid());
CREATE FUNCTION public.ensure_security_workspace() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.has_security_access() THEN RAISE EXCEPTION 'Forbidden'; END IF; INSERT INTO public.security_workspaces(user_id,payload) SELECT auth.uid(),payload FROM public.security_templates WHERE id='original' ON CONFLICT(user_id) DO NOTHING; END $$;
REVOKE ALL ON FUNCTION public.ensure_security_workspace() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.ensure_security_workspace() TO authenticated,service_role;
CREATE FUNCTION public.import_security_snapshot(migration_id uuid,saved_payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_revision integer; current_payload jsonb; merged jsonb;
BEGIN
IF NOT public.has_security_access() THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF jsonb_typeof(saved_payload->'alerts')<>'array' OR jsonb_typeof(saved_payload->'lookalikes')<>'array' OR octet_length(saved_payload::text)>5000000 THEN RAISE EXCEPTION 'Invalid snapshot'; END IF;
PERFORM public.ensure_security_workspace();
SELECT payload,revision INTO current_payload,current_revision FROM public.security_workspaces WHERE user_id=auth.uid() FOR UPDATE;
IF EXISTS(SELECT 1 FROM public.security_migrations WHERE id=migration_id AND user_id=auth.uid()) THEN RETURN; END IF;
INSERT INTO public.security_migrations(id,user_id,payload) VALUES(migration_id,auth.uid(),saved_payload);
IF current_revision=0 THEN merged:=saved_payload;
ELSE SELECT jsonb_build_object('alerts',coalesce((SELECT jsonb_agg(a) FROM (SELECT value a FROM jsonb_array_elements(current_payload->'alerts') UNION ALL SELECT value FROM jsonb_array_elements(saved_payload->'alerts') l WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(current_payload->'alerts') c WHERE c->>'id'=l->>'id')) x),'[]'::jsonb),'lookalikes',coalesce((SELECT jsonb_agg(a) FROM (SELECT value a FROM jsonb_array_elements(current_payload->'lookalikes') UNION ALL SELECT value FROM jsonb_array_elements(saved_payload->'lookalikes') l WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(current_payload->'lookalikes') c WHERE c->>'id'=l->>'id')) x),'[]'::jsonb)) INTO merged;
END IF;
UPDATE public.security_workspaces SET payload=merged,revision=revision+1 WHERE user_id=auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.import_security_snapshot(uuid,jsonb) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.import_security_snapshot(uuid,jsonb) TO authenticated,service_role;