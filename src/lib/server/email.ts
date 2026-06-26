import nodemailer, { type Transporter } from "nodemailer";
import { getServerEnv } from "@/lib/env";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "error"; error?: unknown };

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter | null {
  const env = getServerEnv();
  if (!env.SMTP_HOST) {
    return null;
  }
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
          : undefined
    });
  }
  return cachedTransport;
}

function resolveFrom() {
  const env = getServerEnv();
  // Prefer an explicit From; otherwise fall back to the SMTP user, then a sane
  // default that at least carries the app name.
  return env.SMTP_FROM ?? env.SMTP_USER ?? `${env.NEXT_PUBLIC_APP_NAME} <no-reply@localhost>`;
}

// Strips tags so callers can pass HTML and still get a readable plain-text part
// without authoring it twice.
function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>(?=)/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Sends an email over SMTP. Non-blocking by contract: when SMTP is not
 * configured, or delivery fails, it logs and returns a non-sent result instead
 * of throwing, so user-facing actions are never blocked by mail issues.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const transport = getTransport();
  const recipients = Array.isArray(input.to) ? input.to.join(", ") : input.to;

  if (!transport) {
    console.info(
      `[email:not-configured] would send "${input.subject}" to ${recipients}. ` +
        "Set SMTP_HOST and related env vars to enable delivery."
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    await transport.sendMail({
      from: resolveFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToText(input.html)
    });
    return { sent: true };
  } catch (error) {
    console.error(`[email:error] failed to send "${input.subject}" to ${recipients}`, error);
    return { sent: false, reason: "error", error };
  }
}
