import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, StatTile } from "@/components/common/bits";
import { NativeSelect } from "@/components/common/native-select";
import { OrgCard } from "@/components/orgs/org-card";
import { RegisterOrgDialog } from "@/components/orgs/register-org-dialog";
import { ChannelManager } from "@/components/orgs/channel-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DemoActor, OrgStatus, OrgType } from "@/lib/domain/types";
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
  const [role, setRole] = useState<DemoActor["role"]>("viewer");
  const [adminOrgId, setAdminOrgId] = useState("org-falcon");
  const [selectedOrgId, setSelectedOrgId] = useState("org-falcon");
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const actor: DemoActor = role === "org_admin" ? { role, orgId: adminOrgId } : { role };
  const selectedOrg = organizations.find((o) => o.id === selectedOrgId) ?? organizations[0];

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
        eyebrow={tr("Organization Portal", "بوابة الجهات")}
        title={tr("Register official identities", "سجّل الهويات الرسمية")}
        description={tr(
          "Fictional agencies, banks and businesses register their identities. Channels require separate independent simulated approval before they can produce a Verified registry match.",
          "تسجّل الجهات والبنوك والشركات الخيالية هوياتها. تتطلب القنوات اعتماداً مستقلاً افتراضياً منفصلاً قبل إنتاج مطابقة موثّقة في السجل.",
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
        <div id="official-channels" className="mb-8 scroll-mt-24 border-b pb-8">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold">{tr("Official communication channels", "قنوات التواصل الرسمية")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tr("Hackathon simulation · no secure sign-in. Production requires independent organization identity and domain-ownership verification plus authenticated server-side permissions.", "محاكاة هاكاثون · لا يوجد تسجيل دخول آمن. يتطلب التشغيل الفعلي تحققاً مستقلاً من هوية الجهة وملكية النطاق وصلاحيات محمية على الخادم.")}</p>
            </div>
            <div className="w-full space-y-2 md:w-80">
              <label className="text-xs font-medium" htmlFor="demo-role">{tr("Simulated role", "الدور الافتراضي")}</label>
              <NativeSelect id="demo-role" disabled={!ready} value={role} onChange={(e) => setRole(e.target.value as DemoActor["role"])}>
                <option value="viewer">{tr("Public viewer · read only", "زائر عام · قراءة فقط")}</option>
                <option value="org_admin">{tr("Organization administrator (simulated)", "مسؤول جهة (افتراضي)")}</option>
                <option value="verifier">{tr("Independent verifier (simulated)", "مراجع مستقل (افتراضي)")}</option>
              </NativeSelect>
              {role === "org_admin" && <>
                <label className="text-xs font-medium" htmlFor="admin-scope">{tr("Administrator's organization", "جهة المسؤول")}</label>
                <NativeSelect id="admin-scope" value={adminOrgId} onChange={(e) => { setAdminOrgId(e.target.value); setSelectedOrgId(e.target.value); }}>
                  {organizations.map((o) => <option key={o.id} value={o.id}>{pick(o.name)}</option>)}
                </NativeSelect>
              </>}
            </div>
          </div>
          <div className="mb-5 max-w-md">
            <label htmlFor="channel-organization" className="mb-2 block text-xs font-medium">{tr("Registry organization", "الجهة في السجل")}</label>
            <NativeSelect id="channel-organization" disabled={!ready} value={selectedOrg?.id ?? ""} onChange={(e) => setSelectedOrgId(e.target.value)}>
              {organizations.map((o) => <option key={o.id} value={o.id}>{pick(o.name)}</option>)}
            </NativeSelect>
          </div>
          {selectedOrg && <ChannelManager key={`${selectedOrg.id}:${role}:${adminOrgId}`} org={selectedOrg} actor={actor} />}
        </div>
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
            {filtered.map((o) => <OrgCard key={o.id} org={o} actor={actor} onManage={() => { setSelectedOrgId(o.id); document.getElementById("official-channels")?.scrollIntoView({ behavior: "smooth" }); }} />)}
          </div>
        ) : (
          <div className="mt-3"><EmptyState title={tr("No organizations match these filters", "لا توجد جهات مطابقة")} description={tr("Clear the search or change the filters.", "امسح البحث أو غيّر عوامل التصفية.")} /></div>
        )}
      </section>
    </>
  );
}
