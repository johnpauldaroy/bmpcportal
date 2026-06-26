import { headers } from "next/headers";
import { jsonError } from "@/lib/server/http";
import { getServerEnv } from "@/lib/env";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeOrigin(value: string) {
  const url = new URL(value);
  return url.origin;
}

function trustedOrigins() {
  const env = getServerEnv();
  const origins = new Set<string>();

  origins.add(normalizeOrigin(env.NEXT_PUBLIC_APP_URL));

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  return origins;
}

export async function enforceSameOriginRequest(request: Request) {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const requestHeaders = await headers();
  const origin = request.headers.get("origin");
  const host = requestHeaders.get("host");

  if (!origin || !host) {
    return jsonError("Origin verification is required.", 403);
  }

  let originHost: string;
  try {
    const parsed = new URL(origin);
    originHost = parsed.host;
  } catch {
    return jsonError("Invalid request origin.", 403);
  }

  if (originHost === host || trustedOrigins().has(origin)) {
    return null;
  }

  return jsonError("Cross-origin requests are not allowed.", 403);
}
