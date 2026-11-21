import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return <ol className="flex gap-2 border-b pb-5" aria-label={steps[current]}>
    {steps.map((label, i) => <li key={label} aria-current={i === current ? "step" : undefined} className="flex min-w-0 flex-1 items-start gap-2">
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold", i <= current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i < current ? <Check className="size-4" /> : i + 1}</span>
      <span className={cn("pt-1 text-xs leading-relaxed sm:text-sm", i === current ? "font-semibold text-primary" : "text-muted-foreground")}>{label}</span>
    </li>)}
  </ol>;
}