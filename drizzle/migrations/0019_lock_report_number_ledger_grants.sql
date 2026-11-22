REVOKE ALL ON public.security_report_number_counters FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.security_report_number_ledger FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.security_report_number_counters TO service_role;
GRANT ALL ON public.security_report_number_ledger TO service_role;