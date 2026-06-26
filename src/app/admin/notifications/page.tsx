import { PageHeader } from "@/components/page-header";
import { AdminNotificationPanel } from "@/features/notifications/admin-notification-panel";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  const memberIds = Array.from(new Set((notifications ?? []).map((row) => row.member_id)));
  const { data: members } =
    memberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, member_number")
          .in("id", memberIds)
      : { data: [] };
  const memberById = new Map((members ?? []).map((member) => [member.id, member]));
  const hydratedNotifications = (notifications ?? []).map((notification) => ({
    ...notification,
    member: memberById.get(notification.member_id) ?? null
  }));

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Queue in-app notifications to verified members and review recent delivery rows."
      />
      <AdminNotificationPanel notifications={hydratedNotifications} />
    </>
  );
}
