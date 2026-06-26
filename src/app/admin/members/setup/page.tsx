import { PageHeader } from "@/components/page-header";
import { CifSetupPanel } from "@/features/members/cif-setup-panel";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CifRecord } from "@/features/members/cif-setup-panel";

export const metadata = { title: "Member Setup" };

export default async function MemberSetupPage() {
  const admin = createAdminClient();

  const [{ data: branches }, { data: rawRecords }] = await Promise.all([
    admin.from("branches").select("id, code, name, is_active").order("name"),
    admin
      .from("cif_records")
      .select("id, cif_key, member_number, branch_id, is_claimed, claimed_at, created_at")
      .order("created_at", { ascending: false })
  ]);

  const branchMap = new Map((branches ?? []).map((b) => [b.id, { code: b.code, name: b.name }]));

  const records: CifRecord[] = (rawRecords ?? []).map((r) => ({
    ...r,
    branches: branchMap.get(r.branch_id) ?? null
  }));

  return (
    <>
      <PageHeader
        title="Member setup"
        description="Manage branches and pre-register CIF keys so members can verify their membership during registration."
        backHref="/admin/members"
      />
      <CifSetupPanel initialBranches={branches ?? []} initialRecords={records} />
    </>
  );
}
