import { PageHeader } from "@/components/page-header";
import { AdminLoanApplicationsTable } from "@/features/loans/admin-loan-applications-table";
import { getAdminLoanApplications } from "@/features/loans/data";

export default async function AdminLoansPage() {
  const applications = await getAdminLoanApplications();

  return (
    <>
      <PageHeader
        title="Loan reviews"
        description="Review member loan applications. Every decision is recorded in status history and the audit log."
        showBack={false}
      />
      <AdminLoanApplicationsTable applications={applications} />
    </>
  );
}
