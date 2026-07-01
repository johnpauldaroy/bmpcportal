import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";

const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

/** POST = maker accepts and signs the agreement (multipart: signature + acknowledged). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "member-loan-agreement-accept",
    limit: 12,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return jsonError("You must be signed in.", 401);

  const { loanId } = await params;

  // Confirm ownership of the application.
  const { data: application } = await supabase
    .from("loan_applications")
    .select("id, member_id")
    .eq("id", loanId)
    .eq("member_id", user.id)
    .maybeSingle();
  if (!application) return jsonError("Loan application was not found.", 404);

  // Agreement must exist and be in 'sent' state.
  const { data: agreement } = await supabase
    .from("loan_agreements")
    .select("id, status")
    .eq("loan_application_id", loanId)
    .maybeSingle();
  if (!agreement) return jsonError("No agreement to accept.", 404);
  if (agreement.status !== "sent") {
    return jsonError("This agreement is not awaiting your acceptance.", 409);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Invalid form submission.", 400);

  const acknowledged = form.get("acknowledged");
  if (acknowledged !== "true") {
    return jsonError("You must acknowledge the terms to accept.", 400);
  }

  const admin = createAdminClient();
  let signatureBucket: string | null = null;
  let signaturePath: string | null = null;

  const signature = form.get("signature");
  if (!(signature instanceof File) || signature.size === 0) {
    return jsonError("Please attach your signature before accepting.", 400);
  }

  if (signature.size > MAX_SIGNATURE_BYTES) {
    return jsonError("Signature image is too large (max 2MB).", 400);
  }

  const extension = (signature.name.split(".").pop() || "png").toLowerCase();
  const storagePath = `agreements/${loanId}/${Date.now()}-maker-signature.${extension}`;
  const buffer = new Uint8Array(await signature.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("loan-attachments")
    .upload(storagePath, buffer, { contentType: signature.type, upsert: true });
  if (uploadError) {
    return jsonError(`Could not upload signature: ${uploadError.message}`, 500);
  }
  signatureBucket = "loan-attachments";
  signaturePath = storagePath;

  const { error } = await admin
    .from("loan_agreements")
    .update({
      status: "accepted",
      maker_acknowledged: true,
      accepted_at: new Date().toISOString(),
      maker_signature_bucket: signatureBucket,
      maker_signature_path: signaturePath
    })
    .eq("loan_application_id", loanId);

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ ok: true });
}
