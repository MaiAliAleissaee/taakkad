import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Cpu, FileKey2, GitBranch, Radar, ShieldCheck, Siren } from "lucide-react";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publishedAlertsQuery } from "@/lib/alerts/queries";
import { PublicAlertCard } from "@/components/security/public-alert-card";
import { useI18n } from "@/lib/i18n/i18n";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedAlertsQuery),
  head: () => ({
    meta: [
      { title: "Taakkad — Identity Verification & Impersonation Detection Prototype" },
      { name: "description", content: "Hackathon prototype connecting an organization registry, a public trust portal and a security dashboard to spot impersonation. Fictional data." },
      { property: "og:title", content: "Taakkad — Hackathon Prototype" },
      { property: "og:description", content: "Verify who is really messaging you. Bilingual Arabic/English prototype with fictional demo data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { tr } = useI18n();
  const { data: alerts } = useSuspenseQuery(publishedAlertsQuery);
  const preview = alerts.slice(0, 3);

  const portals = [
    {
      to: "/organizations" as const, icon: Building2,
      title: tr("Organization Portal", "بوابة الجهات"),
      body: tr("Agencies, banks and businesses register official domains and approved channels.", "تسجّل الجهات الحكومية والبنوك والشركات نطاقاتها الرسمية وقنواتها المعتمدة."),
      stat: tr("Register an organization", "سجّل جهة"),
    },
    {
      to: "/trust" as const, icon: ShieldCheck,
      title: tr("Public Trust Portal", "بوابة الثقة العامة"),
      body: tr("Anyone can check a message or link and see why it is verified, unverified or suspicious.", "يمكن لأي شخص فحص رسالة أو رابط ومعرفة سبب كونه موثّقاً أو غير موثّق أو مشبوهاً."),
      stat: tr("Check a message privately", "افحص رسالة بشكل خاص"),
    },
    {
      to: "/security" as const, icon: Siren,
      title: tr("Security Dashboard", "لوحة التحكم الأمنية"),
      body: tr("Simulated alerts, lookalike domains, linked indicators, evidence and case review.", "تنبيهات افتراضية ونطاقات مشابهة ومؤشرات مترابطة وأدلة ومراجعة القضايا."),
      stat: tr("Authorized personnel only", "للموظفين المصرّح لهم فقط"),
    },
  ];

  const future = [
    { icon: FileKey2, title: tr("Digital signatures", "التوقيعات الرقمية"), body: tr("Key fingerprint slot per organization, ready for signed messages.", "خانة بصمة مفتاح لكل جهة، جاهزة للرسائل الموقّعة.") },
    { icon: Radar, title: tr("Domain monitoring", "مراقبة النطاقات"), body: tr("Pluggable monitor; today it only simulates scans locally.", "مراقب قابل للاستبدال؛ يحاكي الفحص محلياً حالياً فقط.") },
    { icon: Cpu, title: tr("AI analysis", "التحليل بالذكاء الاصطناعي"), body: tr("Content analyzer interface; today a transparent keyword heuristic.", "واجهة لتحليل المحتوى؛ تعمل حالياً بقواعد كلمات واضحة.") },
    { icon: GitBranch, title: tr("Source delivery", "تسليم الشيفرة"), body: tr("Clean, typed modules ready to sync to a GitHub repository.", "وحدات منظمة ومكتوبة بأنواع واضحة جاهزة للمزامنة مع GitHub.") },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-hero text-navy-foreground">
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pt-20">
          <div>
            <Badge variant="prototype">{tr("Hackathon prototype", "نموذج أولي لهاكاثون")}</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">
              {tr("Know who is really", "اعرف من يراسلك")}{" "}
              <span className="text-emerald">{tr("messaging you.", "حقاً.")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-muted sm:text-lg">
              {tr(
                "Taakkad links official organizations, the public and security analysts so impersonation is caught early — without branding honest unknown senders as fraud.",
                "يربط تأكّد بين الجهات الرسمية والجمهور ومحللي الأمن لرصد الانتحال مبكراً — دون وصف المرسلين المجهولين بالاحتيال بلا دليل.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="emerald" size="lg" asChild>
                <Link to="/trust">{tr("Check a message", "افحص رسالة")}<ArrowRight className="rtl:rotate-180" /></Link>
              </Button>
              <Button variant="onNavy" size="lg" asChild>
                <Link to="/organizations">{tr("Register an organization", "سجّل جهة")}</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-navy-muted">
              {tr("All data is fictional. No real-world certification, live internet monitoring or government endorsement.", "جميع البيانات خيالية. لا توجد شهادة فعلية أو مراقبة حيّة للإنترنت أو اعتماد حكومي.")}
            </p>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-navy-border bg-navy-elevated/60 p-5 shadow-2xl backdrop-blur">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald/20 to-transparent animate-scan" aria-hidden />
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-navy-muted">{tr("Security Alerts", "التنبيهات الأمنية")}</h2>
                <span className="flex items-center gap-2 text-xs text-emerald">
                  <span className="size-2 rounded-full bg-emerald animate-pulse-ring" />
                  {tr("Fictional demo", "عرض خيالي")}
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {preview.map(alert => <li key={alert.id}><PublicAlertCard alert={alert} /></li>)}
              </ul>
              {!preview.length && <p className="mt-4 text-sm text-navy-muted">{tr("No published alerts", "لا توجد تنبيهات منشورة")}</p>}
              <Button variant="onNavy" size="sm" asChild className="mt-4"><Link to="/alerts">{tr("View All Alerts", "عرض جميع التنبيهات")}<ArrowRight className="rtl:rotate-180" /></Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {portals.map((p) => (
            <Link key={p.to} to={p.to} className="group relative rounded-2xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:border-emerald/50">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <p.icon className="size-5" aria-hidden />
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm">
                <span className="font-medium text-accent-foreground">{p.stat}</span>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-verified">{tr("Three clear states", "ثلاث حالات واضحة")}</p>
            <h2 className="mt-3 text-3xl font-semibold">{tr("Unverified is not the same as fraud.", "غير موثّق لا يعني احتيالاً.")}</h2>
            <p className="mt-3 text-muted-foreground">
              {tr("A message is only marked suspicious when there is concrete evidence — a lookalike domain, an imitation sender ID, a false identity claim with a sensitive request, or an escalated case.", "لا تُوصف الرسالة بالمشبوهة إلا عند وجود دليل ملموس — نطاق مشابه، أو معرّف مرسل مقلَّد، أو ادعاء هوية كاذب مع طلب حساس، أو قضية مُصعّدة.")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["verified", tr("Registered channel of a verified organization.", "قناة مسجّلة لجهة موثّقة.")],
              ["unverified", tr("Cannot be confirmed yet. Check directly with the organization.", "لا يمكن التأكيد بعد. تحقّق مباشرة مع الجهة.")],
              ["suspicious", tr("Specific evidence of impersonation was found.", "وُجد دليل محدد على الانتحال.")],
            ] as const).map(([state, text]) => (
              <div key={state} className="rounded-xl border bg-card p-5 shadow-card">
                <TrustBadge state={state} size="lg" />
                <p className="mt-3 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-info">{tr("Built to extend", "مصمم للتوسّع")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{tr("Ready for the next build stage", "جاهز للمرحلة التالية")}</h2>
            </div>
            <Badge variant="muted">{tr("Planned — not active in this prototype", "مخطط — غير مفعّل في هذا النموذج")}</Badge>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {future.map((f) => (
              <div key={f.title} className="rounded-xl bg-muted p-4">
                <f.icon className="size-5 text-primary" aria-hidden />
                <p className="mt-3 font-medium">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
