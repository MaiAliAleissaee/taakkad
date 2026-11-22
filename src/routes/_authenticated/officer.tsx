import { createFileRoute } from "@tanstack/react-router";
import { OfficerDashboard } from "@/components/orgs/officer-dashboard";

export const Route = createFileRoute("/_authenticated/officer")({
  head: () => ({
    meta: [
      { title: "Organization Verification Officer Dashboard — TRUST ZERO AI" },
      { name: "description", content: "Restricted staff workspace for reviewing fictional organization applications." },
      { property: "og:title", content: "Officer Dashboard — TRUST ZERO AI" },
      { property: "og:description", content: "Restricted staff workspace for organization verification review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><OfficerDashboard /></section>,
});
