export type LoanProductChoice = {
  id?: string;
  code: string;
  name: string;
  description: string | null;
  min_amount: number;
  max_amount: number;
  min_term_months: number;
  max_term_months: number;
  interest_rate_percent: number | null;
};

// Fallback list mirroring the BMPC "Loan Applied For" categories, used when the
// loan_products table has not been seeded yet.
const fallbackLoanType = (code: string, name: string): LoanProductChoice => ({
  code,
  name,
  description: null,
  min_amount: 1000,
  max_amount: 1000000,
  min_term_months: 1,
  max_term_months: 60,
  interest_rate_percent: null
});

export const defaultLoanProductChoices: LoanProductChoice[] = [
  fallbackLoanType("MULTI_PURPOSE", "Multi-Purpose Loan"),
  fallbackLoanType("SALARY", "Salary Loan"),
  fallbackLoanType("FAXCOM", "FAXCOM Loan"),
  fallbackLoanType("HONORARIUM", "Honorarium Loan"),
  fallbackLoanType("MEDAP", "MEDAP"),
  fallbackLoanType("PENSION", "Pension Loan"),
  fallbackLoanType("ENHANCED_EDUCATIONAL", "Enhanced Educational Loan"),
  fallbackLoanType("OTHERS", "Others")
];
