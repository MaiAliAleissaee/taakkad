import { BadgeCheck, Ban, CheckCircle2, Circle, Fingerprint, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChannelIcon, Mono } from "@/components/common/bits";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Organization } from "@/lib/domain/types";
import { repository } from "@/lib/data/local-store";
import { useI18n } from "@/lib/i18n/i18n";
import { channelLabel, orgStatusLabel, orgTypeLabel } from "@/lib/i18n/labels";
import { hostFromUrl, isSameOrSubdomain } from "@/lib/services/lookalike";
import { demoSignatureService } from "@/lib/services/signatures";

const statusVariant = { verified: "verified", pending: "unverified", suspended: "suspicious" } as const;

function VerifyDialog({ org }: { org: Organization }) {
  const { tr } = useI18n();
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    Promise.all(org.domains.map(async (d) => [d, (await demoSignatureService.fingerprint(`${org.id}:${d}`)).slice(7, 23).replace(/:/g, "").toLowerCase()] as const)).then((pairs) => {
      if (alive) setTokens(Object.fromEntries(pairs));
    });
    return () => { alive = false; };
  }, [org.id, org.domains]);

  const channelChecks = org.channels.map((c) => {
    let ok = true;
    if (c.type === "email") ok = org.domains.some((d) => isSameOrSubdomain(c.value.split("@").pop() ?? "", d));
    if (c.type === "website") ok = org.domains.some((d) => isSameOrSubdomain(hostFromUrl(c.value) ?? "", d));
    return { c, ok };
  });
  const allDomainsConfirmed = org.domains.every((d) => checked[d]);
  const channelsOk = channelChecks.every((x) => x.ok);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm"><BadgeCheck />{tr("Run verification", "بدء التوثيق")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tr("Verification checks", "فحوصات التوثيق")}</DialogTitle>
          <DialogDescription>
            {tr("Simulated: no DNS lookup is performed. In production, each domain would publish this token as a DNS TXT record.", "محاكاة: لا يتم إجراء أي استعلام DNS. في التشغيل الفعلي، تنشر كل جهة هذا الرمز كسجل TXT.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{tr("1. Domain ownership", "1. ملكية النطاق")}</p>
            {org.domains.map((d) => (
              <label key={d} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm hover:bg-muted">
                <input type="checkbox" className="mt-1 accent-emerald" checked={!!checked[d]} onChange={(e) => setChecked((s) => ({ ...s, [d]: e.target.checked }))} />
                <span className="min-w-0">
                  <Mono className="font-semibold">{d}</Mono>
                  <span className="mt-1 block break-all text-xs text-muted-foreground"><Mono>TXT trustzero-verify={tokens[d] ?? "…"}</Mono></span>
                  <span className="mt-1 block text-xs text-muted-foreground">{tr("Mark as confirmed (simulated)", "تأكيد (محاكاة)")}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{tr("2. Channel consistency", "2. اتساق القنوات")}</p>
            <ul className="space-y-1.5">
              {channelChecks.map(({ c, ok }) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  {ok ? <CheckCircle2 className="size-4 text-verified" /> : <Circle className="size-4 text-suspicious" />}
                  <Mono>{c.value}</Mono>
                  {!ok ? <span className="text-xs text-suspicious">{tr("outside registered domains", "خارج النطاقات المسجّلة")}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!allDomainsConfirmed || !channelsOk}
            onClick={() => {
              repository.setOrganizationStatus(org.id, "verified");
              toast.success(tr("Organization verified (simulated)", "تم توثيق الجهة (محاكاة)"));
            }}
          >
            <ShieldCheck />{tr("Approve verification", "اعتماد التوثيق")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrgCard({ org }: { org: Organization }) {
  const { tr, pick, date, lang } = useI18n();
  const other = lang === "ar" ? org.name.en : org.name.ar;
  return (
    <article className="flex flex-col rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{pick(orgTypeLabel[org.type])}</p>
          <h3 className="mt-1 text-lg font-semibold leading-snug">{pick(org.name)}</h3>
          <p className="text-sm text-muted-foreground" dir={lang === "ar" ? "ltr" : "rtl"}>{other}</p>
        </div>
        <Badge variant={statusVariant[org.status]}>{pick(orgStatusLabel[org.status])}</Badge>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">{tr("Official domains", "النطاقات الرسمية")}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {org.domains.map((d) => <span key={d} className="rounded-md bg-muted px-2 py-0.5"><Mono>{d}</Mono></span>)}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{tr("Approved channels", "القنوات المعتمدة")}</p>
          <ul className="mt-1 space-y-1">
            {org.channels.map((c) => (
              <li key={c.id} className="flex items-center gap-2" title={pick(channelLabel[c.type])}>
                <ChannelIcon type={c.type} className="text-accent-foreground" />
                <Mono className="truncate">{c.value}</Mono>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <Fingerprint className="size-4 shrink-0" />
          <span className="min-w-0 truncate"><Mono>{org.keyFingerprint}</Mono></span>
          <span className="ms-auto shrink-0">{tr("demo key", "مفتاح تجريبي")}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {tr("Registered", "سُجّلت")} {date(org.registeredAt)}
          {org.verifiedAt && org.status === "verified" ? ` · ${tr("Verified", "وُثّقت")} ${date(org.verifiedAt)}` : ""}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
        {org.status === "pending" ? <VerifyDialog org={org} /> : null}
        {org.status === "verified" ? (
          <Button size="sm" variant="outline" onClick={() => { repository.setOrganizationStatus(org.id, "suspended"); toast(tr("Verification suspended", "تم إيقاف التوثيق")); }}>
            <Ban />{tr("Suspend", "إيقاف")}
          </Button>
        ) : null}
        {org.status === "suspended" ? (
          <Button size="sm" variant="outline" onClick={() => { repository.setOrganizationStatus(org.id, "verified"); toast.success(tr("Verification reinstated", "تمت إعادة التوثيق")); }}>
            <RotateCcw />{tr("Reinstate", "إعادة التفعيل")}
          </Button>
        ) : null}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="ms-auto text-muted-foreground"><Trash2 />{tr("Remove", "حذف")}</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tr(`Remove ${org.name.en}?`, `حذف ${org.name.ar}؟`)}</AlertDialogTitle>
              <AlertDialogDescription>
                {tr("Its messages will no longer be verified in the Public Trust Portal.", "لن تُوثَّق رسائلها بعد الآن في بوابة الثقة العامة.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tr("Cancel", "إلغاء")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => { repository.deleteOrganization(org.id); toast(tr("Organization removed", "تم حذف الجهة")); }}>{tr("Remove", "حذف")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
}
