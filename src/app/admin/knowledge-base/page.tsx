import { PageHeader } from "@/components/page-header";
import { AdminKnowledgePanel } from "@/features/knowledge/admin-knowledge-panel";
import { createClient } from "@/lib/supabase/server";

export default async function AdminKnowledgeBasePage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("knowledge_documents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Knowledge base"
        description="Upload approved BMPC documents. Only these records may be used to ground assistant answers."
      />
      <AdminKnowledgePanel documents={documents ?? []} />
    </>
  );
}
