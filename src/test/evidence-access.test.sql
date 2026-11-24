-- Rollback-only database contract checks. No user, role or evidence record persists.
BEGIN;
DO $$ DECLARE actor uuid; sid uuid; result_id uuid; rejected boolean; i integer; BEGIN
 IF has_table_privilege('anon','public.private_evidence_items','SELECT') OR has_table_privilege('authenticated','public.private_evidence_items','INSERT') OR has_table_privilege('authenticated','public.private_evidence_items','UPDATE') OR has_table_privilege('authenticated','public.private_evidence_items','DELETE') OR has_function_privilege('authenticated','public.append_private_evidence(uuid,text,text,text,jsonb,text)','EXECUTE') THEN RAISE EXCEPTION 'Private evidence grants violated'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='private_evidence_items' AND c.relrowsecurity) THEN RAISE EXCEPTION 'RLS missing'; END IF;
 SELECT s.user_id,s.id INTO actor,sid FROM auth.sessions s JOIN public.user_roles r ON r.user_id=s.user_id AND r.role='security_analyst' WHERE NOT EXISTS(SELECT 1 FROM public.user_roles o WHERE o.user_id=s.user_id AND o.role='organization_verification_officer') ORDER BY s.created_at DESC LIMIT 1;
 IF actor IS NULL THEN RAISE EXCEPTION 'Existing active analyst fixture unavailable'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'session_id',sid)::text,true);
 IF public.has_private_evidence_access('case') IS DISTINCT FROM true OR public.has_private_evidence_access('intelligence') IS DISTINCT FROM true OR public.has_private_evidence_access('application') IS DISTINCT FROM false THEN RAISE EXCEPTION 'Institution boundaries violated'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'session_id',gen_random_uuid())::text,true);
 IF public.has_private_evidence_access('case') IS DISTINCT FROM false THEN RAISE EXCEPTION 'Revoked session accepted'; END IF;
 FOR i IN 1..6 LOOP result_id:=public.append_private_evidence(actor,'case','phase3-rollback-fixture','attachment',jsonb_build_object('name','abc.txt','mime','text/plain','source','Rollback fictional fixture','capturedAt','2026-11-24T10:00:00Z','provenance','synthetic','bytes',3,'sha256','ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'),'YWJj'); END LOOP;
 rejected:=false; BEGIN PERFORM public.append_private_evidence(actor,'case','phase3-rollback-fixture','attachment','{}','YWJj'); EXCEPTION WHEN raise_exception THEN rejected:=true; END; IF NOT rejected THEN RAISE EXCEPTION 'Seventh attachment accepted'; END IF;
 rejected:=false; BEGIN PERFORM public.append_private_evidence(actor,'case','phase3-rollback-fixture','action','{"confirmed":false,"action":"prepare_request"}',''); EXCEPTION WHEN raise_exception THEN rejected:=true; END; IF NOT rejected THEN RAISE EXCEPTION 'Unconfirmed action accepted'; END IF;
 RAISE NOTICE 'PASS: grants, RLS enabled, institution role boundaries, active-session denial, six-file cap and human confirmation; rollback only';
END $$;
ROLLBACK;
