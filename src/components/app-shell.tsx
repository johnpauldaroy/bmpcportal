import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ShellLayout } from "@/components/shell-layout";

type AppShellProps = {
  children: React.ReactNode;
  variant?: "member" | "admin";
};

export function AppShell({ children, variant }: AppShellProps) {
  if (variant) {
    return <ShellLayout variant={variant}>{children}</ShellLayout>;
  }

  /* Public pages — simple top nav, no sidebar */
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <header className="sticky top-0 z-40 border-b border-[#d8e1ea] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#d99b2b] text-white shadow-sm">
              <ShieldCheck aria-hidden size={19} />
            </span>
            <span>
              <span className="block text-sm font-bold leading-5 text-[#10233f]">BMPC Portal</span>
              <span className="block text-xs text-[#5f6c7b]">Barbaza MPC</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#344456] hover:bg-[#edf3f8] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#0f2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a3a5c] transition-colors"
            >
              Join Now
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
