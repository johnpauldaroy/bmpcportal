import { getServerEnv } from "@/lib/env";

const BRAND = "#3673FC";
const INK = "#0F172A";
const MUTED = "#475569";

// Wraps body HTML in a simple, email-client-safe branded layout (inline styles,
// table-free, no external CSS) so every notification looks consistent.
export function emailLayout(bodyHtml: string) {
  const { NEXT_PUBLIC_APP_NAME } = getServerEnv();
  return `
  <div style="background:#F1F5F9;padding:24px;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:${INK};">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
      <div style="background:${BRAND};padding:18px 24px;">
        <span style="color:#ffffff;font-size:16px;font-weight:700;">${NEXT_PUBLIC_APP_NAME}</span>
      </div>
      <div style="padding:24px;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #E2E8F0;color:${MUTED};font-size:12px;">
        This is an automated message from ${NEXT_PUBLIC_APP_NAME}. Please do not reply to this email.
      </div>
    </div>
  </div>`;
}

export function emailButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px;">${label}</a>`;
}

export function coMakerInviteEmail(params: {
  coMakerName: string;
  applicantName: string;
  applicationNumber: string;
  url: string;
}) {
  const body = `
    <p>Hi ${params.coMakerName || "there"},</p>
    <p>
      <strong>${params.applicantName || "A cooperative member"}</strong> listed you as a co-maker
      for loan application <strong>${params.applicationNumber}</strong>.
    </p>
    <p>Please complete your co-maker statement and upload your valid ID using the secure link below.</p>
    <p style="margin:20px 0;">${emailButton(params.url, "Complete co-maker form")}</p>
    <p style="color:${MUTED};font-size:13px;">
      If the button does not work, copy and paste this link into your browser:<br />
      <span style="word-break:break-all;">${params.url}</span>
    </p>`;
  return {
    subject: `Co-maker request for loan application ${params.applicationNumber}`,
    html: emailLayout(body)
  };
}

export function loanStatusEmail(params: {
  memberName: string;
  applicationNumber: string;
  statusLabel: string;
  note?: string | null;
  url: string;
}) {
  const noteBlock = params.note
    ? `<p style="background:#F1F5F9;border-radius:8px;padding:12px;"><strong>Note from staff:</strong><br />${params.note}</p>`
    : "";
  const body = `
    <p>Hi ${params.memberName || "there"},</p>
    <p>
      Your loan application <strong>${params.applicationNumber}</strong> status has been updated to
      <strong>${params.statusLabel}</strong>.
    </p>
    ${noteBlock}
    <p style="margin:20px 0;">${emailButton(params.url, "View my applications")}</p>`;
  return {
    subject: `Loan application ${params.applicationNumber} is now ${params.statusLabel}`,
    html: emailLayout(body)
  };
}

export function loanAgreementSentEmail(params: {
  memberName: string;
  applicationNumber: string;
  amount: string;
  netProceeds: string;
  url: string;
}) {
  const body = `
    <p>Hi ${params.memberName || "there"},</p>
    <p>
      Your loan agreement for application <strong>${params.applicationNumber}</strong>
      is ready for your review.
    </p>
    <p style="background:#F1F5F9;border-radius:8px;padding:12px;">
      <strong>Loan amount:</strong> PHP ${params.amount}<br />
      <strong>Net loan proceeds:</strong> PHP ${params.netProceeds}
    </p>
    <p>
      Please sign in to review the full disclosure, discount sheet, and promissory
      terms, then accept and sign the agreement to proceed with the release.
    </p>
    <p style="margin:20px 0;">${emailButton(params.url, "Review &amp; sign agreement")}</p>`;
  return {
    subject: `Action needed: review your loan agreement (${params.applicationNumber})`,
    html: emailLayout(body)
  };
}

export function memberStatusEmail(params: {
  memberName: string;
  statusLabel: string;
  isActive: boolean;
  url: string;
}) {
  const body = params.isActive
    ? `
      <p>Hi ${params.memberName || "there"},</p>
      <p>Good news! Your membership account has been <strong>activated</strong>.</p>
      <p>You can now sign in to access your balances, loans, and cooperative services.</p>
      <p style="margin:20px 0;">${emailButton(params.url, "Sign in to the portal")}</p>`
    : `
      <p>Hi ${params.memberName || "there"},</p>
      <p>Your membership account status has been updated to <strong>${params.statusLabel}</strong>.</p>
      <p>If you believe this is a mistake, please contact your nearest BMPC branch.</p>`;
  return {
    subject: params.isActive
      ? "Your BMPC account is now active"
      : `Your BMPC account status: ${params.statusLabel}`,
    html: emailLayout(body)
  };
}
