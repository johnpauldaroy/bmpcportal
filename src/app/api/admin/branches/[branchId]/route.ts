import { z } from "zod";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  is_active: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-branches",
    limit: 30,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid branch update.");

  const { branchId } = await params;
  const { data, error } = await auth.admin
    .from("branches")
    .update(parsed.data)
    .eq("id", branchId)
    .select("id, code, name, is_active, created_at")
    .single();

  if (error) return jsonError("Unable to update branch.", 500);

  return jsonOk({ branch: data });
}
