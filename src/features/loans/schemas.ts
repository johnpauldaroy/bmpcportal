import { z } from "zod";
import type { LoanStatus } from "@/types/database";
import {
  civilStatusOptions,
  dependentsOptions,
  employmentStatusOptions,
  loanPurposeOptions,
  occupationOptions,
  optionValues,
  propertyDescriptionOptions,
  securityOfferedOptions,
  validIdOptions
} from "./application-options";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((value) => value ?? "");

const requiredText = (max: number) => z.string().trim().min(1).max(max);

// One person's identity + employment block, shared by applicant and co-makers.
const personSchema = z.object({
  firstName: requiredText(80),
  lastName: requiredText(80),
  middleName: optionalText(80),
  presentAddress: requiredText(200),
  permanentAddress: requiredText(200),
  phoneNo: requiredText(40),
  landlineNo: optionalText(40),
  otherContactNo: optionalText(40),
  email: z.string().trim().email().max(160),
  civilStatus: z.enum(optionValues(civilStatusOptions)),
  noOfDependents: z.enum(optionValues(dependentsOptions)),
  occupation: z.enum(optionValues(occupationOptions)),
  employer: optionalText(160),
  monthlySalary: z.coerce.number().nonnegative().optional(),
  employmentStatus: z.enum(optionValues(employmentStatusOptions)).optional(),
  otherMonthlyIncome: z.coerce.number().nonnegative().optional(),
  taxIdentificationNumber: optionalText(40),
  validId: z.enum(optionValues(validIdOptions)).optional(),
  idNumber: optionalText(60),
  spouseName: optionalText(160),
  shareCapitalAsOf: z.string().date().optional().or(z.literal("")),
  shareCapitalAmount: z.coerce.number().nonnegative().optional()
});

export const realPropertySchema = z.object({
  ownerRole: z.enum(["applicant", "first_co_maker", "second_co_maker"]).default("applicant"),
  description: z.enum(optionValues(propertyDescriptionOptions)).optional(),
  landTitleNumber: optionalText(80),
  lotNumber: optionalText(80),
  location: optionalText(200),
  lotAreaSqm: z.coerce.number().nonnegative().optional()
});

// Applicant only supplies the co-maker's contact details; the co-maker fills
// the rest of their statement (and uploads) through a tokenized invite link.
const coMakerInviteSchema = z.object({
  firstName: requiredText(80),
  lastName: requiredText(80),
  middleName: optionalText(80),
  contactNo: requiredText(40),
  email: z.string().trim().email().max(160)
});

// Keep in sync with MAX_FILE_BYTES in the upload forms/routes (2MB).
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

const attachmentSchema = z.object({
  kind: z.string().min(1).max(60),
  bucketId: z.string().min(1).max(80).default("loan-attachments"),
  storagePath: z.string().min(1).max(400),
  fileName: optionalText(255),
  contentType: optionalText(120),
  byteSize: z.coerce.number().int().nonnegative().max(MAX_ATTACHMENT_BYTES).optional()
});

// What a co-maker submits through their own link: the self-fill person block
// (no name fields - those came from the applicant) plus their attachments.
export const coMakerCompletionSchema = z.object({
  presentAddress: requiredText(200),
  permanentAddress: requiredText(200),
  phoneNo: requiredText(40),
  landlineNo: optionalText(40),
  otherContactNo: optionalText(40),
  civilStatus: z.enum(optionValues(civilStatusOptions)),
  noOfDependents: z.enum(optionValues(dependentsOptions)),
  occupation: z.enum(optionValues(occupationOptions)),
  employer: optionalText(160),
  monthlySalary: z.coerce.number().nonnegative().optional(),
  employmentStatus: z.enum(optionValues(employmentStatusOptions)).optional(),
  otherMonthlyIncome: z.coerce.number().nonnegative().optional(),
  taxIdentificationNumber: optionalText(40),
  validId: z.enum(optionValues(validIdOptions)),
  idNumber: requiredText(60),
  spouseName: optionalText(160),
  shareCapitalAsOf: z.string().date().optional().or(z.literal("")),
  shareCapitalAmount: z.coerce.number().nonnegative().optional(),
  attachments: z.array(attachmentSchema).default([]),
  consent: z.literal(true)
});

