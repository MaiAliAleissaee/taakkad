REVOKE ALL ON FUNCTION public.create_staff_profile() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.has_security_access() FROM anon;
REVOKE ALL ON FUNCTION public.ensure_security_workspace() FROM anon;
REVOKE ALL ON FUNCTION public.import_security_snapshot(uuid,jsonb) FROM anon;