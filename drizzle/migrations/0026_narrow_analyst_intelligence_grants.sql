REVOKE ALL ON public.analyst_intelligence_workspaces FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.analyst_intelligence_workspaces FROM authenticated;
GRANT SELECT ON public.analyst_intelligence_workspaces TO authenticated;
GRANT ALL ON public.analyst_intelligence_workspaces TO service_role;