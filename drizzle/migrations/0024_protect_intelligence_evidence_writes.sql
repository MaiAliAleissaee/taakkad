REVOKE ALL ON FUNCTION public.save_analyst_intelligence(jsonb, integer) FROM authenticated;
COMMENT ON FUNCTION public.save_analyst_intelligence(jsonb, integer) IS 'Deprecated client save; application uses service-only authorized evidence command.';
CREATE FUNCTION public.commit_analyst_intelligence(actor_id uuid, next_payload jsonb, expected_revision integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE saved public.analyst_intelligence_workspaces;
BEGIN
 IF actor_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = actor_id AND role = 'security_analyst') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF jsonb_typeof(next_payload->'records') IS DISTINCT FROM 'array' OR jsonb_array_length(next_payload->'records') > 500 OR octet_length(next_payload::text) > 1048576 THEN RAISE EXCEPTION 'Invalid records'; END IF;
 INSERT INTO public.analyst_intelligence_workspaces(user_id) VALUES(actor_id) ON CONFLICT DO NOTHING;
 UPDATE public.analyst_intelligence_workspaces SET payload = next_payload, revision = revision + 1 WHERE user_id = actor_id AND revision = expected_revision RETURNING * INTO saved;
 IF NOT FOUND THEN RAISE EXCEPTION 'Workspace changed; reload'; END IF;
 RETURN jsonb_build_object('records', saved.payload->'records', 'revision', saved.revision);
END;
$$;
REVOKE ALL ON FUNCTION public.commit_analyst_intelligence(uuid, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_analyst_intelligence(uuid, jsonb, integer) TO service_role;