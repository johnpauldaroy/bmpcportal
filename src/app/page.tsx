import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "Sign In" };

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7f5] via-[#f7f9fb] to-[#edf3f8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-[#136f63] text-white shadow-lg">
              <ShieldCheck aria-hidden size={28} />
            </span>
            <div>
              <p className="text-lg font-bold text-[#10233f]">BMPC Portal</p>
              <p className="text-xs text-[#5f6c7b]">Barbaza Multi-Purpose Cooperative</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#d8e1ea] bg-white p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#10233f]">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-[#5f6c7b]">
              Sign in to your BMPC member account.
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-[#5f6c7b]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#136f63] hover:underline">
                Create one here
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#8a99a8]">
          Need help? Contact BMPC at your nearest branch.
        </p>
      </div>
    </div>
  );
}
