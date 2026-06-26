import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  cifKey: z.string().trim().min(1).max(80),
  branchCode: z.string().trim().min(1).max(20)
});

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "auth-verify-cif",
    limit: 10,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid verification details.");
  }

  const { cifKey, branchCode } = parsed.data;
  const admin = createAdminClient();

  const { data: branch } = await admin
    .from("branches")
    .select("id")
    .eq("code", branchCode.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!branch) {
    return jsonError("Branch not found. Please check the branch you selected.", 404);
  }

  const { data: cif } = await admin
    .from("cif_records")
    .select("id, member_number, is_claimed, branch_id")
    .eq("cif_key", cifKey)
    .maybeSingle();

  if (!cif) {
    return jsonError("CIF key not found. Please check your CIF key and try again.", 404);
  }

  if (cif.branch_id !== branch.id) {
    return jsonError("CIF key does not match the selected branch.", 400);
  }

  if (cif.is_claimed) {
    return jsonError("This CIF key has already been used to register an account.", 409);
  }

  return jsonOk({ memberNumber: cif.member_number });
}
