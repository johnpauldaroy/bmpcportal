import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { loanReviewSchema } from "@/features/loans/schemas";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import { sendEmail } from "@/lib/server/email";
import { loanStatusEmail } from "@/lib/server/email-templates";
import { loanStatusLabel } from "@/features/loans/loan-utils";
import { getServerEnv } from "@/lib/env";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-loan-status",
    limit: 60,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = loanReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review update.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { loanId } = await params;
  const result = await auth.admin.rpc("review_loan_application", {
    p_application_id: loanId,
    p_actor_id: auth.user.id,
    p_status: parsed.data.status,
    p_note: parsed.data.note
  });

  if (result.error) {
    return jsonError(result.error.message, 500);
  }

  const payload = result.data;
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "ok" in payload &&
    payload.ok === false
  ) {
    return NextResponse.json(payload, { status: 409 });
  }

  // Notify the member of the decision. Non-blocking: mail issues never fail the
  // review action.
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

      // Prefer the email the applicant entered on the application; fall back to
      // their profile email. CSV-imported members often have no profile email,
      // so relying only on the profile silently skipped notifications.
      const recipient = application.applicant_email || member?.email;

      if (recipient) {
        const { NEXT_PUBLIC_APP_URL } = getServerEnv();
        const { subject, html } = loanStatusEmail({
          memberName: member?.full_name ?? "",
          applicationNumber: application.application_number,
          statusLabel: loanStatusLabel[parsed.data.status],
          note: parsed.data.note,
          url: `${NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/member/loans`
        });
        const result = await sendEmail({ to: recipient, subject, html });
        if (!result.sent) {
          console.warn(
            `[loan-status] email to ${recipient} not sent (reason: ${result.reason})`
          );
        }
      } else {
        console.warn(
          `[loan-status] no email on file for application ${application.application_number}; notification skipped`
        );
      }
    }
  } catch (emailError) {
    console.error("Failed to send loan status email", emailError);
  }

  return NextResponse.json(payload);
}
