import { PageHeader } from "@/components/page-header";
import { AdminLoanProductPanel } from "@/features/loans/admin-loan-product-panel";
import { getAllLoanProducts } from "@/features/loans/data";

export default async function AdminLoanSettingsPage() {
  const products = await getAllLoanProducts();

  return (
    <>
      <PageHeader
        title="Loan settings"
        description="Manage the loan products that members can apply for. Active products appear on the member loan application form."
        backHref="/admin/loans"
      />
      <AdminLoanProductPanel products={products} />
    </>
  );
}
