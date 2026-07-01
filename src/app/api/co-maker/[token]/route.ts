import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { coMakerCompletionSchema } from "@/features/loans/schemas";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";

const tokenSchema = z.string().min(24).max(128);

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/jpg"]);

const fileFields = [
  { field: "signature", suffix: "signature" },
  { field: "idFront", suffix: "id_front" },
  { field: "idBack", suffix: "id_back" }
] as const;

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "co-maker-complete",
    limit: 10,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const { token } = await context.params;
  if (!tokenSchema.safeParse(token).success) {
    return jsonError("This invite link is invalid.", 400);
  }

  const admin = createAdminClient();
  const { data: coMaker } = await admin
    .from("loan_co_makers")
    .select("id, loan_application_id, co_maker_role, invite_status")
    .eq("invite_token", token)
    .maybeSingle();

  if (!coMaker) {
    return jsonError("This invite link is invalid.", 404);
  }
  if (coMaker.invite_status === "completed") {
    return jsonError("This co-maker form was already submitted.", 409);
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return jsonError("Invalid form submission.", 400);
  }

  const rawPayload = form.get("payload");
  const parsed = coMakerCompletionSchema
    .omit({ attachments: true })
    .safeParse(JSON.parse(typeof rawPayload === "string" ? rawPayload : "{}"));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete all required fields.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const rolePrefix = coMaker.co_maker_role === "first" ? "first_co_maker" : "second_co_maker";
  const uploaded: {
    kind: string;
    bucket_id: string;
    storage_path: string;
    file_name: string;
    content_type: string;
    byte_size: number;
  }[] = [];

  for (const slot of fileFields) {
    const file = form.get(slot.field);
    if (!(file instanceof File) || file.size === 0) {
      return jsonError(`Missing required upload: ${slot.field}.`, 400);
    }
    if (file.size > MAX_FILE_BYTES) {
      return jsonError(`${slot.field} exceeds the 2MB limit.`, 400);
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      return jsonError(`${slot.field} must be a JPEG or PNG image.`, 400);
    }

    const kind = `${rolePrefix}_${slot.suffix}`;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const storagePath = `co-makers/${coMaker.id}/${Date.now()}-${kind}.${extension}`;
    const buffer = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from("loan-attachments")
      .upload(storagePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return jsonError(`Could not upload ${slot.field}: ${uploadError.message}`, 500);
    }

    uploaded.push({
      kind,
      bucket_id: "loan-attachments",
      storage_path: storagePath,
      file_name: file.name,
      content_type: file.type,
      byte_size: file.size
    });
  }

  const details = {
    present_address: parsed.data.presentAddress,
    permanent_address: parsed.data.permanentAddress,
    phone_no: parsed.data.phoneNo,
    landline_no: emptyToNull(parsed.data.landlineNo),
    other_contact_no: emptyToNull(parsed.data.otherContactNo),
    civil_status: parsed.data.civilStatus,
    no_of_dependents: parsed.data.noOfDependents,
    occupation: parsed.data.occupation,
    employer: emptyToNull(parsed.data.employer),
    monthly_salary: parsed.data.monthlySalary ?? null,
    employment_status: parsed.data.employmentStatus ?? null,
    other_monthly_income: parsed.data.otherMonthlyIncome ?? null,
    tax_identification_number: emptyToNull(parsed.data.taxIdentificationNumber),
    valid_id: parsed.data.validId,
    id_number: parsed.data.idNumber,
    spouse_name: emptyToNull(parsed.data.spouseName),
    share_capital_as_of: emptyToNull(
      typeof parsed.data.shareCapitalAsOf === "string" ? parsed.data.shareCapitalAsOf : undefined
    ),
    share_capital_amount: parsed.data.shareCapitalAmount ?? null
  };

  const result = await admin.rpc("complete_co_maker", {
    p_invite_token: token,
    p_details: details,
    p_attachments: uploaded
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
