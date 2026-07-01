"use client";

import { CheckCircle2, Download } from "@/components/ui/icon";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { LoanAgreement, LoanApplicationWithDetails } from "./data";
import { LoanApplicationDetailTabs } from "./loan-application-card";
import { AdminAgreementPanel } from "./admin-agreement-panel";
import {
  formatPeso,
  loanStatusLabel,
  loanStatusTone,
  reviewableLoanStatuses,
  type ReviewableLoanStatus
} from "./loan-utils";

export function AdminLoanReviewPanel({
  application,
  agreement
}: {
  application: LoanApplicationWithDetails;
  agreement: LoanAgreement | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const status = String(formData.get("status")) as ReviewableLoanStatus;
    const note = String(formData.get("note") ?? "");

    try {
      const response = await fetch(`/api/admin/loans/${application.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status, note })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error ?? "Status update failed.");
      }

      setMessage("Loan status updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white md-elevation-1">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[#0F172A]">
                {application.application_number}
              </h2>
              <StatusBadge tone={loanStatusTone(application.status)}>
                {loanStatusLabel[application.status]}
              </StatusBadge>
            </div>
            <p className="mt-1 text-sm text-[#475569]">
              {application.member?.fullName ?? "Unknown member"}
              {application.member?.memberNumber ? ` (${application.member.memberNumber})` : ""}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl font-semibold text-[#0F172A]">
              {formatPeso(application.amount_requested)}
            </p>
            <p className="mt-1 text-sm text-[#475569]">
              {application.preferred_term_months} months
            </p>
          </div>
        </div>

        <LoanApplicationDetailTabs
          application={application}
          attachmentViewBase="/api/admin/loans/attachments"
        />
      </div>

      <div className="grid h-fit gap-5">
        <form
          className="grid h-fit gap-3 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1"
          onSubmit={updateStatus}
        >
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#1933B4]">Record decision</h3>
          {message ? <p className="text-sm font-medium text-[#334155]">{message}</p> : null}
          <label className="grid gap-2 text-sm font-semibold text-[#334155]">
            Review status
            <select
              name="status"
              className="min-h-11 rounded-lg border border-[#CBD5E1] outline-none transition-colors focus:border-[#3673FC] focus:ring-2 focus:ring-[#3673FC]/20 bg-white px-3 text-sm text-[#1E293B]"
              defaultValue={
                application.status === "submitted" || application.status === "draft"
                  ? "under_review"
                  : application.status
              }
            >
              {reviewableLoanStatuses.map((status) => (
                <option key={status} value={status}>
                  {loanStatusLabel[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#334155]">
            Review note
            <textarea
              name="note"
              className="min-h-28 rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm leading-6 text-[#1E293B]"
              defaultValue={application.decision_note ?? ""}
              maxLength={1000}
            />
          </label>

          <Button type="submit" disabled={busy}>
            <CheckCircle2 aria-hidden size={18} />
            {busy ? "Saving..." : "Save review"}
          </Button>

          <a
            href={`/api/admin/loans/${application.id}/pdf`}
            className="focus-ring md-interactive md-state-layer inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-6 py-2.5 text-sm font-medium tracking-[0.02em] text-[#1E293B] hover:bg-[#F1F5F9]"
          >
            <Download aria-hidden size={18} />
            Download application PDF
          </a>
        </form>
        <AdminAgreementPanel application={application} agreement={agreement} />
      </div>
    </div>
  );
}
