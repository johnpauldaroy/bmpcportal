import { PageHeader } from "@/components/page-header";
import { CsvImportPanel } from "@/features/balances/csv-import-panel";
import { createClient } from "@/lib/supabase/server";

export default async function AdminImportsPage() {
  const supabase = await createClient();
  const { data: imports } = await supabase
    .from("snapshot_imports")
    .select(
      "id, type, effective_date, status, source_file_name, row_count, valid_row_count, invalid_row_count, total_amount, imported_by, committed_by, committed_at, created_at, error_summary"
    )
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <>
      <PageHeader
        title="CSV import center"
        description="Preview, validate, and commit savings or share capital snapshots by effective date."
      />
      <CsvImportPanel initialImports={imports ?? []} />
    </>
  );
}
