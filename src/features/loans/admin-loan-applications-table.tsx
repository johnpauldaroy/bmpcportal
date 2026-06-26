import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    <section className="grid gap-4 rounded-lg border border-[#d8e1ea] bg-white p-5 shadow-sm">
      <div className="overflow-x-auto rounded-md border border-[#e1e8ef]">
        <table className="min-w-full divide-y divide-[#e1e8ef] text-left text-sm">
          <thead className="bg-[#edf3f8] text-[#344456]">
            <tr>
              <th className="px-3 py-2 font-semibold">Application</th>
              <th className="px-3 py-2 font-semibold">Member</th>
              <th className="px-3 py-2 font-semibold">Amount</th>
              <th className="px-3 py-2 font-semibold">Submitted</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1e8ef]">
            {applications.map((application) => (
              <tr key={application.id}>
                <td className="px-3 py-2">
                  <p className="font-semibold text-[#10233f]">{application.application_number}</p>
                  <p className="text-xs text-[#5f6c7b]">{application.product?.name ?? "Unknown"}</p>
                </td>
                <td className="px-3 py-2">
                  <p className="text-[#10233f]">{application.member?.fullName ?? "Unknown member"}</p>
                  {application.member?.memberNumber ? (
                    <p className="text-xs text-[#5f6c7b]">{application.member.memberNumber}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-semibold text-[#10233f]">
                  {formatPeso(application.amount_requested)}
                  <span className="block text-xs font-normal text-[#5f6c7b]">
                    {application.preferred_term_months} months
                  </span>
                </td>
                <td className="px-3 py-2 text-[#5f6c7b]">
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
                    className="inline-flex items-center gap-1 rounded-md border border-[#cbd7e3] bg-white px-3 py-1.5 text-sm font-semibold text-[#136f63] transition hover:bg-[#edf3f8]"
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
