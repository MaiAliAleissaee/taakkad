DO $$
DECLARE signature text; definition text;
BEGIN
 FOREACH signature IN ARRAY ARRAY['public.read_organization_identity_conflicts(uuid)','public.resolve_organization_identity_conflicts(uuid,integer,text,boolean,boolean)'] LOOP
  definition:=pg_get_functiondef(signature::regprocedure);
  definition:=replace(definition,'IF NOT public.has_organization_officer_access()', 'IF NOT public.has_active_app_session() OR NOT public.has_organization_officer_access()');
  EXECUTE definition;
 END LOOP;
END $$;