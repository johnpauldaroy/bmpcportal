import { PageHeader } from "@/components/page-header";
import { AssistantPanel } from "@/features/ai/assistant-panel";

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        title="BMPC AI assistant"
        description="Ask questions about uploaded BMPC knowledge documents. The assistant cannot access member balances, loans, or private records."
      />
      <AssistantPanel />
    </>
  );
}
