import type { LoanAgreement, LoanApplicationWithDetails } from "@/features/loans/data";

/**
 * Pre-formats every value that the official BMPC agreement forms need into
 * plain strings, so the overlay renderer in loan-agreement-pdf.ts only has to
 * stamp them at coordinates. Mirrors the pattern in loan-pdf-fields.ts.
 */

function peso(v: number | string | null | undefined): string {
  if (v == null || v === "") return "";
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isNaN(n)
    ? ""
    : new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(n);
}

function fdate(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety"
];

function threeDigits(n: number): string {
  let out = "";
  if (n >= 100) {
    out += `${ONES[Math.floor(n / 100)]} Hundred`;
    n %= 100;
    if (n) out += " ";
  }
  if (n >= 20) {
    out += TENS[Math.floor(n / 10)];
    if (n % 10) out += `-${ONES[n % 10]}`;
  } else if (n > 0) {
    out += ONES[n];
  }
  return out;
}

/** Whole-peso amount in English words (e.g. "One Thousand Five Hundred"). */
export function amountInWords(value: number | string | null | undefined): string {
  let n = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(n) || n <= 0) return "";
  n = Math.floor(n);
  const scales = ["", " Thousand", " Million", " Billion"];
  const groups: number[] = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i]) parts.push(`${threeDigits(groups[i])}${scales[i]}`);
  }
  return parts.join(" ");
}

function fullName(...parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type AgreementFormFields = {
  borrowerName: string;
  address: string;
  coMakerNames: string[];
  spouseName: string;

  amountWords: string;
  amount: string;
  loanDate: string;
  maturityDate: string;
  firstPaymentDue: string;
  promissoryNoteNo: string;
  interestRate: string;
  monthlyAmortization: string;

  typeOfLoan: string;

  // Authority-to-deduct breakdown
  loanAmortization: string;
  interest: string;
  fines: string;
  capitalBuildUp: string;
  savingsDeposit: string;
  totalDeduction: string;
};

export function buildAgreementFormFields(
  application: LoanApplicationWithDetails,
  agreement: LoanAgreement
): AgreementFormFields {
  const ab = agreement.amort_breakdown ?? {};
  return {
    borrowerName: fullName(
      application.applicant_first_name,
      application.applicant_middle_name,
      application.applicant_last_name
    ),
    address: application.present_address ?? "",
    coMakerNames: application.coMakers.map((cm) =>
      fullName(cm.first_name, cm.middle_name, cm.last_name)
    ),
    spouseName: application.spouse_name ?? "",

    amountWords: amountInWords(agreement.amount_of_loan),
    amount: peso(agreement.amount_of_loan),
    loanDate: fdate(agreement.loan_date),
    maturityDate: fdate(agreement.maturity_date),
    firstPaymentDue: fdate(agreement.first_payment_due),
    promissoryNoteNo: application.application_number,
    interestRate:
      agreement.interest_rate_percent != null ? String(agreement.interest_rate_percent) : "",
    monthlyAmortization: peso(agreement.monthly_amortization),

    typeOfLoan: agreement.type_of_loan ?? application.product?.name ?? "",

    loanAmortization: peso(ab.loanAmortization),
    interest: peso(ab.interest),
    fines: peso(ab.fines),
    capitalBuildUp: peso(ab.capitalBuildUp),
    savingsDeposit: peso(ab.savingsDeposit),
    totalDeduction: peso(agreement.total_deduction)
  };
}
