import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ importId: string }> }
) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-import-commit",
    limit: 30,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const { importId } = await params;
  const result = await auth.admin.rpc("commit_snapshot_import", {
    p_import_id: importId,
    p_actor_id: auth.user.id
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

  return NextResponse.json(payload);
}
