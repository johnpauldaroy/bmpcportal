import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/server/audit-log";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import {
  parseSnapshotCsv,
  validateSnapshotRows
} from "@/features/balances/import-pipeline";
import { csvImportSchema, snapshotTypeSchema } from "@/features/balances/schemas";
import type { Json } from "@/types/database";

const IMPORT_BUCKET = "csv-imports";
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const PREVIEW_ROW_LIMIT = 50;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

async function sha256Hex(value: string) {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET() {
  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const { data, error } = await auth.admin
    .from("snapshot_imports")
    .select(
      "id, type, effective_date, status, source_file_name, row_count, valid_row_count, invalid_row_count, total_amount, imported_by, committed_by, committed_at, created_at, error_summary"
    )
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ imports: data ?? [] });
}

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-imports",
    limit: 30,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const formData = await request.formData();
  const typeResult = snapshotTypeSchema.safeParse(formData.get("type"));
  if (!typeResult.success) {
    return jsonError("Import type must be savings or share_capital.");
  }

  const type = typeResult.data;
  const effectiveDate = String(formData.get("effectiveDate") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("A CSV file is required.");
  }

  if (file.size > MAX_IMPORT_BYTES) {
    return jsonError("CSV file must be 5 MB or smaller.");
  }

  const baseInput = csvImportSchema
    .omit({ rows: true })
    .safeParse({ type, effectiveDate, fileName: file.name });

  if (!baseInput.success) {
    return NextResponse.json({ error: "Invalid import metadata.", issues: baseInput.error.issues }, { status: 400 });
  }

  const csvText = await file.text();
  const sourceFileHash = await sha256Hex(csvText);
  const parsed = parseSnapshotCsv(csvText);

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      {
        error: "CSV could not be parsed.",
        issues: parsed.errors
      },
      { status: 400 }
    );
  }

  if (parsed.rows.length === 0) {
    return jsonError("CSV must contain at least one data row.");
  }

  const memberNumbers = Array.from(
    new Set(
      parsed.rows
        .map((row) => String(row.raw.member_number ?? "").trim())
        .filter(Boolean)
    )
  );

  const { data: members, error: membersError } =
    memberNumbers.length > 0
      ? await auth.admin
          .from("profiles")
          .select("id, member_number")
          .in("member_number", memberNumbers)
      : { data: [], error: null };

  if (membersError) {
    return jsonError(membersError.message, 500);
  }

  const memberIdByNumber = new Map(
    (members ?? [])
      .filter((member) => member.member_number)
      .map((member) => [member.member_number!, member.id])
  );
  const memberIds = Array.from(new Set(Array.from(memberIdByNumber.values())));

  const { data: existingSnapshots, error: existingError } =
    memberIds.length > 0
      ? await auth.admin
          .from("member_financial_snapshots")
          .select("member_id")
          .eq("type", type)
          .eq("effective_date", effectiveDate)
          .in("member_id", memberIds)
      : { data: [], error: null };

  if (existingError) {
    return jsonError(existingError.message, 500);
  }

  const existingSnapshotMemberIds = new Set(
    (existingSnapshots ?? []).map((snapshot) => snapshot.member_id)
  );
  const validation = validateSnapshotRows({
    rows: parsed.rows,
    effectiveDate,
    memberIdByNumber,
    existingSnapshotMemberIds
  });

  const sourceFilePath = `${type}/${effectiveDate}/${sourceFileHash}-${sanitizeFileName(file.name)}`;
  const uploadResult = await auth.admin.storage
    .from(IMPORT_BUCKET)
    .upload(sourceFilePath, new Blob([csvText], { type: file.type || "text/csv" }), {
      contentType: file.type || "text/csv",
      upsert: false
    });

  if (uploadResult.error) {
    return jsonError(uploadResult.error.message, 500);
  }

  const importInsert = await auth.admin
    .from("snapshot_imports")
    .insert({
      type,
      effective_date: effectiveDate,
      status: "previewed",
      source_file_path: sourceFilePath,
      source_file_name: file.name,
      source_file_hash: sourceFileHash,
      row_count: validation.summary.totalRows,
      valid_row_count: validation.summary.validRows,
      invalid_row_count: validation.summary.invalidRows,
      total_amount: validation.summary.totalAmount,
      error_summary: {
        parse_errors: [],
        invalid_rows: validation.summary.invalidRows
      },
      imported_by: auth.user.id
    })
    .select()
    .single();

  if (importInsert.error) {
    await auth.admin.storage.from(IMPORT_BUCKET).remove([sourceFilePath]);
    return jsonError(importInsert.error.message, 500);
  }

  const importRows = validation.rows.map((row) => ({
    import_id: importInsert.data.id,
    row_number: row.rowNumber,
    member_number: row.memberNumber,
    member_id: row.memberId,
    amount: row.amount,
    effective_date: row.effectiveDate,
    status: row.status,
    errors: row.errors as Json,
    raw_row: row.raw as Json
  }));

  for (let index = 0; index < importRows.length; index += 500) {
    const chunk = importRows.slice(index, index + 500);
    const { error } = await auth.admin.from("snapshot_import_rows").insert(chunk);
    if (error) {
      await auth.admin
        .from("snapshot_imports")
        .update({
          status: "failed",
          error_summary: { row_insert_error: error.message }
        })
        .eq("id", importInsert.data.id);
      await writeAuditLog({
        actorId: auth.user.id,
        action: "csv_import.failed",
        targetTable: "snapshot_imports",
        targetId: importInsert.data.id,
        severity: "warning",
        metadata: { error: error.message }
      });
      return jsonError(error.message, 500);
    }
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "csv_import.previewed",
    targetTable: "snapshot_imports",
    targetId: importInsert.data.id,
    metadata: {
      type,
      effective_date: effectiveDate,
      row_count: validation.summary.totalRows,
      valid_row_count: validation.summary.validRows,
      invalid_row_count: validation.summary.invalidRows,
      total_amount: validation.summary.totalAmount
    }
  });

  return NextResponse.json({
    import: importInsert.data,
    summary: validation.summary,
    previewRows: validation.rows.slice(0, PREVIEW_ROW_LIMIT)
  });
}
