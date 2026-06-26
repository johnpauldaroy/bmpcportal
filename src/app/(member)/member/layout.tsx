import { AppShell } from "@/components/app-shell";
import { requireActiveMemberPage } from "@/lib/server/auth-guards";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requireActiveMemberPage();

  return <AppShell variant="member">{children}</AppShell>;
}
