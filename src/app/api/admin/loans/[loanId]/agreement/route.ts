import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { loanAgreementTermsSchema } from "@/features/loans/schemas";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import { sendEmail } from "@/lib/server/email";
import { loanAgreementSentEmail } from "@/lib/server/email-templates";
import { getServerEnv } from "@/lib/env";

function peso(n: number | null | undefined) {
  if (n == null) return "0.00";
  return new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/** POST = save agreement terms and send the agreement to the maker. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-loan-agreement",
    limit: 30,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = loanAgreementTermsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid agreement terms.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { loanId } = await params;
  const t = parsed.data;

  // Compute deductions/net so server is the source of truth (don't trust client totals).
  const retention =
    t.loanRetentionAmount ??
    (t.loanRetentionPercent != null ? (t.amountOfLoan * t.loanRetentionPercent) / 100 : 0);
  const serviceFee =
    t.serviceFeeAmount ??
    (t.serviceFeePercent != null ? (t.amountOfLoan * t.serviceFeePercent) / 100 : 0);
  const others = t.otherDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalDeduction = retention + serviceFee + t.filingFee + others;
  const netProceeds = Math.max(0, t.amountOfLoan - totalDeduction);

  const row = {
    loan_application_id: loanId,
    status: "sent" as const,
    amount_of_loan: t.amountOfLoan,
    loan_retention_percent: t.loanRetentionPercent ?? null,
    loan_retention_amount: retention || null,
    service_fee_percent: t.serviceFeePercent ?? null,
    service_fee_amount: serviceFee || null,
    filing_fee: t.filingFee,
    other_deductions: t.otherDeductions,
    total_deduction: totalDeduction,
    net_loan_proceeds: netProceeds,
    type_of_loan: t.typeOfLoan || null,
    purpose_of_loan: t.purposeOfLoan || null,
    term_months: t.termMonths ?? null,
    interest_rate_percent: t.interestRatePercent ?? null,
    security: t.security || null,
    monthly_amortization: t.monthlyAmortization ?? null,
    loan_date: t.loanDate || null,
    maturity_date: t.maturityDate || null,
    first_payment_due: t.firstPaymentDue || null,
    amort_breakdown: t.amortBreakdown,
    sent_at: new Date().toISOString(),
    sent_by: auth.user.id
  };

  const { error } = await auth.admin
    .from("loan_agreements")
    .upsert(row, { onConflict: "loan_application_id" });

  if (error) {
    return jsonError(error.message, 500);
  }

  // Notify the maker. Non-blocking: email issues never fail the send action.
  try {
    const { data: application } = await auth.admin
      .from("loan_applications")
      .select("application_number, member_id, applicant_email")
      .eq("id", loanId)
      .maybeSingle();

    if (application) {
      const { data: member } = await auth.admin
        .from("profiles")
        .select("full_name, email")
        .eq("id", application.member_id)
        .maybeSingle();

      const recipient = application.applicant_email || member?.email;
      if (recipient) {
        const { NEXT_PUBLIC_APP_URL } = getServerEnv();
        const { subject, html } = loanAgreementSentEmail({
          memberName: member?.full_name ?? "",
          applicationNumber: application.application_number,
          amount: peso(t.amountOfLoan),
          netProceeds: peso(netProceeds),
          url: `${NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/member/loans`
        });
        const result = await sendEmail({ to: recipient, subject, html });
        if (!result.sent) {
          console.warn(`[loan-agreement] email to ${recipient} not sent (${result.reason})`);
        }
      } else {
        console.warn(`[loan-agreement] no email on file for application ${loanId}`);
      }
    }
  } catch (emailError) {
    console.error("Failed to send loan agreement email", emailError);
  }

  return NextResponse.json({ ok: true, netLoanProceeds: netProceeds, totalDeduction });
}
