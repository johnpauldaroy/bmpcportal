import { AppShell } from "@/components/app-shell";
import { requireStaffOrAdminPage } from "@/lib/server/auth-guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaffOrAdminPage();

  return <AppShell variant="admin">{children}</AppShell>;
}
