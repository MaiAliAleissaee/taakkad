CREATE OR REPLACE FUNCTION public.authorize_public_security_workspace(workspace_user uuid) RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF workspace_user IS NULL THEN RETURN; END IF;
  IF auth.uid() IS NULL OR workspace_user IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Workspace access denied' USING ERRCODE='42501';
  END IF;
  IF NOT public.has_security_access() THEN
    RAISE EXCEPTION 'Workspace access denied' USING ERRCODE='42501';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.authorize_public_security_workspace(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_public_security_workspace(uuid) TO service_role;
COMMENT ON FUNCTION public.authorize_public_security_workspace(uuid) IS 'Non-null public check/report recipients require caller ownership and active analyst authorization; null never selects a private workspace.';
DO $$
DECLARE signature text; definition text;
BEGIN
  FOREACH signature IN ARRAY ARRAY['public.flagged_message_values(text[],uuid)','public.flagged_ai_indicator_values(jsonb,uuid)','public.submit_security_report(jsonb,uuid)','public.submit_ai_security_report(jsonb,uuid)'] LOOP
    definition := pg_get_functiondef(signature::regprocedure);
    IF position('PERFORM public.authorize_public_security_workspace(workspace_user);' IN definition)=0 THEN
      IF position(E'\nBEGIN\n' IN definition)=0 THEN RAISE EXCEPTION 'Expected function boundary absent'; END IF;
      definition := replace(definition,E'\nBEGIN\n',E'\nBEGIN\nPERFORM public.authorize_public_security_workspace(workspace_user);\n');
      EXECUTE definition;
    END IF;
  END LOOP;
END $$;