import { z } from "zod";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import { writeAuditLog } from "@/lib/server/audit-log";
import { sendEmail } from "@/lib/server/email";
import { memberStatusEmail } from "@/lib/server/email-templates";
import { getServerEnv } from "@/lib/env";

const memberStatusLabel: Record<"active" | "suspended" | "closed", string> = {
  active: "Active",
  suspended: "Suspended",
  closed: "Closed"
};

const statusSchema = z.object({
  status: z.enum(["active", "suspended", "closed"])
});

type UntypedAdminClient = {
  from: (table: string) => {
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: string }
    ) => Promise<{ error: { message: string } | null }>;
  };
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-member-status",
    limit: 60,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid member status.");
  }

  const { memberId } = await params;
  const { data: existingProfile, error: existingError } = await auth.admin
    .from("profiles")
    .select("id, role, status")
    .eq("id", memberId)
    .single();

  if (existingError || !existingProfile || existingProfile.role !== "member") {
    return jsonError("Member profile was not found.", 404);
  }

  const { data: profile, error } = await auth.admin
    .from("profiles")
    .update({
      status: parsed.data.status,
      updated_by: auth.user.id
    })
    .eq("id", memberId)
    .select("id, full_name, email, phone, member_number, role, status, created_at")
    .single();

  if (error || !profile) {
    return jsonError(error?.message ?? "Unable to update member status.", 500);
  }

  if (parsed.data.status === "active") {
    const admin = auth.admin as unknown as UntypedAdminClient;
    const today = new Date().toISOString().slice(0, 10);

    const memberProfileResult = await admin.from("member_profiles").upsert(
      {
        member_id: memberId,
        membership_date: today,
        updated_by: auth.user.id
      },
      { onConflict: "member_id" }
    );

    const membershipIdResult = await admin.from("membership_ids").upsert(
      {
        member_id: memberId,
        status: "issued",
        updated_by: auth.user.id
      },
      { onConflict: "member_id" }
    );

    const preferencesResult = await admin.from("notification_preferences").upsert(
      {
        member_id: memberId,
        in_app_enabled: true,
        updated_by: auth.user.id
      },
      { onConflict: "member_id" }
    );

    const activationSetupError =
      memberProfileResult.error ?? membershipIdResult.error ?? preferencesResult.error;

    if (activationSetupError) {
      await auth.admin
        .from("profiles")
        .update({
          status: existingProfile.status,
          updated_by: auth.user.id
        })
        .eq("id", memberId);
      return jsonError(activationSetupError.message, 500);
    }
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "admin.record_updated",
    targetTable: "profiles",
    targetId: memberId,
    metadata: {
      status_before: existingProfile.status,
      status_after: parsed.data.status
    }
  });

  // Notify the member of their new account status. Non-blocking.
  try {
    if (profile.email) {
      const { NEXT_PUBLIC_APP_URL } = getServerEnv();
      const { subject, html } = memberStatusEmail({
        memberName: profile.full_name ?? "",
        statusLabel: memberStatusLabel[parsed.data.status],
        isActive: parsed.data.status === "active",
        url: `${NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/login`
      });
      await sendEmail({ to: profile.email, subject, html });
    }
  } catch (emailError) {
    console.error("Failed to send member status email", emailError);
  }

  return jsonOk({ profile });
}
