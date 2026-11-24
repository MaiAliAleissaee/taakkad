CREATE TABLE public.analyst_intelligence_workspaces (
 user_id uuid PRIMARY KEY,
 payload jsonb NOT NULL DEFAULT '{"records":[]}'::jsonb,
 revision integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.analyst_intelligence_workspaces TO authenticated;
GRANT ALL ON public.analyst_intelligence_workspaces TO service_role;
ALTER TABLE public.analyst_intelligence_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY analyst_intelligence_owner_read ON public.analyst_intelligence_workspaces FOR SELECT TO authenticated USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'security_analyst'));
CREATE FUNCTION public.read_analyst_intelligence() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'security_analyst') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 RETURN COALESCE((SELECT jsonb_build_object('records', payload->'records', 'revision', revision) FROM public.analyst_intelligence_workspaces WHERE user_id = auth.uid()), '{"records":[],"revision":0}'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.read_analyst_intelligence() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.read_analyst_intelligence() TO authenticated;
CREATE FUNCTION public.save_analyst_intelligence(next_payload jsonb, expected_revision integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE saved public.analyst_intelligence_workspaces;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'security_analyst') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF jsonb_typeof(next_payload->'records') IS DISTINCT FROM 'array' OR jsonb_array_length(next_payload->'records') > 500 OR octet_length(next_payload::text) > 1048576 THEN RAISE EXCEPTION 'Invalid records'; END IF;
 INSERT INTO public.analyst_intelligence_workspaces(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 UPDATE public.analyst_intelligence_workspaces SET payload = next_payload, revision = revision + 1 WHERE user_id = auth.uid() AND revision = expected_revision RETURNING * INTO saved;
 IF NOT FOUND THEN RAISE EXCEPTION 'Workspace changed; reload'; END IF;
 RETURN jsonb_build_object('records', saved.payload->'records', 'revision', saved.revision);
END;
$$;
REVOKE ALL ON FUNCTION public.save_analyst_intelligence(jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_analyst_intelligence(jsonb, integer) TO authenticated;
CREATE FUNCTION public.reserve_analyst_intelligence_check() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'security_analyst') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 RETURN public.organization_rate_limit('analyst-intelligence:' || auth.uid()::text, 30, 600);
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_analyst_intelligence_check() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_analyst_intelligence_check() TO authenticated;
COMMENT ON TABLE public.analyst_intelligence_workspaces IS 'Private analyst leads only. DNS presence and registration observations do not prove fraud or approve channels.';