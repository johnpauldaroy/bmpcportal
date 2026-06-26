import { PageHeader } from "@/components/page-header";
import { LoanApplicationForm } from "@/features/loans/loan-application-form";
import { getActiveLoanProducts, getActiveBranches } from "@/features/loans/data";

export default async function NewLoanApplicationPage() {
  const [products, branches] = await Promise.all([
    getActiveLoanProducts(),
    getActiveBranches()
  ]);

  return (
    <>
      <PageHeader
        title="New loan application"
        description="Complete the loan information, your statement, co-makers, and ID verification, then submit for review."
      />
      <LoanApplicationForm products={products} branches={branches} />
    </>
  );
}
