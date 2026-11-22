CREATE TABLE public.organization_tracking_credentials (
 application_id uuid PRIMARY KEY REFERENCES public.organization_applications(id) ON DELETE CASCADE,
 secret_hash text NOT NULL,
 email text NOT NULL,
 last_code_at timestamptz,
 code_requested_at timestamptz,
 attempts integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.organization_tracking_credentials TO service_role;
ALTER TABLE public.organization_tracking_credentials ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.organization_application_grants (
 token_hash text PRIMARY KEY,
 application_id uuid NOT NULL REFERENCES public.organization_applications(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL
);
GRANT ALL ON public.organization_application_grants TO service_role;
ALTER TABLE public.organization_application_grants ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.organization_request_limits (
 bucket text PRIMARY KEY,
 started_at timestamptz NOT NULL DEFAULT now(),
 count integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.organization_request_limits TO service_role;
ALTER TABLE public.organization_request_limits ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.organization_rate_limit(bucket_key text, max_requests integer, window_seconds integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result_count integer;
BEGIN
 INSERT INTO public.organization_request_limits(bucket,count) VALUES(bucket_key,1) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN organization_request_limits.started_at < now()-make_interval(secs=>window_seconds) THEN 1 ELSE organization_request_limits.count+1 END, started_at=CASE WHEN organization_request_limits.started_at < now()-make_interval(secs=>window_seconds) THEN now() ELSE organization_request_limits.started_at END RETURNING count INTO result_count;
 RETURN result_count <= max_requests;
END $$;
REVOKE ALL ON FUNCTION public.organization_rate_limit(text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.organization_rate_limit(text,integer,integer) TO service_role;
CREATE FUNCTION public.create_tracked_application(application_payload jsonb, application_documents jsonb, tracking_hash text, tracking_email text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE saved_id uuid;
BEGIN
 saved_id:=public.commit_organization_application(gen_random_uuid(),gen_random_uuid(),'create',0,application_payload,application_documents,'pending','', '{}'::jsonb);
 INSERT INTO public.organization_tracking_credentials(application_id,secret_hash,email) VALUES(saved_id,tracking_hash,tracking_email);
 RETURN saved_id;
END $$;
REVOKE ALL ON FUNCTION public.create_tracked_application(jsonb,jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_tracked_application(jsonb,jsonb,text,text) TO service_role;
CREATE FUNCTION public.begin_application_code(application_uuid uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.organization_tracking_credentials SET last_code_at=now(),code_requested_at=now(),attempts=0 WHERE application_id=application_uuid AND (last_code_at IS NULL OR last_code_at < now()-interval '60 seconds');
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.begin_application_code(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_application_code(uuid) TO service_role;
CREATE FUNCTION public.attempt_application_code(application_uuid uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.organization_tracking_credentials SET attempts=attempts+1 WHERE application_id=application_uuid AND code_requested_at > now()-interval '10 minutes' AND attempts < 5;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.attempt_application_code(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.attempt_application_code(uuid) TO service_role;
CREATE INDEX organization_grant_application_idx ON public.organization_application_grants(application_id);