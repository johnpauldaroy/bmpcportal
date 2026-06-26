import { headers } from "next/headers";
import { jsonError } from "@/lib/server/http";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

const buckets = new Map<string, Bucket>();

function clientIp(headerValue: string | null) {
  return headerValue?.split(",")[0]?.trim() || "unknown";
}

export async function enforceRateLimit(options: RateLimitOptions) {
  const headerStore = await headers();
  const ip = clientIp(headerStore.get("x-forwarded-for"));
  const bucketKey = `${options.key}:${ip}`;
  const now = Date.now();
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowSeconds * 1000
    });
    return null;
  }

  current.count += 1;

  if (current.count <= options.limit) {
    return null;
  }

  return jsonError("Too many requests. Try again later.", 429);
}
