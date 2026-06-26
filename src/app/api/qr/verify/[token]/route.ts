import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const paramsSchema = z.object({
  token: z.string().min(24).max(128)
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: "Invalid token." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: membershipId } = await admin
    .from("membership_ids")
    .select("id, member_id, status, issued_at, revoked_at")
    .eq("qr_token", parsed.data.token)
    .maybeSingle();

  const verified = membershipId?.status === "issued" && !membershipId.revoked_at;

  await admin.from("qr_verification_events").insert({
    membership_id: membershipId?.id ?? null,
    qr_token: parsed.data.token,
    verified
  });

  if (!membershipId) {
    return NextResponse.json({ valid: false, reason: "Membership ID was not found." });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, member_number, status")
    .eq("id", membershipId.member_id)
    .single();

  return NextResponse.json({
    valid: verified && profile?.status === "active",
    member: {
      fullName: profile?.full_name ?? null,
      memberNumber: profile?.member_number ?? null,
      status: profile?.status ?? null
    },
    document: {
      status: membershipId.status,
      issuedAt: membershipId.issued_at
    },
    reason: verified ? null : "Membership ID is not currently issued."
  });
}
