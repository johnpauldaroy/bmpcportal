import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loanApplicationSchema } from "@/features/loans/schemas";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import { sendCoMakerInvites, type CoMakerInvite } from "@/features/loans/co-maker-invites";

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "member-loan-submit",
    limit: 12,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError("Authentication is required.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = loanApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid loan application.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  let productId = data.productId;
  let loanType = data.productCode ?? null;

  // The chosen loan product *is* the loan type, so resolve its code either way.
  const productQuery = supabase.from("loan_products").select("id, code").eq("is_active", true);
  const { data: product, error: productError } = await (productId
    ? productQuery.eq("id", productId)
    : productQuery.eq("code", data.productCode ?? "")
  ).maybeSingle();

  if (productError) {
    return jsonError(productError.message, 500);
  }

  if (!product) {
    return jsonError(
      "Loan product is not active yet. Ask an admin to apply the loan workflow migration or create this product.",
      409
    );
  }

  productId = product.id;
  loanType = product.code;

  const details = {
    loan_type: loanType,
    loan_type_other: null,
    security_offered: data.securityOffered,
    amount_in_words: data.amountInWords,
    first_payment_due: data.firstPaymentDue,
    branch_id: data.branchId,
    applicant_first_name: data.applicant.firstName,
    applicant_last_name: data.applicant.lastName,
    applicant_middle_name: emptyToNull(data.applicant.middleName),
    present_address: data.applicant.presentAddress,
    permanent_address: data.applicant.permanentAddress,
    phone_no: data.applicant.phoneNo,
    landline_no: emptyToNull(data.applicant.landlineNo),
    other_contact_no: emptyToNull(data.applicant.otherContactNo),
    applicant_email: data.applicant.email,
    civil_status: data.applicant.civilStatus,
    no_of_dependents: data.applicant.noOfDependents,
    occupation: data.applicant.occupation,
    employer: emptyToNull(data.applicant.employer),
    monthly_salary: data.applicant.monthlySalary ?? null,
    employment_status: data.applicant.employmentStatus ?? null,
    other_monthly_income: data.applicant.otherMonthlyIncome ?? null,
    tax_identification_number: emptyToNull(data.applicant.taxIdentificationNumber),
    valid_id: data.applicant.validId ?? null,
    id_number: emptyToNull(data.applicant.idNumber),
    spouse_name: emptyToNull(data.applicant.spouseName),
    spouse_employer: emptyToNull(data.applicant.spouseEmployer),
    spouse_monthly_salary: data.applicant.spouseMonthlySalary ?? null,
    share_capital_as_of: emptyToNull(
      typeof data.applicant.shareCapitalAsOf === "string"
        ? data.applicant.shareCapitalAsOf
        : undefined
    ),
    share_capital_amount: data.applicant.shareCapitalAmount ?? null
  };

  const coMakers = data.coMakers.map((coMaker, index) => ({
    co_maker_role: index === 0 ? "first" : "second",
    first_name: coMaker.firstName,
    last_name: coMaker.lastName,
    middle_name: emptyToNull(coMaker.middleName),
    contact_no: coMaker.contactNo,
    email: coMaker.email
  }));

  const realProperties = data.realProperties.map((property) => ({
    owner_role: property.ownerRole,
    description: property.description ?? null,
    land_title_number: emptyToNull(property.landTitleNumber),
    lot_number: emptyToNull(property.lotNumber),
    location: emptyToNull(property.location),
    lot_area_sqm: property.lotAreaSqm ?? null
  }));

  const attachments = data.attachments.map((attachment) => ({
    kind: attachment.kind,
    bucket_id: attachment.bucketId,
    storage_path: attachment.storagePath,
    file_name: emptyToNull(attachment.fileName),
    content_type: emptyToNull(attachment.contentType),
    byte_size: attachment.byteSize ?? null
  }));

  const result = await supabase.rpc("submit_loan_application", {
    p_actor_id: user.id,
    p_product_id: productId!,
    p_amount_requested: data.amountRequested,
    p_preferred_term_months: data.preferredTermMonths,
    p_purpose: data.purpose,
    p_details: details,
    p_co_makers: coMakers,
    p_real_properties: realProperties,
    p_attachments: attachments
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

  // Fire off co-maker invite links. Failure here must not fail the submission.
  if (payload && typeof payload === "object" && "co_maker_invites" in payload) {
    const invites = (payload.co_maker_invites ?? []) as CoMakerInvite[];
    if (invites.length > 0) {
      const applicantName = [data.applicant.firstName, data.applicant.lastName]
        .filter(Boolean)
        .join(" ");
      try {
        await sendCoMakerInvites(invites, {
          applicationNumber: String(
            (payload as { application_number?: string }).application_number ?? ""
          ),
          applicantName
        });
      } catch (inviteError) {
        console.error("Failed to send co-maker invites", inviteError);
      }
    }
  }

  return NextResponse.json(payload);
}
