"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { LoanApplicationWithDetails } from "./data";
import { LoanApplicationDetailTabs } from "./loan-application-card";
import {
  formatPeso,
  loanStatusLabel,
  loanStatusTone,
  reviewableLoanStatuses,
  type ReviewableLoanStatus
} from "./loan-utils";

export function AdminLoanReviewPanel({
  application
}: {
  application: LoanApplicationWithDetails;
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
      <div className="overflow-hidden rounded-lg border border-[#d8e1ea] bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e1e8ef] px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[#10233f]">
                {application.application_number}
              </h2>
              <StatusBadge tone={loanStatusTone(application.status)}>
                {loanStatusLabel[application.status]}
              </StatusBadge>
            </div>
            <p className="mt-1 text-sm text-[#5f6c7b]">
              {application.member?.fullName ?? "Unknown member"}
              {application.member?.memberNumber ? ` (${application.member.memberNumber})` : ""}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl font-semibold text-[#10233f]">
              {formatPeso(application.amount_requested)}
            </p>
            <p className="mt-1 text-sm text-[#5f6c7b]">
              {application.preferred_term_months} months
            </p>
          </div>
        </div>

        <LoanApplicationDetailTabs
          application={application}
          attachmentViewBase="/api/admin/loans/attachments"
        />
      </div>

      <form
        className="grid h-fit gap-3 rounded-lg border border-[#d8e1ea] bg-white p-5 shadow-sm"
        onSubmit={updateStatus}
      >
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#1e4e79]">Record decision</h3>
        {message ? <p className="text-sm font-medium text-[#344456]">{message}</p> : null}
        <label className="grid gap-2 text-sm font-semibold text-[#344456]">
          Review status
          <select
            name="status"
            className="min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm text-[#17263a]"
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

        <label className="grid gap-2 text-sm font-semibold text-[#344456]">
          Review note
          <textarea
            name="note"
            className="min-h-28 rounded-md border border-[#cbd7e3] bg-white px-3 py-2 text-sm leading-6 text-[#17263a]"
            defaultValue={application.decision_note ?? ""}
            maxLength={1000}
          />
        </label>

        <Button type="submit" disabled={busy}>
          <CheckCircle2 aria-hidden size={18} />
          {busy ? "Saving..." : "Save review"}
        </Button>
      </form>
    </div>
  );
}
