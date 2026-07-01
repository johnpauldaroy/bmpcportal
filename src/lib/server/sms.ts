import { getServerEnv } from "@/lib/env";

export type SendSmsInput = {
  /** One or more PH mobile numbers. Accepts 09xx, +639xx, or 639xx forms. */
  to: string | string[];
  message: string;
  /** Override the configured sender name for this send (must be pre-approved). */
  senderName?: string;
};

export type SendSmsResult =
  | { sent: true; messageIds: string[] }
  | { sent: false; reason: "not_configured" | "no_recipients" | "error"; error?: unknown };

/**
 * Normalizes a Philippine mobile number to Semaphore's expected 639XXXXXXXXX
 * form. Returns null for anything that isn't a plausible PH mobile number so
 * callers can skip bad rows instead of failing the whole batch.
 */
export function normalizePhNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // 09171234567 -> 639171234567
  if (/^09\d{9}$/.test(digits)) return `63${digits.slice(1)}`;
  // 639171234567 (already correct)
  if (/^639\d{9}$/.test(digits)) return digits;
  // 9171234567 (missing leading 0)
  if (/^9\d{9}$/.test(digits)) return `63${digits}`;
  return null;
}

/**
 * Sends an SMS via Semaphore. Non-blocking by contract: when the API key is not
 * configured, or delivery fails, it logs and returns a non-sent result instead
 * of throwing, so user-facing actions are never blocked by SMS issues.
 *
 * For multiple recipients Semaphore accepts a comma-separated list in a single
 * request, which is also how bulk/broadcast sends are billed efficiently.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const env = getServerEnv();

  const rawList = Array.isArray(input.to) ? input.to : [input.to];
  const numbers = Array.from(
    new Set(rawList.map(normalizePhNumber).filter((n): n is string => Boolean(n)))
  );

  if (numbers.length === 0) {
    console.info(`[sms:no-recipients] no valid PH numbers in: ${rawList.join(", ")}`);
    return { sent: false, reason: "no_recipients" };
  }

  if (!env.SEMAPHORE_API_KEY) {
    console.info(
      `[sms:not-configured] would send to ${numbers.join(", ")}: "${input.message}". ` +
        "Set SEMAPHORE_API_KEY to enable delivery."
    );
    return { sent: false, reason: "not_configured" };
  }

  const body = new URLSearchParams({
    apikey: env.SEMAPHORE_API_KEY,
    number: numbers.join(","),
    message: input.message
  });
  const sender = input.senderName ?? env.SEMAPHORE_SENDER_NAME;
  if (sender) body.set("sendername", sender);

  try {
    const res = await fetch(`${env.SEMAPHORE_BASE_URL}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[sms:error] Semaphore responded ${res.status}: ${text}`);
      return { sent: false, reason: "error", error: text };
    }

    // Semaphore returns an array of message objects, one per recipient.
    const data = (await res.json().catch(() => [])) as Array<{ message_id?: number | string }>;
    const messageIds = data.map((m) => String(m.message_id ?? "")).filter(Boolean);
    return { sent: true, messageIds };
  } catch (error) {
    console.error(`[sms:error] failed to send to ${numbers.join(", ")}`, error);
    return { sent: false, reason: "error", error };
  }
}

export type SendOtpResult =
  | { sent: true; code: string; messageIds: string[] }
  | { sent: false; reason: "not_configured" | "no_recipients" | "error"; error?: unknown };

/**
 * Sends a one-time PIN via Semaphore's OTP endpoint. Use the literal {otp}
 * placeholder in the message; Semaphore substitutes a generated code and returns
 * it so you can store/verify it server-side (never trust a client-supplied code).
 *
 * Example: sendOtp({ to, message: "Your BMPC code is {otp}. Valid for 5 minutes." })
 */
export async function sendOtp(input: SendSmsInput): Promise<SendOtpResult> {
  const env = getServerEnv();
  const number = Array.isArray(input.to) ? input.to[0] : input.to;
  const normalized = number ? normalizePhNumber(number) : null;

  if (!normalized) {
    console.info(`[sms:otp:no-recipients] invalid PH number: ${number}`);
    return { sent: false, reason: "no_recipients" };
  }
  if (!env.SEMAPHORE_API_KEY) {
    console.info(`[sms:otp:not-configured] would send OTP to ${normalized}.`);
    return { sent: false, reason: "not_configured" };
  }

  const message = input.message.includes("{otp}")
    ? input.message
    : `${input.message} {otp}`;
  const body = new URLSearchParams({
    apikey: env.SEMAPHORE_API_KEY,
    number: normalized,
    message
  });
  const sender = input.senderName ?? env.SEMAPHORE_SENDER_NAME;
  if (sender) body.set("sendername", sender);

  try {
    const res = await fetch(`${env.SEMAPHORE_BASE_URL}/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[sms:otp:error] Semaphore responded ${res.status}: ${text}`);
      return { sent: false, reason: "error", error: text };
    }
    const data = (await res.json().catch(() => [])) as Array<{
      message_id?: number | string;
      code?: number | string;
    }>;
    const code = String(data[0]?.code ?? "");
    const messageIds = data.map((m) => String(m.message_id ?? "")).filter(Boolean);
    return { sent: true, code, messageIds };
  } catch (error) {
    console.error(`[sms:otp:error] failed to send OTP to ${normalized}`, error);
    return { sent: false, reason: "error", error };
  }
}
