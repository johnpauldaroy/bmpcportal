import { PageHeader } from "@/components/page-header";
import { LoanApplicationCard } from "@/features/loans/loan-application-card";
import { getMemberLoanApplications } from "@/features/loans/data";

export default async function LoansPage() {
  const applications = await getMemberLoanApplications();

  return (
    <>
      <PageHeader
        title="Loans"
        description="Submit loan applications and track every status change through review and release."
      />
      <LoanApplicationCard applications={applications} />
    </>
  );
}
