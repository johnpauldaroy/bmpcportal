import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError } from "@/lib/server/http";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const { attachmentId } = await params;
  const { data: attachment, error: attachmentError } = await auth.admin
    .from("loan_attachments")
    .select("id, bucket_id, storage_path")
    .eq("id", attachmentId)
    .single();

  if (attachmentError || !attachment) {
    return jsonError("Attachment was not found.", 404);
  }

  const admin = createAdminClient();
  const { data: signedUrl, error: signedUrlError } = await admin.storage
    .from(attachment.bucket_id)
    .createSignedUrl(attachment.storage_path, 60);

  if (signedUrlError || !signedUrl) {
    return jsonError("Unable to create a secure file link.", 500);
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
