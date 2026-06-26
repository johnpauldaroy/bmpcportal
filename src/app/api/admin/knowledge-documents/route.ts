import { z } from "zod";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import { writeAuditLog } from "@/lib/server/audit-log";

const KNOWLEDGE_BUCKET = "knowledge-documents";
const MAX_KNOWLEDGE_BYTES = 50 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "text/plain", "text/markdown"]);

const metadataSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1000).optional().default("")
});

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 140);
}

async function sha256Hex(file: File) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-knowledge-upload",
    limit: 20,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const formData = await request.formData();
  const parsed = metadataSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? ""
  });

  if (!parsed.success) {
    return jsonError("Invalid document metadata.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("A document file is required.");
  }

  if (file.size > MAX_KNOWLEDGE_BYTES) {
    return jsonError("Knowledge documents must be 50 MB or smaller.");
  }

  const contentType = file.type || "application/octet-stream";
  if (!allowedTypes.has(contentType)) {
    return jsonError("Only PDF, plain text, and markdown documents are allowed.");
  }

  const checksum = await sha256Hex(file);
  const storagePath = `${new Date().toISOString().slice(0, 10)}/${checksum}-${sanitizeFileName(file.name)}`;
  const upload = await auth.admin.storage.from(KNOWLEDGE_BUCKET).upload(storagePath, file, {
    contentType,
    upsert: false
  });

  if (upload.error) {
    return jsonError(upload.error.message, 500);
  }

  const { data: document, error } = await auth.admin
    .from("knowledge_documents")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      storage_path: storagePath,
      content_type: contentType,
      byte_size: file.size,
      checksum,
      sync_status: "pending",
      uploaded_by: auth.user.id
    })
    .select()
    .single();

  if (error || !document) {
    await auth.admin.storage.from(KNOWLEDGE_BUCKET).remove([storagePath]);
    return jsonError(error?.message ?? "Unable to register knowledge document.", 500);
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "knowledge_base.synced",
    targetTable: "knowledge_documents",
    targetId: document.id,
    metadata: {
      title: document.title,
      sync_status: document.sync_status
    }
  });

  return jsonOk({ document }, 201);
}
