ALTER POLICY analyst_intelligence_owner_read ON public.analyst_intelligence_workspaces USING (user_id = auth.uid() AND public.has_security_access() AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'security_analyst'));
CREATE OR REPLACE FUNCTION public.read_analyst_intelligence() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.has_security_access() OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'security_analyst') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 RETURN COALESCE((SELECT jsonb_build_object('records', payload->'records', 'revision', revision) FROM public.analyst_intelligence_workspaces WHERE user_id = auth.uid()), '{"records":[],"revision":0}'::jsonb);
END;
$$;
CREATE OR REPLACE FUNCTION public.reserve_analyst_intelligence_check() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.has_security_access() OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'security_analyst') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 RETURN public.organization_rate_limit('analyst-intelligence:' || auth.uid()::text, 30, 600);
END;
$$;