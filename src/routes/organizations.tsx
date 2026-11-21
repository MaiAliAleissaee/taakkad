import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader, StatTile } from "@/components/common/bits";
import { NativeSelect } from "@/components/common/native-select";
import { OrgCard } from "@/components/orgs/org-card";
import { RegisterOrgDialog } from "@/components/orgs/register-org-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrgStatus, OrgType } from "@/lib/domain/types";
import { useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { orgStatusLabel, orgTypeLabel } from "@/lib/i18n/labels";

export const Route = createFileRoute("/organizations")({
  head: () => ({
    meta: [
      { title: "Organization Portal — TRUST ZERO AI" },
      { name: "description", content: "Register fictional agencies, banks and businesses with their official domains and approved channels, and track verification status." },
      { property: "og:title", content: "Organization Portal — TRUST ZERO AI" },
      { property: "og:description", content: "Register official domains and approved communication channels in the TRUST ZERO AI prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const { tr, pick, num } = useI18n();
  const { organizations } = useDemoState();
  const [q, setQ] = useState("");
  const [type, setType] = useState<OrgType | "all">("all");
  const [status, setStatus] = useState<OrgStatus | "all">("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return organizations.filter((o) =>
      (type === "all" || o.type === type) &&
      (status === "all" || o.status === status) &&
      (!term || [o.name.en, o.name.ar, ...o.domains, ...o.channels.map((c) => c.value)].some((v) => v.toLowerCase().includes(term))),
    );
  }, [organizations, q, type, status]);

  const count = (s: OrgStatus) => organizations.filter((o) => o.status === s).length;

  return (
    <>
      <PageHeader
        eyebrow={tr("Section 01 · Organization Portal", "القسم 01 · بوابة الجهات")}
        title={tr("Register official identities", "سجّل الهويات الرسمية")}
        description={tr(
          "Fictional government agencies, banks and businesses declare their official domains and approved channels. Only verified organizations make messages show as Verified.",
          "تعلن الجهات الحكومية والبنوك والشركات الخيالية عن نطاقاتها الرسمية وقنواتها المعتمدة. فقط الجهات الموثّقة تجعل رسائلها تظهر كـ«موثّقة».",
        )}
        actions={<RegisterOrgDialog trigger={<Button variant="emerald"><Plus />{tr("Register organization", "تسجيل جهة")}</Button>} />}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label={tr("Registered", "مسجّلة")} value={num(organizations.length)} />
          <StatTile label={tr("Verified", "موثّقة")} value={num(count("verified"))} tone="emerald" />
          <StatTile label={tr("Pending review", "قيد المراجعة")} value={num(count("pending"))} tone="warning" />
          <StatTile label={tr("Suspended", "موقوفة")} value={num(count("suspended"))} tone="danger" />
        </div>
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
              {(["verified", "pending", "suspended"] as const).map((s) => <option key={s} value={s}>{pick(orgStatusLabel[s])}</option>)}
            </NativeSelect>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{tr(`${filtered.length} organizations`, `${filtered.length} جهة`)}</p>
        {filtered.length ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((o) => <OrgCard key={o.id} org={o} />)}
          </div>
        ) : (
          <div className="mt-3"><EmptyState title={tr("No organizations match these filters", "لا توجد جهات مطابقة")} description={tr("Clear the search or change the filters.", "امسح البحث أو غيّر عوامل التصفية.")} /></div>
        )}
      </section>
    </>
  );
}
