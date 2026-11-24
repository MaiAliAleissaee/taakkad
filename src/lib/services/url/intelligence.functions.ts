import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { uncheckedRedirects, type UrlIntelligence } from "./intelligence";

/** Domain/hostname only: never sends paths, queries, credentials, messages or cookies. */
export const getUrlIntelligence = createServerFn({ method: "POST" })
  .inputValidator(input => z.object({ domain: z.string().trim().min(1).max(253).regex(/^[a-z0-9.-]+$/), host: z.string().trim().min(1).max(253).regex(/^[a-z0-9.-]+$/).optional() }).strict().parse(input))
  .handler(async ({ data }): Promise<UrlIntelligence> => {
    try {
      const { trackingRateLimit } = await import("@/lib/organizations/tracking.server");
      await trackingRateLimit("url-rdap", 20);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const ceiling = await supabaseAdmin.rpc("organization_rate_limit", { bucket_key: "url-rdap-global", max_requests: 1000, window_seconds: 3600 });
      if (ceiling.error || !ceiling.data) return { rdap: { status: "unavailable", reason: "limited" }, redirects: uncheckedRedirects };
    } catch { return { rdap: { status: "unavailable", reason: "limited" }, redirects: uncheckedRedirects }; }
    const { analyzeUrl } = await import("./analyze");
    const host = data.host ?? data.domain;
    const parsed = analyzeUrl(host);
    if (!parsed.networkEligible || parsed.host !== host || parsed.domain !== data.domain) return { rdap: { status: "unavailable", reason: "blocked" }, dns: { status: "unavailable", reason: "blocked" }, redirects: uncheckedRedirects };
    const { lookupRdap } = await import("./rdap.server");
    const { lookupDns } = await import("./dns.server");
    const [rdap, dns] = await Promise.all([lookupRdap(data.domain), lookupDns(host)]);
    return { rdap, dns, redirects: uncheckedRedirects };
  });
