import { z } from "zod";
import { requireStaffOrAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import { writeAuditLog } from "@/lib/server/audit-log";

const notificationSchema = z.object({
  memberNumber: z.string().trim().min(3).max(40).toUpperCase(),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(1000)
});

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "admin-notification-create",
    limit: 60,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const auth = await requireStaffOrAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = notificationSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid notification details.");
  }

  const { data: member, error: memberError } = await auth.admin
    .from("profiles")
    .select("id, full_name, member_number, role, status")
    .eq("member_number", parsed.data.memberNumber)
    .single();

  if (memberError || !member || member.role !== "member") {
    return jsonError("Member was not found.", 404);
  }

  if (member.status !== "active") {
    return jsonError("Notifications can only be queued for active members.", 409);
  }

  const { data: notification, error } = await auth.admin
    .from("notifications")
    .insert({
      member_id: member.id,
      channel: "in_app",
      status: "queued",
      title: parsed.data.title,
      body: parsed.data.body,
      metadata: {
        created_by: auth.user.id
      }
    })
    .select()
    .single();

  if (error || !notification) {
    return jsonError(error?.message ?? "Unable to queue notification.", 500);
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "admin.record_updated",
    targetTable: "notifications",
    targetId: notification.id,
    metadata: {
      member_id: member.id,
      title: parsed.data.title
    }
  });

  return jsonOk({
    notification: {
      ...notification,
      member: {
        full_name: member.full_name,
        member_number: member.member_number
      }
    }
  }, 201);
}
