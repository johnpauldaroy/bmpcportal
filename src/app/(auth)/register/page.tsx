import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RegisterForm } from "@/features/auth/register-form";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function RegisterPage() {
  const admin = createAdminClient();
  const { data: branches } = await admin
    .from("branches")
    .select("code, name")
    .eq("is_active", true)
    .order("name");

  return (
    <AppShell>
      <div className="mx-auto max-w-md rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Member registration</h1>
        <p className="mt-2 text-sm leading-6 text-[#475569]">
          First, verify your membership using your CIF key and branch. Then complete
          your account details. Access is activated after the cooperative confirms your record.
        </p>
        <RegisterForm branches={branches ?? []} />
        <p className="mt-4 text-sm text-[#475569]">
          Already registered?{" "}
          <Link className="font-semibold text-[#3673FC]" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
