import Link from "next/link";
import { ArrowRight } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { LoanApplicationWithDetails } from "./data";
import { formatDateTime, formatPeso, loanStatusLabel, loanStatusTone } from "./loan-utils";

export function AdminLoanApplicationsTable({
  applications
}: {
  applications: LoanApplicationWithDetails[];
}) {
  if (applications.length === 0) {
    return (
      <EmptyState
        title="No loan applications yet"
        text="Applications submitted by members will queue here for review."
      />
    );
  }

  return (
    <section className="grid gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
      <div className="overflow-x-auto rounded-md border border-[#E2E8F0]">
        <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-sm">
          <thead className="bg-[#F1F5F9] text-[#334155]">
            <tr>
              <th className="px-3 py-2 font-semibold">Application</th>
              <th className="px-3 py-2 font-semibold">Member</th>
              <th className="px-3 py-2 font-semibold">Amount</th>
              <th className="px-3 py-2 font-semibold">Submitted</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {applications.map((application) => (
              <tr key={application.id}>
                <td className="px-3 py-2">
                  <p className="font-semibold text-[#0F172A]">{application.application_number}</p>
                  <p className="text-xs text-[#475569]">{application.product?.name ?? "Unknown"}</p>
                </td>
                <td className="px-3 py-2">
                  <p className="text-[#0F172A]">{application.member?.fullName ?? "Unknown member"}</p>
                  {application.member?.memberNumber ? (
                    <p className="text-xs text-[#475569]">{application.member.memberNumber}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-semibold text-[#0F172A]">
                  {formatPeso(application.amount_requested)}
                  <span className="block text-xs font-normal text-[#475569]">
                    {application.preferred_term_months} months
                  </span>
                </td>
                <td className="px-3 py-2 text-[#475569]">
                  {formatDateTime(application.submitted_at)}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge tone={loanStatusTone(application.status)}>
                    {loanStatusLabel[application.status]}
                  </StatusBadge>
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/loans/${application.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-semibold text-[#3673FC] transition hover:bg-[#F1F5F9]"
                  >
                    View details
                    <ArrowRight aria-hidden size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
