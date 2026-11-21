import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TrustState } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/i18n";
import { trustStateLabel } from "@/lib/i18n/labels";

const icons = { verified: ShieldCheck, unverified: ShieldQuestion, suspicious: ShieldAlert };

export function TrustBadge({ state, size = "sm" }: { state: TrustState; size?: "sm" | "lg" }) {
  const { pick } = useI18n();
  const Icon = icons[state];
  return (
    <Badge variant={state} className={size === "lg" ? "px-3 py-1 text-sm" : undefined}>
      <Icon className={size === "lg" ? "size-4" : "size-3.5"} aria-hidden />
      {pick(trustStateLabel[state])}
    </Badge>
  );
}
