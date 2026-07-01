"use client";

import { Download, Plus, Send, Trash2, X } from "@/components/ui/icon";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  loanPurposeOptions,
  securityOfferedOptions,
  type Option
} from "./application-options";
import type { LoanAgreement, LoanApplicationWithDetails } from "./data";
import { formatPeso } from "./loan-utils";
import { defaultLoanProductChoices } from "./product-options";

const inputClass =
  "min-h-10 rounded-lg border border-[#CBD5E1] outline-none transition-colors focus:border-[#3673FC] focus:ring-2 focus:ring-[#3673FC]/20 bg-white px-3 text-sm text-[#1E293B]";
const readOnlyInputClass = `${inputClass} bg-[#F8FAFC] text-[#475569]`;
const labelClass = "grid gap-1 text-xs font-bold uppercase text-[#0F172A]";
const checkboxClass = "size-4 rounded border-[#CBD5E1] text-[#3673FC]";

type OtherDeductionRow = { key: string; label: string; amount: string };

const num = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fullName = (...parts: Array<string | null | undefined>) => parts.filter(Boolean).join(" ");
const optionLabel = (options: Option[], value: string | null | undefined) =>
  options.find((option) => option.value === value)?.label ?? value ?? "";
const uniqueByName = <T extends { name: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function AdminAgreementPanel({
  application,
  agreement
}: {
  application: LoanApplicationWithDetails;
  agreement: LoanAgreement | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Live preview of deductions/net as staff type.
  const [amount, setAmount] = useState(
    Number(agreement?.amount_of_loan ?? application.amount_requested ?? 0)
  );
  const [retentionPct, setRetentionPct] = useState(Number(agreement?.loan_retention_percent ?? 0));
  const [retentionAmount, setRetentionAmount] = useState(Number(agreement?.loan_retention_amount ?? 0));
  const [serviceFeePct, setServiceFeePct] = useState(Number(agreement?.service_fee_percent ?? 0));
  const [serviceFeeAmount, setServiceFeeAmount] = useState(Number(agreement?.service_fee_amount ?? 0));
  const [filingFee, setFilingFee] = useState(Number(agreement?.filing_fee ?? 30));
  const [otherDeductions, setOtherDeductions] = useState<OtherDeductionRow[]>(() => {
    const existing = (agreement?.other_deductions ?? []).map((d) => ({
      key: crypto.randomUUID(),
      label: d.label ?? "",
      amount: String(d.amount ?? "")
    }));
    return existing.length > 0 ? existing : [{ key: crypto.randomUUID(), label: "", amount: "" }];
  });

  const otherTotal = otherDeductions.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  function patchDeduction(key: string, next: Partial<Omit<OtherDeductionRow, "key">>) {
    setOtherDeductions((rows) => rows.map((row) => (row.key === key ? { ...row, ...next } : row)));
  }
  function addDeduction() {
    setOtherDeductions((rows) =>
      rows.length >= 10 ? rows : [...rows, { key: crypto.randomUUID(), label: "", amount: "" }]
    );
  }
  function removeDeduction(key: string) {
    setOtherDeductions((rows) => {
      const next = rows.filter((row) => row.key !== key);
      return next.length > 0 ? next : [{ key: crypto.randomUUID(), label: "", amount: "" }];
    });
  }

  const { totalDeduction, netProceeds } = useMemo(() => {
    const retention = retentionAmount || (amount * retentionPct) / 100;
    const serviceFee = serviceFeeAmount || (amount * serviceFeePct) / 100;
    const total = retention + serviceFee + filingFee + otherTotal;
    return { totalDeduction: total, netProceeds: Math.max(0, amount - total) };
  }, [amount, retentionPct, retentionAmount, serviceFeePct, serviceFeeAmount, filingFee, otherTotal]);
  const loanProductOptions = uniqueByName([
    ...(application.product ? [application.product] : []),
    ...defaultLoanProductChoices
  ]);

  async function sendAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const fd = new FormData(event.currentTarget);
    const cleanedDeductions = otherDeductions
      .map((row) => ({ label: row.label.trim(), amount: Number(row.amount) || 0 }))
      .filter((row) => row.label || row.amount);
    const security = fd.getAll("security").map(String).filter(Boolean).join(", ");
    const payload = {
      amountOfLoan: num(fd.get("amountOfLoan")),
      loanRetentionPercent: num(fd.get("loanRetentionPercent")),
      loanRetentionAmount: num(fd.get("loanRetentionAmount")) || undefined,
      serviceFeePercent: num(fd.get("serviceFeePercent")),
      serviceFeeAmount: num(fd.get("serviceFeeAmount")) || undefined,
      filingFee: num(fd.get("filingFee")),
      otherDeductions: cleanedDeductions,
      typeOfLoan: String(fd.get("typeOfLoan") ?? ""),
      purposeOfLoan: String(fd.get("purposeOfLoan") ?? ""),
      termMonths: num(fd.get("termMonths")) || undefined,
      interestRatePercent: num(fd.get("interestRatePercent")) || undefined,
      security,
      monthlyAmortization: num(fd.get("monthlyAmortization")) || undefined,
      loanDate: String(fd.get("loanDate") ?? ""),
      maturityDate: String(fd.get("maturityDate") ?? ""),
      firstPaymentDue: String(fd.get("firstPaymentDue") ?? "")
    };

    try {
      const res = await fetch(`/api/admin/loans/${application.id}/agreement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error ?? "Failed to send agreement.");
      setMessage("Agreement sent to the maker.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send agreement.");
    } finally {
      setBusy(false);
    }
  }

  const form = (
    <form className="grid gap-5" onSubmit={sendAgreement}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#1933B4]">Loan agreement</h3>
        {agreement ? (
          <StatusBadge tone={agreement.status === "accepted" ? "success" : agreement.status === "sent" ? "warning" : "neutral"}>
            {agreement.status}
          </StatusBadge>
        ) : null}
      </div>

      {agreement?.status === "accepted" ? (
        <p className="rounded-lg bg-[#D1FAE5] px-3 py-2 text-sm text-[#047857]">
          Accepted by the maker{agreement.accepted_at ? ` on ${new Date(agreement.accepted_at).toLocaleDateString()}` : ""}.
        </p>
      ) : null}
      {message ? <p className="text-sm font-medium text-[#334155]">{message}</p> : null}

      <div className="grid gap-4">
        <label className={labelClass}>
          Policy number
          <input className={readOnlyInputClass} value={application.application_number} readOnly />
        </label>

        <div className="grid gap-2">
          <p className="text-xs font-bold uppercase text-[#0F172A]">Borrower&apos;s name *</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <input className={readOnlyInputClass} value={application.applicant_first_name ?? ""} readOnly />
            <input className={readOnlyInputClass} value={application.applicant_middle_name ?? ""} readOnly />
            <input className={readOnlyInputClass} value={application.applicant_last_name ?? ""} readOnly />
          </div>
        </div>

        <label className={labelClass}>
          Address *
          <input className={readOnlyInputClass} value={application.present_address ?? ""} readOnly />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Co-maker name (1) *
            <input
              className={readOnlyInputClass}
              value={fullName(
                application.coMakers[0]?.first_name,
                application.coMakers[0]?.middle_name,
                application.coMakers[0]?.last_name
              )}
              readOnly
            />
          </label>
          <label className={labelClass}>
            Co-maker name (2) *
            <input
              className={readOnlyInputClass}
              value={fullName(
                application.coMakers[1]?.first_name,
                application.coMakers[1]?.middle_name,
                application.coMakers[1]?.last_name
              )}
              readOnly
            />
          </label>
        </div>

        <label className={labelClass}>
          Loan granted in numbers *
          <input
            name="amountOfLoan"
            type="number"
            step="0.01"
            className={inputClass}
            defaultValue={amount}
            onChange={(e) => setAmount(num(e.currentTarget.value))}
          />
        </label>

        <label className={labelClass}>
          Loan granted in words *
          <input className={readOnlyInputClass} value={application.amount_in_words ?? ""} readOnly />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Type of loan *
            <select
              name="typeOfLoan"
              className={inputClass}
              defaultValue={agreement?.type_of_loan ?? application.product?.name ?? ""}
            >
              <option value="">Select</option>
              {loanProductOptions.map((product) => (
                <option key={product.code} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Loan purpose *
            <select
              name="purposeOfLoan"
              className={inputClass}
              defaultValue={agreement?.purpose_of_loan ?? optionLabel(loanPurposeOptions, application.purpose)}
            >
              <option value="">Select</option>
              {loanPurposeOptions.map((option) => (
                <option key={option.value} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={labelClass}>
          Interest rate *
          <input
            name="interestRatePercent"
            type="number"
            step="0.01"
            className={inputClass}
            defaultValue={Number(agreement?.interest_rate_percent ?? application.product?.interest_rate_percent ?? 0) || ""}
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-xs font-bold uppercase text-[#0F172A]">Security *</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {securityOfferedOptions.map((option) => {
              const agreementSecurity = agreement?.security?.toLowerCase() ?? "";
              const checked =
                agreementSecurity.includes(option.label.toLowerCase()) ||
                application.security_offered.includes(option.value as never);
              return (
                <label key={option.value} className="flex items-center gap-2 text-sm text-[#475569]">
                  <input
                    name="security"
                    type="checkbox"
                    value={option.label}
                    defaultChecked={checked}
                    className={checkboxClass}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Loan term *
            <input
              name="termMonths"
              type="number"
              className={inputClass}
              placeholder="How many months?"
              defaultValue={agreement?.term_months ?? application.preferred_term_months ?? ""}
            />
          </label>
          <label className={labelClass}>
            Branch *
            <input className={readOnlyInputClass} value={application.branch?.name ?? ""} readOnly />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Loan retention *
            <input
              name="loanRetentionPercent"
              type="number"
              step="0.01"
              placeholder="%"
              className={inputClass}
              defaultValue={retentionPct || ""}
              onChange={(e) => setRetentionPct(num(e.currentTarget.value))}
            />
          </label>
          <label className={`${labelClass} sm:pt-5`}>
            <span className="sr-only">Loan retention amount</span>
            <input
              name="loanRetentionAmount"
              type="number"
              step="0.01"
              placeholder="PHP"
              className={inputClass}
              defaultValue={retentionAmount || ""}
              onChange={(e) => setRetentionAmount(num(e.currentTarget.value))}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Service fee *
            <input
              name="serviceFeePercent"
              type="number"
              step="0.01"
              placeholder="%"
              className={inputClass}
              defaultValue={serviceFeePct || ""}
              onChange={(e) => setServiceFeePct(num(e.currentTarget.value))}
            />
          </label>
          <label className={`${labelClass} sm:pt-5`}>
            <span className="sr-only">Service fee amount</span>
            <input
              name="serviceFeeAmount"
              type="number"
              step="0.01"
              placeholder="PHP"
              className={inputClass}
              defaultValue={serviceFeeAmount || ""}
              onChange={(e) => setServiceFeeAmount(num(e.currentTarget.value))}
            />
          </label>
        </div>

        <label className={labelClass}>
          Filling fee *
          <input
            name="filingFee"
            type="number"
            step="0.01"
            className={inputClass}
            defaultValue={filingFee}
            onChange={(e) => setFilingFee(num(e.currentTarget.value))}
          />
        </label>

        <div className="grid gap-2">
          <p className="text-xs font-bold uppercase text-[#0F172A]">Others (specify)</p>
          {otherDeductions.map((row) => (
            <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                aria-label="Other deduction label"
                className={inputClass}
                value={row.label}
                onChange={(e) => patchDeduction(row.key, { label: e.currentTarget.value })}
              />
              <input
                aria-label="Other deduction amount"
                type="number"
                step="0.01"
                placeholder="PHP"
                className={inputClass}
                value={row.amount}
                onChange={(e) => patchDeduction(row.key, { amount: e.currentTarget.value })}
              />
              <button
                type="button"
                onClick={() => removeDeduction(row.key)}
                aria-label="Remove deduction"
                className="focus-ring flex min-h-10 items-center justify-center rounded-lg border border-[#CBD5E1] px-3 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#b42318]"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {otherDeductions.length < 10 ? (
            <button
              type="button"
              onClick={addDeduction}
              className="focus-ring inline-flex items-center gap-1.5 self-start rounded-lg px-1 py-1 text-sm font-medium text-[#3673FC] hover:underline"
            >
              <Plus size={16} />
              Add more
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Monthly amortization
            <input
              name="monthlyAmortization"
              type="number"
              step="0.01"
              className={inputClass}
              defaultValue={agreement?.monthly_amortization ?? ""}
            />
          </label>
          <label className={labelClass}>
            First payment due
            <input
              name="firstPaymentDue"
              type="date"
              className={inputClass}
              defaultValue={agreement?.first_payment_due ?? application.first_payment_due ?? ""}
            />
          </label>
          <label className={labelClass}>
            Loan date
            <input name="loanDate" type="date" className={inputClass} defaultValue={agreement?.loan_date ?? ""} />
          </label>
          <label className={labelClass}>
            Maturity date
            <input name="maturityDate" type="date" className={inputClass} defaultValue={agreement?.maturity_date ?? ""} />
          </label>
        </div>
      </div>

      <div className="rounded-lg bg-[#F1F5F9] px-3 py-2 text-sm">
        <div className="flex justify-between text-[#475569]">
          <span>Total deduction</span>
          <span className="font-semibold text-[#0F172A]">{formatPeso(totalDeduction)}</span>
        </div>
        <div className="mt-1 flex justify-between text-[#475569]">
          <span>Net loan proceeds</span>
          <span className="font-semibold text-[#047857]">{formatPeso(netProceeds)}</span>
        </div>
      </div>

      <Button type="submit" disabled={busy}>
        <Send aria-hidden size={18} />
        {busy ? "Sending..." : agreement?.status === "sent" ? "Resend agreement" : "Send agreement to maker"}
      </Button>

      {agreement ? (
        <a
          href={`/api/admin/loans/${application.id}/agreement/pdf`}
          className="focus-ring md-interactive md-state-layer inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-6 py-2.5 text-sm font-medium tracking-[0.02em] text-[#1E293B] hover:bg-[#F1F5F9]"
        >
          <Download aria-hidden size={18} />
          Download agreement PDF
        </a>
      ) : null}
    </form>
  );

  return (
    <>
      <section className="grid h-fit gap-3 rounded-xl border border-[#E2E8F0] bg-white p-5 md-elevation-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#1933B4]">
            Loan agreement
          </h3>
          {agreement ? (
            <StatusBadge
              tone={
                agreement.status === "accepted"
                  ? "success"
                  : agreement.status === "sent"
                    ? "warning"
                    : "neutral"
              }
            >
              {agreement.status}
            </StatusBadge>
          ) : null}
        </div>

        {agreement?.status === "accepted" ? (
          <p className="rounded-lg bg-[#D1FAE5] px-3 py-2 text-sm text-[#047857]">
            Accepted by the maker
            {agreement.accepted_at ? ` on ${new Date(agreement.accepted_at).toLocaleDateString()}` : ""}.
          </p>
        ) : (
          <p className="text-sm text-[#475569]">
            Prepare the agreement terms and send them to the maker for review and signature.
          </p>
        )}

        <Button type="button" onClick={() => setOpen(true)}>
          <Send aria-hidden size={18} />
          {agreement?.status === "sent" ? "Resend agreement" : "Send agreement to maker"}
        </Button>

        {agreement ? (
          <a
            href={`/api/admin/loans/${application.id}/agreement/pdf`}
            className="focus-ring md-interactive md-state-layer inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-6 py-2.5 text-sm font-medium tracking-[0.02em] text-[#1E293B] hover:bg-[#F1F5F9]"
          >
            <Download aria-hidden size={18} />
            Download agreement PDF
          </a>
        ) : null}
      </section>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B308D]/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loan-agreement-modal-title"
        >
          <div className="grid max-h-[calc(100vh-2rem)] w-full max-w-4xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <h2 id="loan-agreement-modal-title" className="text-base font-semibold text-[#0F172A]">
                  Loan agreement
                </h2>
                <p className="mt-0.5 text-sm text-[#475569]">
                  {application.application_number}
                </p>
              </div>
              <button
                type="button"
                className="focus-ring md-interactive md-state-layer inline-flex size-10 items-center justify-center rounded-full text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                onClick={() => setOpen(false)}
                aria-label="Close loan agreement form"
              >
                <X aria-hidden size={20} />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain p-5">{form}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
