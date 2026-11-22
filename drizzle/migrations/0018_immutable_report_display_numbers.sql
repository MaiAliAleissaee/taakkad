CREATE TABLE public.security_report_number_counters (report_year integer PRIMARY KEY, last_number bigint NOT NULL DEFAULT 0);
GRANT ALL ON public.security_report_number_counters TO service_role;
ALTER TABLE public.security_report_number_counters ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.security_report_number_ledger (report_id text PRIMARY KEY, report_year integer NOT NULL, report_sequence bigint NOT NULL, UNIQUE(report_year,report_sequence));
GRANT ALL ON public.security_report_number_ledger TO service_role;
ALTER TABLE public.security_report_number_ledger ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.number_security_snapshot() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; updated_items jsonb := '[]'::jsonb; report_key text; yr integer; seq bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('trust-zero-report-numbering'));
 FOR item IN SELECT value FROM jsonb_array_elements(COALESCE(NEW.payload->'alerts','[]'::jsonb)) LOOP
  report_key := item->>'id';
  IF report_key IS NULL OR length(report_key)=0 THEN RAISE EXCEPTION 'Report identity required'; END IF;
  SELECT report_year, report_sequence INTO yr,seq FROM public.security_report_number_ledger WHERE report_id=report_key;
  IF NOT FOUND THEN
   yr := extract(year FROM (item->>'detectedAt')::timestamptz AT TIME ZONE 'UTC')::integer;
   INSERT INTO public.security_report_number_counters(report_year,last_number) VALUES(yr,1) ON CONFLICT(report_year) DO UPDATE SET last_number=public.security_report_number_counters.last_number+1 RETURNING last_number INTO seq;
   INSERT INTO public.security_report_number_ledger(report_id,report_year,report_sequence) VALUES(report_key,yr,seq);
  END IF;
  item := jsonb_set(item,'{reportNumber}',to_jsonb(seq::text||'/'||yr::text));
  updated_items := updated_items || jsonb_build_array(item);
 END LOOP;
 NEW.payload := jsonb_set(NEW.payload,'{alerts}',updated_items);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.number_security_snapshot() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.number_security_snapshot() TO service_role;
CREATE TRIGGER security_template_report_numbers BEFORE INSERT OR UPDATE OF payload ON public.security_templates FOR EACH ROW EXECUTE FUNCTION public.number_security_snapshot();
CREATE TRIGGER security_workspace_report_numbers BEFORE INSERT OR UPDATE OF payload ON public.security_workspaces FOR EACH ROW EXECUTE FUNCTION public.number_security_snapshot();
UPDATE public.security_templates SET payload=payload;
UPDATE public.security_workspaces SET payload=payload;
COMMENT ON TABLE public.security_report_number_ledger IS 'Permanent private display identifiers: never recycle numbers when cases disappear; internal report identities remain unchanged.';