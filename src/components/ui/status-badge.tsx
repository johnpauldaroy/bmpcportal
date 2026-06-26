import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "bg-[#edf3f8] text-[#344456]",
  success: "bg-[#e5f3ef] text-[#0b5d53]",
  warning: "bg-[#fff4dc] text-[#7b4c00]",
  danger: "bg-[#fde8e5] text-[#8f1f16]"
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
