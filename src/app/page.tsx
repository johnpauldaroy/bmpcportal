import Link from "next/link";
import { ShieldCheck } from "@/components/ui/icon";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "Sign In" };

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DAE7FF] via-[#F8FAFC] to-[#F1F5F9] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-[#3673FC] text-white shadow-lg">
              <ShieldCheck aria-hidden size={28} />
            </span>
            <div>
              <p className="text-lg font-bold text-[#0F172A]">BMPC Portal</p>
              <p className="text-xs text-[#475569]">Barbaza Multi-Purpose Cooperative</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#0F172A]">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              Sign in to your BMPC member account.
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-[#475569]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#3673FC] hover:underline">
                Create one here
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#94A3B8]">
          Need help? Contact BMPC at your nearest branch.
        </p>
      </div>
    </div>
  );
}
