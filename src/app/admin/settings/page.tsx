import { PortalDashboard } from "@/components/portal-dashboard";
import { Landmark, Users } from "@/components/ui/icon";

const settingsNavigation = [
  {
    href: "/admin/settings/loans",
    label: "Loan settings",
    description: "Manage loan products, terms, interest rates, and availability for member applications.",
    icon: Landmark
  },
  {
    href: "/admin/settings/members",
    label: "Member settings",
    description: "Manage branches and CIF records used for member registration verification.",
    icon: Users
  }
];

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <PortalDashboard
      eyebrow="Admin settings"
      title="Settings"
      description="Manage setup screens separately from daily review queues."
      items={settingsNavigation}
    />
  );
}
