"use client";

import { CheckCircle2, Download } from "@/components/ui/icon";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SignaturePad } from "./signature-pad";
import type { LoanAgreement } from "./data";
import { formatPeso } from "./loan-utils";

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-[#475569]">{label}</span>
      <span className={strong ? "font-semibold text-[#0F172A]" : "text-[#1E293B]"}>{value}</span>
    </div>
  );
}

export function MemberAgreementReview({
  applicationId,
  applicationNumber,
  agreement
}: {
  applicationId: string;
  applicationNumber: string;
  agreement: LoanAgreement;
}) {
  const router = useRouter();
  const [signature, setSignature] = useState<File | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const accepted = agreement.status === "accepted";

  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acknowledged) {
      setMessage("Please tick the acknowledgement box to accept.");
      return;
    }
    setBusy(true);
    setMessage(null);

    const fd = new FormData();
    fd.set("acknowledged", "true");
    if (signature) fd.set("signature", signature);

    try {
      const res = await fetch(`/api/member/loans/${applicationId}/agreement`, {
        method: "POST",
        body: fd
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error ?? "Could not accept agreement.");
      setMessage("Agreement accepted. Thank you!");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not accept agreement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#0F172A]">Loan Agreement</h3>
        <StatusBadge tone={accepted ? "success" : "warning"}>
          {accepted ? "Accepted" : "Awaiting your signature"}
        </StatusBadge>
      </div>
      <p className="mt-1 text-sm text-[#475569]">
        Application {applicationNumber}. Please review the terms below.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#E2E8F0] p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1933B4]">Disclosure</p>
          <Line label="Amount of loan" value={formatPeso(agreement.amount_of_loan)} />
          {agreement.loan_retention_amount != null && (
            <Line label="Loan retention" value={formatPeso(agreement.loan_retention_amount)} />
          )}
          {agreement.service_fee_amount != null && (
            <Line label="Service fee" value={formatPeso(agreement.service_fee_amount)} />
          )}
          <Line label="Filing fee" value={formatPeso(agreement.filing_fee)} />
          {(agreement.other_deductions ?? []).map((d, i) => (
            <Line key={i} label={d.label || "Other"} value={formatPeso(d.amount)} />
          ))}
          <div className="my-2 border-t border-[#E2E8F0]" />
          <Line label="Total deduction" value={formatPeso(agreement.total_deduction ?? 0)} strong />
          <Line label="Net loan proceeds" value={formatPeso(agreement.net_loan_proceeds ?? 0)} strong />
        </div>

        <div className="rounded-lg border border-[#E2E8F0] p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1933B4]">Promissory terms</p>
          {agreement.type_of_loan && <Line label="Type of loan" value={agreement.type_of_loan} />}
          {agreement.purpose_of_loan && <Line label="Purpose" value={agreement.purpose_of_loan} />}
          {agreement.term_months != null && <Line label="Term" value={`${agreement.term_months} months`} />}
          {agreement.interest_rate_percent != null && (
            <Line label="Interest rate" value={`${agreement.interest_rate_percent}% / month`} />
          )}
          {agreement.monthly_amortization != null && (
            <Line label="Monthly amortization" value={formatPeso(agreement.monthly_amortization)} />
          )}
          {agreement.security && <Line label="Security" value={agreement.security} />}
          {agreement.first_payment_due && (
            <Line label="First payment due" value={new Date(agreement.first_payment_due).toLocaleDateString()} />
          )}
          {agreement.maturity_date && (
            <Line label="Maturity date" value={new Date(agreement.maturity_date).toLocaleDateString()} />
          )}
        </div>
      </div>

      <a
        href={`/api/member/loans/${applicationId}/agreement/pdf`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#3673FC] hover:underline"
      >
        <Download size={15} />
        Download full agreement forms (PDF)
      </a>

      {accepted ? (
        <p className="mt-4 rounded-lg bg-[#D1FAE5] px-3 py-2 text-sm text-[#047857]">
          You accepted this agreement
          {agreement.accepted_at ? ` on ${new Date(agreement.accepted_at).toLocaleString()}` : ""}.
        </p>
      ) : (
        <form className="mt-5 grid gap-3 border-t border-[#E2E8F0] pt-5" onSubmit={accept}>
          <p className="text-sm font-semibold text-[#334155]">Sign to accept</p>
          <p className="text-xs text-[#475569]">
            Draw your signature below, then tick the box and accept.
          </p>
          <SignaturePad onChange={setSignature} />

          <label className="mt-1 flex items-start gap-2 text-sm text-[#334155]">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>
              I/We acknowledge receipt of this statement and fully agree to the terms and
              conditions of the loan, in accordance with BMPC&apos;s policies.
            </span>
          </label>

          {message ? <p className="text-sm font-medium text-[#334155]">{message}</p> : null}

          <Button type="submit" disabled={busy || !acknowledged}>
            <CheckCircle2 aria-hidden size={18} />
            {busy ? "Submitting..." : "Accept & sign agreement"}
          </Button>
        </form>
      )}
    </div>
  );
}