export const loanApplicationSchema = z
  .object({
    productId: z.string().uuid().optional(),
    productCode: z.string().trim().min(2).max(32).toUpperCase().optional(),
    amountRequested: z.coerce.number().positive(),
    amountInWords: requiredText(200),
    preferredTermMonths: z.coerce.number().int().positive(),
    purpose: z.enum(optionValues(loanPurposeOptions)),
    securityOffered: z.array(z.enum(optionValues(securityOfferedOptions))).min(1),
    firstPaymentDue: z.string().date(),
    branchId: z.string().uuid(),
    // Applicant statement (flattened person block + spouse extras).
    applicant: personSchema.extend({
      spouseEmployer: optionalText(160),
      spouseMonthlySalary: z.coerce.number().nonnegative().optional()
    }),
    realProperties: z.array(realPropertySchema).max(9).default([]),
    coMakers: z.array(coMakerInviteSchema).length(2),
    attachments: z.array(attachmentSchema).default([]),
    consent: z.literal(true)
  })
  .refine((value) => value.productId || value.productCode, {
    path: ["productId"],
    message: "Choose a loan product."
  });

export const loanProductSchema = z
  .object({
    code: z.string().trim().min(2).max(32).toUpperCase(),
    name: z.string().trim().min(3).max(120),
    description: z.string().trim().max(500).optional().default(""),
    minAmount: z.coerce.number().nonnegative(),
    maxAmount: z.coerce.number().positive(),
    minTermMonths: z.coerce.number().int().positive(),
    maxTermMonths: z.coerce.number().int().positive(),
    interestRatePercent: z.coerce.number().nonnegative().optional().nullable(),
    isActive: z.coerce.boolean().optional().default(true)
  })
  .refine((value) => value.maxAmount >= value.minAmount, {
    path: ["maxAmount"],
    message: "Maximum amount must be greater than or equal to minimum amount."
  })
  .refine((value) => value.maxTermMonths >= value.minTermMonths, {
    path: ["maxTermMonths"],
    message: "Maximum term must be greater than or equal to minimum term."
  });

export const reviewableLoanStatusSchema = z.enum([
  "under_review",
  "needs_more_info",
  "approved",
  "released",
  "rejected",
  "cancelled"
] satisfies LoanStatus[]);

export const loanReviewSchema = z.object({
  status: reviewableLoanStatusSchema,
  note: z.string().max(1000).optional().default("")
});

// ===== Loan agreement (disclosure / discount / promissory terms) =====

const otherDeductionSchema = z.object({
  label: z.string().trim().max(120),
  amount: z.coerce.number().nonnegative()
});

// What staff fill in to prepare + send the agreement to the maker.
export const loanAgreementTermsSchema = z.object({
  amountOfLoan: z.coerce.number().positive(),
  loanRetentionPercent: z.coerce.number().nonnegative().max(100).optional(),
  loanRetentionAmount: z.coerce.number().nonnegative().optional(),
  serviceFeePercent: z.coerce.number().nonnegative().max(100).optional(),
  serviceFeeAmount: z.coerce.number().nonnegative().optional(),
  filingFee: z.coerce.number().nonnegative().default(30),
  otherDeductions: z.array(otherDeductionSchema).max(10).default([]),
  totalDeduction: z.coerce.number().nonnegative().optional(),
  netLoanProceeds: z.coerce.number().nonnegative().optional(),
  typeOfLoan: optionalText(160),
  purposeOfLoan: optionalText(200),
  termMonths: z.coerce.number().int().positive().optional(),
  interestRatePercent: z.coerce.number().nonnegative().optional(),
  security: optionalText(200),
  monthlyAmortization: z.coerce.number().nonnegative().optional(),
  loanDate: z.string().date().optional().or(z.literal("")),
  maturityDate: z.string().date().optional().or(z.literal("")),
  firstPaymentDue: z.string().date().optional().or(z.literal("")),
  amortBreakdown: z
    .object({
      loanAmortization: z.coerce.number().nonnegative().optional(),
      interest: z.coerce.number().nonnegative().optional(),
      fines: z.coerce.number().nonnegative().optional(),
      capitalBuildUp: z.coerce.number().nonnegative().optional(),
      savingsDeposit: z.coerce.number().nonnegative().optional()
    })
    .default({})
});

// What the maker submits to accept the agreement.
export const loanAgreementAcceptanceSchema = z.object({
  acknowledged: z.literal(true),
  signature: attachmentSchema.optional()
});

export type LoanAgreementTermsInput = z.infer<typeof loanAgreementTermsSchema>;
export type LoanAgreementAcceptanceInput = z.infer<typeof loanAgreementAcceptanceSchema>;

export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
export type CoMakerCompletionInput = z.infer<typeof coMakerCompletionSchema>;
export type LoanProductInput = z.infer<typeof loanProductSchema>;
export type LoanReviewInput = z.infer<typeof loanReviewSchema>;
