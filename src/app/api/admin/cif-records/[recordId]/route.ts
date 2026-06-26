import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ recordId: string }> }
) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-cif-records",
    limit: 60,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) return auth.response;

  const { recordId } = await params;

  // Prevent deleting claimed records — the member is already registered
  const { data: existing } = await auth.admin
    .from("cif_records")
    .select("is_claimed")
    .eq("id", recordId)
    .maybeSingle();

  if (!existing) return jsonError("CIF record not found.", 404);
  if (existing.is_claimed) return jsonError("Cannot delete a claimed CIF record. The member has already registered.", 409);

  const { error } = await auth.admin
    .from("cif_records")
    .delete()
    .eq("id", recordId);

  if (error) return jsonError("Unable to delete CIF record.", 500);

  return jsonOk({ deleted: true });
}
