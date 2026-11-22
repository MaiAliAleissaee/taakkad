import { createFileRoute, redirect } from "@tanstack/react-router";
import { OfficerDashboard } from "@/components/orgs/officer-dashboard";
import { AccessDeniedDialog } from "@/components/security/access-denied-dialog";
import { supabase } from "@/integrations/supabase/client";
import { isVerificationOfficer } from "@/lib/organizations/schema";

export const Route = createFileRoute("/_authenticated/officer")({
  // UI gate only; officer server functions and RLS still authorize every request.
  beforeLoad: async ({ context }) => {
    const roles = await supabase.from("user_roles").select("role").eq("user_id", context.staffUserId);
    if (roles.error) throw redirect({ to: "/auth", replace: true });
    const roleList = (roles.data ?? []).map(r => r.role as string);
    return { officerDenied: !isVerificationOfficer(roleList), roleList };
  },
  head: () => ({
    meta: [
      { title: "Organization Verification Officer Dashboard — Taakkad" },
      { name: "description", content: "Restricted staff workspace for reviewing fictional organization applications." },
      { property: "og:title", content: "Officer Dashboard — Taakkad" },
      { property: "og:description", content: "Restricted staff workspace for organization verification review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OfficerRoute,
});

function OfficerRoute() {
  const { officerDenied, roleList } = Route.useRouteContext();
  if (officerDenied) return <AccessDeniedDialog area="officer" roles={roleList} />;
  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><OfficerDashboard /></section>;
}
