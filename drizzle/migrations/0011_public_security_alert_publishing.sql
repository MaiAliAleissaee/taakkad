CREATE TABLE public.security_bulletins(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),content jsonb NOT NULL,status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','published','rejected','withdrawn')),author_id uuid NOT NULL,approved_by uuid,approved_at timestamptz,published_at timestamptz,revision integer NOT NULL DEFAULT 0);
GRANT SELECT ON public.security_bulletins TO authenticated; GRANT ALL ON public.security_bulletins TO service_role;
ALTER TABLE public.security_bulletins ENABLE ROW LEVEL SECURITY;
CREATE POLICY bulletin_staff_read ON public.security_bulletins FOR SELECT TO authenticated USING(public.has_security_access());
CREATE TABLE public.public_security_alerts(id uuid PRIMARY KEY REFERENCES public.security_bulletins(id),content jsonb NOT NULL,published_at timestamptz NOT NULL);
GRANT SELECT ON public.public_security_alerts TO anon,authenticated; GRANT ALL ON public.public_security_alerts TO service_role;
ALTER TABLE public.public_security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY published_alert_read ON public.public_security_alerts FOR SELECT TO anon,authenticated USING(true);
CREATE TABLE public.security_bulletin_audit(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bulletin_id uuid NOT NULL REFERENCES public.security_bulletins(id),actor_id uuid NOT NULL,action text NOT NULL,note text NOT NULL,at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.security_bulletin_audit TO authenticated; GRANT ALL ON public.security_bulletin_audit TO service_role;
ALTER TABLE public.security_bulletin_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY bulletin_audit_staff_read ON public.security_bulletin_audit FOR SELECT TO authenticated USING(public.has_security_access());
CREATE FUNCTION public.manage_security_bulletin(bulletin_id uuid,expected_revision integer,operation text,public_content jsonb,decision_note text,privacy_reviewed boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE row public.security_bulletins; target uuid; supervisor boolean;
BEGIN
 IF NOT public.has_security_access() THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='security_supervisor') INTO supervisor;
 IF operation NOT IN ('save','approve','publish','reject','withdraw') OR length(trim(decision_note))<3 OR length(decision_note)>500 THEN RAISE EXCEPTION 'Invalid command'; END IF;
 IF bulletin_id IS NOT NULL THEN SELECT * INTO row FROM public.security_bulletins WHERE id=bulletin_id FOR UPDATE; IF NOT FOUND OR row.revision IS DISTINCT FROM expected_revision THEN RAISE EXCEPTION 'Conflict'; END IF; END IF;
 IF operation='save' THEN
  IF bulletin_id IS NOT NULL AND row.status NOT IN ('draft','rejected','withdrawn') THEN RAISE EXCEPTION 'Withdraw before editing'; END IF;
  IF public_content IS NULL OR public_content->>'category' NOT IN ('bank','delivery','traffic','government','social','shopping') OR public_content->>'severity' NOT IN ('critical','high','medium','low') THEN RAISE EXCEPTION 'Invalid content'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(public_content) k WHERE k NOT IN ('title','category','severity','explanation','safety')) THEN RAISE EXCEPTION 'Private fields prohibited'; END IF;
  IF EXISTS(SELECT 1 FROM (VALUES('title'),('explanation'),('safety')) fields(k) CROSS JOIN (VALUES('en'),('ar')) langs(l) WHERE public_content->k->>l IS NULL OR length(trim(public_content->k->>l))<3 OR length(public_content->k->>l)>500 OR public_content->k->>l ~* '([[:alnum:].+_-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}|https?://|([+]?[0-9][ .()-]*){7,})') THEN RAISE EXCEPTION 'Unsafe public content'; END IF;
  IF bulletin_id IS NULL THEN INSERT INTO public.security_bulletins(content,author_id) VALUES(public_content,auth.uid()) RETURNING id INTO target;
  ELSE UPDATE public.security_bulletins SET content=public_content,status='draft',author_id=auth.uid(),approved_by=NULL,approved_at=NULL,published_at=NULL,revision=revision+1 WHERE id=bulletin_id; target:=bulletin_id; END IF;
 ELSE
  IF NOT supervisor OR bulletin_id IS NULL THEN RAISE EXCEPTION 'Supervisor required'; END IF;
  target:=bulletin_id;
  IF operation='approve' THEN
   IF row.status<>'draft' OR row.author_id=auth.uid() OR NOT privacy_reviewed THEN RAISE EXCEPTION 'Independent privacy review required'; END IF;
   UPDATE public.security_bulletins SET status='approved',approved_by=auth.uid(),approved_at=now(),revision=revision+1 WHERE id=target;
  ELSIF operation='publish' THEN
   IF row.status<>'approved' OR row.approved_by IS NULL OR NOT privacy_reviewed THEN RAISE EXCEPTION 'Approval required'; END IF;
   UPDATE public.security_bulletins SET status='published',published_at=now(),revision=revision+1 WHERE id=target;
   INSERT INTO public.public_security_alerts(id,content,published_at) VALUES(target,row.content,now());
  ELSIF operation='reject' THEN
   IF row.status NOT IN ('draft','approved') THEN RAISE EXCEPTION 'Invalid transition'; END IF;
   UPDATE public.security_bulletins SET status='rejected',revision=revision+1 WHERE id=target;
  ELSE
   IF row.status<>'published' THEN RAISE EXCEPTION 'Invalid transition'; END IF;
   UPDATE public.security_bulletins SET status='withdrawn',revision=revision+1 WHERE id=target;
   DELETE FROM public.public_security_alerts WHERE id=target;
  END IF;
 END IF;
 INSERT INTO public.security_bulletin_audit(bulletin_id,actor_id,action,note) VALUES(target,auth.uid(),operation,decision_note);
 RETURN target;
END $$;
REVOKE ALL ON FUNCTION public.manage_security_bulletin(uuid,integer,text,jsonb,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_security_bulletin(uuid,integer,text,jsonb,text,boolean) TO authenticated;