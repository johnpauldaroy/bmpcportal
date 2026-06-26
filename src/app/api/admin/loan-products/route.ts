import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { loanProductSchema } from "@/features/loans/schemas";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-loan-products",
    limit: 60,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = loanProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid loan product.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data, error } = await auth.admin
    .from("loan_products")
    .upsert(
      {
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description || null,
        min_amount: parsed.data.minAmount,
        max_amount: parsed.data.maxAmount,
        min_term_months: parsed.data.minTermMonths,
        max_term_months: parsed.data.maxTermMonths,
        interest_rate_percent: parsed.data.interestRatePercent ?? null,
        is_active: parsed.data.isActive,
        updated_by: auth.user.id
      },
      { onConflict: "code" }
    )
    .select()
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ product: data });
}
