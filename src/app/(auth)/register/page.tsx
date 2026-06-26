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
      <div className="mx-auto max-w-md rounded-lg border border-[#d8e1ea] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#10233f]">Member registration</h1>
        <p className="mt-2 text-sm leading-6 text-[#5f6c7b]">
          First, verify your membership using your CIF key and branch. Then complete
          your account details. Access is activated after the cooperative confirms your record.
        </p>
        <RegisterForm branches={branches ?? []} />
        <p className="mt-4 text-sm text-[#5f6c7b]">
          Already registered?{" "}
          <Link className="font-semibold text-[#136f63]" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
