CREATE TABLE public.staff_password_setup_grants (
 token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 used_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.staff_password_setup_grants TO service_role;
REVOKE ALL ON public.staff_password_setup_grants FROM anon, authenticated;
ALTER TABLE public.staff_password_setup_grants ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.staff_password_setup_grants IS 'Service-only single-use hashed password setup links; never passwords or role grants.';