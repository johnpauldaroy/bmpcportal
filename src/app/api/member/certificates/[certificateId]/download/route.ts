import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/http";

const CERTIFICATE_BUCKET = "share-certificates";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError("Authentication is required.", 401);
  }

  const { certificateId } = await params;
  const { data: certificate, error } = await supabase
    .from("share_certificates")
    .select("id, member_id, status, storage_path")
    .eq("id", certificateId)
    .eq("member_id", user.id)
    .single();

  if (error || !certificate) {
    return jsonError("Certificate was not found.", 404);
  }

  if (certificate.status !== "issued" || !certificate.storage_path) {
    return jsonError("Certificate file is not available.", 409);
  }

  const admin = createAdminClient();
  const { data: signedUrl, error: signedUrlError } = await admin.storage
    .from(CERTIFICATE_BUCKET)
    .createSignedUrl(certificate.storage_path, 60);

  if (signedUrlError || !signedUrl) {
    return jsonError("Unable to create a secure download link.", 500);
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
