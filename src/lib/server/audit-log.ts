import type { Json } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "csv_import.cancelled"
  | "csv_import.failed"
  | "csv_import.previewed"
  | "csv_import.committed"
  | "loan.application_submitted"
  | "loan.status_changed"
  | "knowledge_base.synced"
  | "admin.record_updated";

export type AuditLogInput = {
  actorId: string;
  action: AuditAction;
  targetTable?: string;
  targetId?: string;
  metadata?: Json;
  severity?: "info" | "warning" | "critical";
};

export async function writeAuditLog(input: AuditLogInput) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", input.actorId)
    .maybeSingle();

  return admin.from("audit_logs").insert({
    actor_id: input.actorId,
    actor_role: profile?.role,
    action: input.action,
    target_table: input.targetTable,
    target_id: input.targetId,
    severity: input.severity ?? "info",
    metadata: input.metadata ?? {}
  });
}
