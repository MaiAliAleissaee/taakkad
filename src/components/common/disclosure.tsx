import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Disclosure({ title, children, open = false, className }: { title: string; children: ReactNode; open?: boolean; className?: string }) {
  return <details open={open || undefined} className={cn("border-t py-4", className)}><summary className="text-sm font-semibold">{title}</summary><div className="mt-4">{children}</div></details>;
}