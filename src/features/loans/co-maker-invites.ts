import { getServerEnv } from "@/lib/env";
import { sendEmail } from "@/lib/server/email";
import { coMakerInviteEmail } from "@/lib/server/email-templates";

export type CoMakerInvite = {
  id: string;
  co_maker_role: "first" | "second";
  first_name: string;
  last_name: string;
  email: string;
  invite_token: string;
};

export function buildCoMakerInviteUrl(token: string) {
  const { NEXT_PUBLIC_APP_URL } = getServerEnv();
  return `${NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/co-maker/${token}`;
}

/**
 * Delivers co-maker invite links over SMTP. Delivery is non-blocking: if SMTP is
 * not configured or a send fails, sendEmail logs and returns a non-sent result
 * rather than throwing, so the loan submission is never blocked by mail issues.
 */
export async function sendCoMakerInvites(
  invites: CoMakerInvite[],
  context: { applicationNumber: string; applicantName: string }
) {
  await Promise.all(
    invites.map((invite) => {
      const url = buildCoMakerInviteUrl(invite.invite_token);
      const { subject, html } = coMakerInviteEmail({
        coMakerName: `${invite.first_name} ${invite.last_name}`.trim(),
        applicantName: context.applicantName,
        applicationNumber: context.applicationNumber,
        url
      });
      return sendEmail({ to: invite.email, subject, html });
    })
  );
}
