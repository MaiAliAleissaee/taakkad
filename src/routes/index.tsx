import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Cpu, FileKey2, GitBranch, Radar, ShieldCheck, Siren } from "lucide-react";
import { ChannelIcon, Mono } from "@/components/common/bits";
import { MessageChecker } from "@/components/trust/message-checker";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMessageAssessments } from "@/lib/data/hooks";
import { useDemoState } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRUST ZERO AI — Identity Verification & Impersonation Detection Prototype" },
      { name: "description", content: "Hackathon prototype connecting an organization registry, a public trust portal and a security dashboard to spot impersonation. Fictional data." },
      { property: "og:title", content: "TRUST ZERO AI — Hackathon Prototype" },
      { property: "og:description", content: "Arabic-first channel registry checks and simulated investigation services. Fictional hackathon data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { tr, pick, num } = useI18n();
  const { organizations, alerts, lookalikes } = useDemoState();
  const assessed = useMessageAssessments();
  const verifiedOrgs = organizations.filter((o) => o.status === "verified").length;
  const openAlerts = alerts.filter((a) => a.status !== "false_positive" && a.status !== "confirmed").length;
  const preview = (["verified", "unverified", "suspicious"] as const)
    .map((s) => assessed.find((a) => a.assessment.state === s))
    .filter((x) => x !== undefined);

  const portals = [
    {
      to: "/organizations" as const, icon: Building2,
      title: tr("Organization Portal", "بوابة الجهات"),
      body: tr("Agencies, banks and businesses register official domains and approved channels.", "تسجّل الجهات الحكومية والبنوك والشركات نطاقاتها الرسمية وقنواتها المعتمدة."),
      stat: tr(`${num(verifiedOrgs)} of ${num(organizations.length)} verified`, `${num(verifiedOrgs)} من ${num(organizations.length)} موثّقة`),
    },
    {
      to: "/trust" as const, icon: ShieldCheck,
      title: tr("Public Trust Portal", "بوابة الثقة العامة"),
      body: tr("Anyone can check a message or link and see why it is verified, unverified or suspicious.", "يمكن لأي شخص فحص رسالة أو رابط ومعرفة سبب كونه موثّقاً أو غير موثّق أو مشبوهاً."),
      stat: tr(`${num(assessed.length)} sample messages`, `${num(assessed.length)} رسالة تجريبية`),
    },
    {
      to: "/security" as const, icon: Siren,
      title: tr("Security Dashboard", "لوحة الأمن"),
      body: tr("Simulated alerts, lookalike domains, linked indicators, evidence and case review.", "تنبيهات افتراضية ونطاقات مشابهة ومؤشرات مترابطة وأدلة ومراجعة القضايا."),
      stat: tr(`${num(openAlerts)} open cases · ${num(lookalikes.length)} lookalikes`, `${num(openAlerts)} قضية مفتوحة · ${num(lookalikes.length)} نطاق مشابه`),
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
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div><p className="text-sm font-medium text-primary">{tr("Public digital services", "الخدمات الرقمية العامة")}</p><h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl" dir="ltr">TRUST ZERO AI</h1><p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{tr("Check a communication channel. Make your next step with confidence.", "تحقّق من قناة التواصل، واتخذ خطوتك التالية بثقة.")}</p></div>
            <Badge variant="prototype">{tr("Hackathon prototype", "نموذج أولي لهاكاثون")}</Badge>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><MessageChecker /></section>
      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold">{tr("Your service directory", "دليل الخدمات")}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">{portals.map(p => <Link key={p.to} to={p.to} className="group rounded-lg border p-5 transition-colors hover:border-primary hover:bg-accent/40"><div className="flex items-center justify-between"><p.icon className="size-6 text-primary" aria-hidden /><ArrowRight className="size-4 text-muted-foreground rtl:rotate-180" /></div><h3 className="mt-4 text-lg font-semibold">{p.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p><p className="mt-4 border-t pt-3 text-sm font-medium text-primary">{p.stat}</p></Link>)}</div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{tr("From the fictional registry", "من السجل الخيالي")}</h2><Button asChild variant="link"><Link to="/trust">{tr("All sample messages", "كل الرسائل التجريبية")}<ArrowRight className="rtl:rotate-180" /></Link></Button></div>
        <div className="grid gap-4 md:grid-cols-3">{preview.map(({message, assessment}) => <article key={message.id} className="rounded-lg border bg-card p-5"><TrustBadge state={assessment.state} /><div className="mt-4 flex min-w-0 items-center gap-2 text-sm"><ChannelIcon type={message.channel} /><Mono className="break-all">{message.sender}</Mono></div><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{pick(message.subject) || pick(message.body)}</p></article>)}</div>
        <p className="mt-5 text-sm text-muted-foreground">{tr("A registered channel is not proof that an individual message is authentic. Unverified is not proof of fraud.", "القناة المسجّلة لا تثبت أصالة الرسالة الفردية. وعدم التوثيق ليس دليلاً على الاحتيال.")}</p>
        <details className="mt-8 border-t py-5"><summary className="text-sm font-semibold">{tr("Prototype scope and future capabilities", "نطاق النموذج والإمكانات المستقبلية")}</summary><p className="mt-3 text-sm text-muted-foreground">{tr("All data is fictional. No certification, live internet monitoring or government endorsement. The following capabilities are planned, not active.", "جميع البيانات خيالية. لا توجد شهادة أو مراقبة حيّة للإنترنت أو اعتماد حكومي. الإمكانات التالية مخططة وغير مفعّلة.")}</p><div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{future.map(f => <div key={f.title}><f.icon className="size-5 text-primary" /><h3 className="mt-2 text-sm font-medium">{f.title}</h3><p className="mt-1 text-sm text-muted-foreground">{f.body}</p></div>)}</div></details>
      </section>
    </>
  );
}
