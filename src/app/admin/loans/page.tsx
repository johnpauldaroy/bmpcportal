import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { AdminLoanApplicationsTable } from "@/features/loans/admin-loan-applications-table";
import { getAdminLoanApplications } from "@/features/loans/data";

export default async function AdminLoansPage() {
  const applications = await getAdminLoanApplications();

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader
          title="Loan reviews"
          description="Review member loan applications. Every decision is recorded in status history and the audit log."
          showBack={false}
        />
        <ButtonLink href="/admin/loans/settings" intent="secondary" className="mt-1 shrink-0">
          <Settings2 aria-hidden size={16} />
          Loan Settings
        </ButtonLink>
      </div>
      <AdminLoanApplicationsTable applications={applications} />
    </>
  );
}
