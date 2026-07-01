"use client";

import { ArrowLeft } from "@/components/ui/icon";
import { useRouter } from "next/navigation";

export function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  function handleBack() {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  }

  return (
    <button
      onClick={handleBack}
      className="mb-4 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors"
      style={{ color: "#475569", background: "transparent" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#F1F5F9";
        (e.currentTarget as HTMLElement).style.color = "#3673FC";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = "#475569";
      }}
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );
}
