import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SignOutLinkButton } from "@/features/auth/sign-out-link-button";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPendingPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.status === "active") {
      redirect(["staff", "admin"].includes(profile.role) ? "/admin" : "/member");
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-xl rounded-xl border border-[#d8e1ea] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fff3d9] text-[#b8811f]">
          <Clock3 aria-hidden size={24} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-[#10233f]">
          Account pending verification
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#5f6c7b]">
          A BMPC staff member must verify and activate your member profile before
          portal access is enabled. Contact the cooperative office if your access
          should already be active.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <SignOutLinkButton />
          <Link className="inline-flex items-center text-sm font-semibold text-[#136f63]" href="/">
            Return home
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
