import Link from "next/link";
import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AdminMemberPanel } from "@/features/members/admin-member-panel";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, member_number, role, status, created_at")
    .eq("role", "member")
    .order("status", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader
          title="Member verification"
          description="Review pending registrations, activate verified members, and suspend access when needed."
          showBack={false}
        />
        <ButtonLink href="/admin/members/setup" intent="secondary" className="shrink-0 mt-1">
          <Settings2 aria-hidden size={16} />
          Member Setup
        </ButtonLink>
      </div>
      <AdminMemberPanel members={members ?? []} />
    </>
  );
}
