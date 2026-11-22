import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/bits";
import { MessageChecker } from "@/components/trust/message-checker";
import { DemoExamples } from "@/components/trust/demo-examples";
import { useI18n } from "@/lib/i18n/i18n";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Public Trust Portal — Taakkad" },
      { name: "description", content: "Privately check messages, links and communication channels against approved organization channels without creating an account." },
      { property: "og:title", content: "Public Trust Portal — Taakkad" },
      { property: "og:description", content: "Private, user-initiated channel checks with warning signs and safety advice. Fictional hackathon prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrustPage,
});

function TrustPage() {
  const { tr } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={tr("Public Trust Portal", "بوابة الثقة العامة")}
        title={tr("Is this message really from them?", "هل هذه الرسالة منهم حقاً؟")}
        description={tr(
          "Every result comes with its reasons. Unverified means we could not confirm the sender — it does not mean fraud unless there is evidence.",
          "كل نتيجة مرفقة بأسبابها. «غير موثّق» يعني أننا لم نتمكن من تأكيد المرسل — ولا يعني احتيالاً ما لم يوجد دليل.",
        )}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <MessageChecker />
        <DemoExamples />
      </section>
    </>
  );
}
