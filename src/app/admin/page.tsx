import { PortalDashboard } from "@/components/portal-dashboard";
import { adminNavigation } from "@/config/navigation";

const descriptions: Record<string, string> = {
  Members: "Verify pending registrations and manage member access status.",
  "CSV imports": "Validate savings and share capital CSVs before committing snapshots.",
  "Loan reviews": "Review applications, update statuses, and preserve status history.",
  "Knowledge base": "Upload BMPC documents and sync the OpenAI vector store.",
  Notifications: "Create in-app notifications from operational events."
};

export default function AdminDashboardPage() {
  return (
    <PortalDashboard
      eyebrow="Admin portal"
      title="Operations dashboard"
      description="Admin workflows are separated from member screens and designed for audit logging, validation, and RLS-aware access."
      items={adminNavigation.map((item) => ({
        ...item,
        description: descriptions[item.label]
      }))}
    />
  );
}
