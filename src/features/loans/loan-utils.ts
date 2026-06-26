import type { LoanStatus } from "@/types/database";

export const loanStatusLabel: Record<LoanStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  needs_more_info: "Needs more info",
  approved: "Approved",
  released: "Released",
  rejected: "Rejected",
  cancelled: "Cancelled"
};

export type ReviewableLoanStatus = Exclude<LoanStatus, "draft" | "submitted">;

export const reviewableLoanStatuses: ReviewableLoanStatus[] = [
  "under_review",
  "needs_more_info",
  "approved",
  "released",
  "rejected",
  "cancelled"
];

export function loanStatusTone(status: LoanStatus) {
  if (status === "approved" || status === "released") return "success";
  if (status === "rejected" || status === "cancelled") return "danger";
  if (status === "submitted" || status === "under_review" || status === "needs_more_info") {
    return "warning";
  }
  return "neutral";
}

export function formatPeso(value: number | string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(Number(value));
}

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen"
];
const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety"
];
const SCALES = ["", "thousand", "million", "billion", "trillion"];

function threeDigitsToWords(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;

  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} hundred`);
  }
  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(ones > 0 ? `${TENS[tens]}-${ONES[ones]}` : TENS[tens]);
    }
  }
  return parts.join(" ");
}

function wholeNumberToWords(value: number): string {
  if (value === 0) return "zero";

  const groups: number[] = [];
  let remaining = value;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    if (groups[i] === 0) continue;
    const scale = SCALES[i] ? ` ${SCALES[i]}` : "";
    words.push(`${threeDigitsToWords(groups[i])}${scale}`);
  }
  return words.join(" ");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Converts a peso amount into the words form used on loan documents, e.g.
 * 5000 -> "Five thousand pesos only", 1250.50 -> "One thousand two hundred
 * fifty pesos and fifty centavos only". Returns "" for blank/invalid input.
 */
export function pesosToWords(input: number | string): string {
  if (typeof input === "string" && input.trim() === "") return "";
  const amount = typeof input === "string" ? Number(input.replace(/,/g, "")) : input;
  if (!Number.isFinite(amount) || amount < 0) return "";

  const pesos = Math.floor(amount);
  const centavos = Math.round((amount - pesos) * 100);

  const pesoWords = `${wholeNumberToWords(pesos)} ${pesos === 1 ? "peso" : "pesos"}`;
  const result =
    centavos > 0
      ? `${pesoWords} and ${wholeNumberToWords(centavos)} ${centavos === 1 ? "centavo" : "centavos"} only`
      : `${pesoWords} only`;

  return capitalize(result);
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
