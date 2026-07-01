import { PageHeader } from "@/components/page-header";
import { AdminMemberPanel } from "@/features/members/admin-member-panel";
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
      <PageHeader
        title="Member verification"
        description="Review pending registrations, activate verified members, and suspend access when needed."
        showBack={false}
      />
      <AdminMemberPanel members={members ?? []} />
    </>
  );
}
