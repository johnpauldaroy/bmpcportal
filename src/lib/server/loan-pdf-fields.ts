import type { LoanApplicationWithDetails, LoanCoMaker, LoanRealProperty } from "@/features/loans/data";
import {
  civilStatusOptions,
  dependentsOptions,
  employmentStatusOptions,
  loanPurposeOptions,
  loanTypeOptions,
  occupationOptions,
  propertyDescriptionOptions,
  securityOfferedOptions,
  validIdOptions,
  type Option
} from "@/features/loans/application-options";

/**
 * Maps a stored LoanApplicationWithDetails to the exact set of values that go
 * onto the official BMPC "Loan Application Form". This is the single source of
 * truth for what each blank on the paper form should contain; the PDF renderer
 * only deals with *where* to place these values, never *what* they are.
 */

function label(options: Option[], value: string | null | undefined): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}

function peso(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "";
  return new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function date(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function fullName(first?: string | null, middle?: string | null, last?: string | null): string {
  return [first, middle, last].map((p) => (p ?? "").trim()).filter(Boolean).join(" ");
}

/** A person block shared by applicant and co-makers on the form. */
export type PersonFields = {
  firstName: string;
  lastName: string;
  middleName: string;
  occupation: string;
  monthlySalary: string;
  employer: string;
  employmentStatus: string; // "permanent" | "contractual" | "temporary" | ""
  totalMonthlyIncome: string;
  civilStatus: string;
  spouseName: string;
  noOfDependents: string;
  spouseEmployer: string;
  spouseMonthlySalary: string;
  presentAddress: string;
  permanentAddress: string;
  phoneNo: string;
  email: string;
  taxIdentificationNumber: string;
  validId: string;
  idNumber: string;
  shareCapitalAsOf: string;
  shareCapitalAmount: string;
};

export type RealPropertyFields = {
  description: string;
  landTitleNumber: string;
  lotNumber: string;
  location: string;
  lotAreaSqm: string;
};

export type LoanFormFields = {
  branch: string;
  date: string;
  // Loan-applied-for checkboxes (which loan type is ticked).
  loanType: string; // machine code, e.g. "faxcom"
  loanTypeLabel: string;
  othersSpecify: string;
  // Loan terms.
  amountInWords: string;
  amountRequested: string;
  preferredTermMonths: string;
  firstPaymentDue: string;
  purpose: string;
  // Security offered — array of machine codes that should be ticked.
  securityOffered: string[];
  applicant: PersonFields;
  applicantProperties: RealPropertyFields[];
  coMaker1: PersonFields | null;
  coMaker1Properties: RealPropertyFields[];
  coMaker2: PersonFields | null;
  coMaker2Properties: RealPropertyFields[];
  // Signatures / certification (page 2).
  memberBorrowerName: string;
  coMaker1Name: string;
  coMaker2Name: string;
  applicationNumber: string;
};

function mapApplicant(app: LoanApplicationWithDetails): PersonFields {
  const total = Number(app.monthly_salary ?? 0) + Number(app.other_monthly_income ?? 0);
  return {
    firstName: app.applicant_first_name ?? "",
    lastName: app.applicant_last_name ?? "",
    middleName: app.applicant_middle_name ?? "",
    occupation: label(occupationOptions, app.occupation),
    monthlySalary: peso(app.monthly_salary),
    employer: app.employer ?? "",
    employmentStatus: app.employment_status ?? "",
    totalMonthlyIncome: total ? peso(total) : "",
    civilStatus: label(civilStatusOptions, app.civil_status),
    spouseName: app.spouse_name ?? "",
    noOfDependents: label(dependentsOptions, app.no_of_dependents?.toString()),
    spouseEmployer: app.spouse_employer ?? "",
    spouseMonthlySalary: peso(app.spouse_monthly_salary),
    presentAddress: app.present_address ?? "",
    permanentAddress: app.permanent_address ?? "",
    phoneNo: [app.phone_no, app.landline_no, app.other_contact_no].filter(Boolean).join(" / "),
    email: app.applicant_email ?? "",
    taxIdentificationNumber: app.tax_identification_number ?? "",
    validId: label(validIdOptions, app.valid_id),
    idNumber: app.id_number ?? "",
    shareCapitalAsOf: date(app.share_capital_as_of),
    shareCapitalAmount: peso(app.share_capital_amount)
  };
}

function mapCoMaker(cm: LoanCoMaker | undefined): PersonFields | null {
  if (!cm) return null;
  const total = Number(cm.monthly_salary ?? 0) + Number(cm.other_monthly_income ?? 0);
  return {
    firstName: cm.first_name ?? "",
    lastName: cm.last_name ?? "",
    middleName: cm.middle_name ?? "",
    occupation: label(occupationOptions, cm.occupation),
    monthlySalary: peso(cm.monthly_salary),
    employer: cm.employer ?? "",
    employmentStatus: cm.employment_status ?? "",
    totalMonthlyIncome: total ? peso(total) : "",
    civilStatus: label(civilStatusOptions, cm.civil_status),
    spouseName: cm.spouse_name ?? "",
    noOfDependents: cm.no_of_dependents != null ? String(cm.no_of_dependents) : "",
    spouseEmployer: "",
    spouseMonthlySalary: "",
    presentAddress: cm.present_address ?? "",
    permanentAddress: cm.permanent_address ?? "",
    phoneNo: [cm.phone_no ?? cm.contact_no, cm.landline_no, cm.other_contact_no].filter(Boolean).join(" / "),
    email: cm.email ?? "",
    taxIdentificationNumber: cm.tax_identification_number ?? "",
    validId: label(validIdOptions, cm.valid_id),
    idNumber: cm.id_number ?? "",
    shareCapitalAsOf: date(cm.share_capital_as_of),
    shareCapitalAmount: peso(cm.share_capital_amount)
  };
}

function mapProperties(rows: LoanRealProperty[], ownerRole: string): RealPropertyFields[] {
  return rows
    .filter((r) => r.owner_role === ownerRole)
    .map((r) => ({
      description: label(propertyDescriptionOptions, r.description),
      landTitleNumber: r.land_title_number ?? "",
      lotNumber: r.lot_number ?? "",
      location: r.location ?? "",
      lotAreaSqm: r.lot_area_sqm != null ? String(r.lot_area_sqm) : ""
    }));
}

/** Build the complete set of form-field values for one application. */
export function buildLoanFormFields(app: LoanApplicationWithDetails): LoanFormFields {
  const coMakers = [...app.coMakers].sort((a, b) =>
    a.co_maker_role.localeCompare(b.co_maker_role)
  );
  const firstCm = coMakers.find((c) => c.co_maker_role === "first") ?? coMakers[0];
  const secondCm = coMakers.find((c) => c.co_maker_role === "second") ?? coMakers[1];

  const loanCode = app.product?.code?.toLowerCase() ?? "";
  const security = Array.isArray(app.security_offered)
    ? (app.security_offered as string[])
    : app.security_offered
      ? String(app.security_offered).split(",").map((s) => s.trim())
      : [];

  return {
    branch: app.branch?.name ?? "",
    date: date(app.created_at),
    loanType: loanCode,
    loanTypeLabel: label(loanTypeOptions, loanCode),
    othersSpecify: "",
    amountInWords: app.amount_in_words ?? "",
    amountRequested: peso(app.amount_requested),
    preferredTermMonths: app.preferred_term_months != null ? String(app.preferred_term_months) : "",
    firstPaymentDue: date(app.first_payment_due),
    purpose: label(loanPurposeOptions, app.purpose),
    securityOffered: security,
    applicant: mapApplicant(app),
    applicantProperties: mapProperties(app.realProperties, "applicant"),
    coMaker1: mapCoMaker(firstCm),
    coMaker1Properties: mapProperties(app.realProperties, "first_co_maker"),
    coMaker2: mapCoMaker(secondCm),
    coMaker2Properties: mapProperties(app.realProperties, "second_co_maker"),
    memberBorrowerName: fullName(
      app.applicant_first_name,
      app.applicant_middle_name,
      app.applicant_last_name
    ),
    coMaker1Name: firstCm ? fullName(firstCm.first_name, firstCm.middle_name, firstCm.last_name) : "",
    coMaker2Name: secondCm ? fullName(secondCm.first_name, secondCm.middle_name, secondCm.last_name) : "",
    applicationNumber: app.application_number
  };
}

export const securityOfferedValues = securityOfferedOptions.map((o) => o.value);
