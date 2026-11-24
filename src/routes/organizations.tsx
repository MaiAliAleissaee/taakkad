import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/common/bits";
import { NativeSelect } from "@/components/common/native-select";
import { OrgCard } from "@/components/orgs/org-card";
import { DemoRegistry, demoRegistryQuery } from "@/components/orgs/demo-registry";
import { DemoRegistrationDialog } from "@/components/orgs/demo-registration";
import { ApplicationTracker } from "@/components/orgs/application-tracker";
import type { DemoReceipt } from "@/lib/organizations/demo-schema";
import { OrganizationAccess } from "@/components/orgs/organization-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrgStatus, OrgType } from "@/lib/domain/types";
import { usePublicOrganizations } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { orgStatusLabel, orgTypeLabel } from "@/lib/i18n/labels";

export const Route = createFileRoute("/organizations")({
  loader: ({ context }) => context.queryClient.ensureQueryData(demoRegistryQuery),
  head: () => ({
    meta: [
      { title: "Organization Portal — Taakkad" },
      { name: "description", content: "Submit an organization application, privately track its status and search independently approved organization channels in Taakkad." },
      { property: "og:title", content: "Organization Portal — Taakkad" },
      { property: "og:description", content: "Organization applications, private status-only tracking and channel registry in the Taakkad hackathon prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const { tr, pick } = useI18n();
  const organizations = usePublicOrganizations();
  const [q, setQ] = useState("");
  const [type, setType] = useState<OrgType | "all">("all");
  const [status, setStatus] = useState<OrgStatus | "all">("all");
  const [receipt, setReceipt] = useState<DemoReceipt | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return organizations.filter((o) =>
      (type === "all" || o.type === type) &&
      (status === "all" || o.status === status) &&
      (!term || [o.name.en, o.name.ar, ...o.domains, ...o.channels.map((c) => c.value)].some((v) => v.toLowerCase().includes(term))),
    );
  }, [organizations, q, type, status]);


  return (
    <>
      <PageHeader
        eyebrow={tr("Organization Portal", "بوابة الجهات")}
        title={tr("Register official identities", "سجّل الهويات الرسمية")}
        description={tr(
          "Register a fictional organization for demo review. Approvals and submitted channels are simulated, not ownership verification.",
          "سجّل جهة خيالية للمراجعة التجريبية. الاعتمادات والقنوات المقدّمة تجريبية ولا تعني التحقق من الملكية.",
        )}
        actions={<DemoRegistrationDialog onSubmitted={value => { setReceipt(value); setTimeout(() => document.getElementById("application-tracking")?.scrollIntoView({ behavior: "smooth" }), 100); }} trigger={<Button variant="emerald"><Plus />{tr("Add Organization", "إضافة جهة")}</Button>} />}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <OrganizationAccess />
        <ApplicationTracker receipt={receipt} />
        <h2 className="mb-5 text-2xl font-semibold">{tr("Organization registry", "سجل الجهات")}</h2>
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-card md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" placeholder={tr("Search name, domain or channel", "ابحث بالاسم أو النطاق أو القناة")} aria-label={tr("Search", "بحث")} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:w-96">
            <NativeSelect aria-label={tr("Type", "النوع")} value={type} onChange={(e) => setType(e.target.value as OrgType | "all")}>
              <option value="all">{tr("All types", "كل الأنواع")}</option>
              {(["government", "bank", "business"] as const).map((t) => <option key={t} value={t}>{pick(orgTypeLabel[t])}</option>)}
            </NativeSelect>
            <NativeSelect aria-label={tr("Status", "الحالة")} value={status} onChange={(e) => setStatus(e.target.value as OrgStatus | "all")}>
              <option value="all">{tr("All statuses", "كل الحالات")}</option>
              <option value="verified">{tr("Approved", "معتمدة")}</option>
              {(["pending", "suspended"] as const).map((s) => <option key={s} value={s}>{pick(orgStatusLabel[s])}</option>)}
            </NativeSelect>
          </div>
        </div>

        <div className="mt-5"><DemoRegistry search={q} type={type} status={status} /></div>
        <h2 className="mb-3 text-2xl font-semibold">{tr("Genuinely verified organizations", "الجهات الموثّقة فعلياً")}</h2>
        {filtered.length ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((o) => <OrgCard key={o.id} org={o} actor={{ role: "viewer" }}  />)}
          </div>
        ) : (
          <div className="mt-3"><EmptyState title={tr("No organizations match these filters", "لا توجد جهات مطابقة")} description={tr("Clear the search or change the filters.", "امسح البحث أو غيّر عوامل التصفية.")} /></div>
        )}
      </section>
    </>
  );
}
