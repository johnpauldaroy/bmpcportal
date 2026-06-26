import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/server/audit-log";
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
    key: "admin-import-cancel",
    limit: 30,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const { importId } = await params;
  const { data: importBatch, error: importError } = await auth.admin
    .from("snapshot_imports")
    .select("id, status, source_file_path")
    .eq("id", importId)
    .single();

  if (importError || !importBatch) {
    return jsonError(importError?.message ?? "Import batch was not found.", 404);
  }

  if (importBatch.status === "committed") {
    return jsonError("Committed imports cannot be cancelled.", 409);
  }

  const { data, error } = await auth.admin
    .from("snapshot_imports")
    .update({
      status: "cancelled",
      error_summary: {}
    })
    .eq("id", importId)
    .select()
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (importBatch.source_file_path) {
    await auth.admin.storage.from("csv-imports").remove([importBatch.source_file_path]);
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "csv_import.cancelled",
    targetTable: "snapshot_imports",
    targetId: importId,
    metadata: { status_before_cancel: importBatch.status }
  });

  return NextResponse.json({ import: data });
}
