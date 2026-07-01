import { PageHeader } from "@/components/page-header";
import { LoanApplicationCard } from "@/features/loans/loan-application-card";
import { MemberAgreementReview } from "@/features/loans/member-agreement-review";
import { getMemberLoanApplications, getMemberLoanAgreements } from "@/features/loans/data";

export default async function LoansPage() {
  const [applications, agreements] = await Promise.all([
    getMemberLoanApplications(),
    getMemberLoanAgreements()
  ]);

  // Surface agreements that need attention (sent) or were accepted, newest first.
  const appById = new Map(applications.map((a) => [a.id, a]));
  const visibleAgreements = agreements
    .filter((ag) => ag.status === "sent" || ag.status === "accepted")
    .sort((a, b) => (a.status === "sent" ? -1 : 1) - (b.status === "sent" ? -1 : 1));

  return (
    <>
      <PageHeader
        title="Loans"
        description="Submit loan applications and track every status change through review and release."
      />
      {visibleAgreements.length > 0 && (
        <div className="mb-6 grid gap-4">
          {visibleAgreements.map((ag) => {
            const app = appById.get(ag.loan_application_id);
            if (!app) return null;
            return (
              <MemberAgreementReview
                key={ag.id}
                applicationId={ag.loan_application_id}
                applicationNumber={app.application_number}
                agreement={ag}
              />
            );
          })}
        </div>
      )}
      <LoanApplicationCard applications={applications} />
    </>
  );
}
