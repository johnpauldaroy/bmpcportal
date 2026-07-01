import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AdminLoanReviewPanel } from "@/features/loans/admin-loan-review-panel";
import { getAdminLoanApplication, getAdminLoanAgreement } from "@/features/loans/data";

export default async function AdminLoanDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getAdminLoanApplication(id);

  if (!application) {
    notFound();
  }

  const agreement = await getAdminLoanAgreement(id);

  return (
    <>
      <PageHeader
        title={`Application ${application.application_number}`}
        description="Review the applicant's details, status history, and record a decision."
        backHref="/admin/loans"
      />
      <AdminLoanReviewPanel application={application} agreement={agreement} />
    </>
  );
}
