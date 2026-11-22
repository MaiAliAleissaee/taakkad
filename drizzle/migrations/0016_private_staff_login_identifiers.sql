CREATE TABLE public.staff_login_identifiers (
 staff_id text PRIMARY KEY CHECK (staff_id ~ '^[A-Z0-9_-]{3,32}$'),
 user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE
);
GRANT ALL ON public.staff_login_identifiers TO service_role;
REVOKE ALL ON public.staff_login_identifiers FROM anon, authenticated;
ALTER TABLE public.staff_login_identifiers ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.staff_login_identifiers IS 'Service-only login aliases; never passwords or role grants.';