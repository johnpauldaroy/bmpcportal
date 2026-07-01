import Link from "next/link";
import { ShieldCheck } from "@/components/ui/icon";
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#1F52F1] text-white shadow-sm">
              <ShieldCheck aria-hidden size={19} />
            </span>
            <span>
              <span className="block text-sm font-bold leading-5 text-[#0F172A]">BMPC Portal</span>
              <span className="block text-xs text-[#475569]">Barbaza MPC</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#F1F5F9] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#1B308D] px-4 py-2 text-sm font-medium text-white hover:bg-[#1933B4] transition-colors"
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
