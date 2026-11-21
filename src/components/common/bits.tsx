import type { ReactNode } from "react";
import { AtSign, Globe, Mail, MessageSquareText, Phone, type LucideIcon } from "lucide-react";
import type { ChannelType } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/** Domains, IPs, sender IDs: always left-to-right and monospaced, even inside Arabic text. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("ltr-isolate font-mono text-[0.85em]", className)}>{children}</span>;
}

export const channelIcon: Record<ChannelType, LucideIcon> = {
  email: Mail,
  sms: MessageSquareText,
  phone: Phone,
  website: Globe,
  social: AtSign,
  other: Globe,
};

export function ChannelIcon({ type, className }: { type: ChannelType; className?: string }) {
  const Icon = channelIcon[type];
  return <Icon className={cn("size-4", className)} aria-hidden />;
}

export function PageHeader({
  eyebrow, title, description, actions, children,
}: { eyebrow: string; title: string; description: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-hero text-navy-foreground">
      <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-navy-muted sm:text-base">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function StatTile({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "emerald" | "warning" | "danger" }) {
  const toneClass = {
    default: "text-navy-foreground",
    emerald: "text-emerald",
    warning: "text-sev-medium",
    danger: "text-sev-high",
  }[tone];
  return (
    <div className="rounded-xl border border-navy-border bg-navy-elevated/50 p-4 backdrop-blur">
      <p className="text-xs text-navy-muted">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-semibold", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-navy-muted">{hint}</p> : null}
    </div>
  );
}

export function RiskMeter({ score, className }: { score: number; className?: string }) {
  const color = score >= 85 ? "bg-sev-critical" : score >= 65 ? "bg-sev-high" : score >= 40 ? "bg-sev-medium" : "bg-verified";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-end font-mono text-xs font-semibold tabular-nums">{score}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
