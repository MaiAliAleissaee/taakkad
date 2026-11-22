DROP POLICY IF EXISTS published_alert_read ON public.public_security_alerts;
CREATE POLICY published_alert_read ON public.public_security_alerts
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now());