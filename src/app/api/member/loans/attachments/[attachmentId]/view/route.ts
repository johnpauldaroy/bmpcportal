import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError("Authentication is required.", 401);
  }

  const { attachmentId } = await params;
  const { data: attachment, error: attachmentError } = await supabase
    .from("loan_attachments")
    .select("id, loan_application_id, bucket_id, storage_path")
    .eq("id", attachmentId)
    .single();

  if (attachmentError || !attachment) {
    return jsonError("Attachment was not found.", 404);
  }

  const { data: application, error: applicationError } = await supabase
    .from("loan_applications")
    .select("id")
    .eq("id", attachment.loan_application_id)
    .eq("member_id", user.id)
    .single();

  if (applicationError || !application) {
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
