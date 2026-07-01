import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "bg-[#F1F5F9] text-[#334155]",
  success: "bg-[#D1FAE5] text-[#047857]",
  warning: "bg-[#FEF3C7] text-[#B45309]",
  danger: "bg-[#FEE2E2] text-[#B91C1C]"
};

export function StatusBadge({
  children,
  tone = "neutral",
  className
}: PropsWithChildren<{ tone?: Tone; className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
