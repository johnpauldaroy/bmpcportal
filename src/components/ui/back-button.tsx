"use client";

import { ArrowLeft } from "lucide-react";
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
      style={{ color: "#5f6c7b", background: "transparent" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#edf3f8";
        (e.currentTarget as HTMLElement).style.color = "#10233f";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = "#5f6c7b";
      }}
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );
}
