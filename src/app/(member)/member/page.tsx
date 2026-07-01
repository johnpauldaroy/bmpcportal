import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Coins,
  FileBadge,
  HeartPulse,
  Landmark,
  PiggyBank,
  Shield,
  Users
} from "@/components/ui/icon";
// Landmark & PiggyBank used in BalanceHero (client), kept here for iconMap
import Link from "next/link";
import { Megaphone } from "@/components/ui/icon";
import { memberNavigation } from "@/config/navigation";
import { getPublishedAnnouncements } from "@/features/announcements/data";
import { AnnouncementsFeed } from "@/features/announcements/announcements-feed";
import { BalanceHero } from "@/features/balances/balance-hero";
import {
  formatSnapshotAmount,
  formatSnapshotDate,
  getLatestMemberSnapshots
} from "@/features/balances/snapshot-data";
import { StatusBadge } from "@/components/ui/status-badge";

const iconMap: Record<string, React.ElementType> = {
  Balances: PiggyBank,
  Loans: Landmark,
  Insurance: Shield,
  Mortuary: HeartPulse,
  Points: Coins,
  Referrals: Users,
  "Digital ID": BadgeCheck,
  Certificates: FileBadge,
  "AI Assistant": Bot
};

const descriptions: Record<string, string> = {
  Balances: "View latest savings and share capital snapshots.",
  Loans: "Apply for loans and track application status.",
  Insurance: "Check availments, expiry dates, and renewals.",
  Mortuary: "View mortuary availment and claim records.",
  Points: "Review loyalty point transactions and redemptions.",
  Referrals: "Share referral codes and track rewards.",
  "Digital ID": "View your membership ID and QR code.",
  Certificates: "Access your digital share certificates.",
  "AI Assistant": "Ask BMPC policy questions to the AI."
};

const colorMap: Record<string, string> = {
  Balances: "bg-[#DAE7FF] text-[#3673FC] group-hover:bg-[#3673FC] group-hover:text-white",
  Loans: "bg-[#D1FAE5] text-[#059669] group-hover:bg-[#059669] group-hover:text-white",
  Insurance: "bg-[#E0E7FF] text-[#4F46E5] group-hover:bg-[#4F46E5] group-hover:text-white",
  Mortuary: "bg-[#FEE2E2] text-[#DC2626] group-hover:bg-[#DC2626] group-hover:text-white",
  Points: "bg-[#FEF3C7] text-[#D97706] group-hover:bg-[#D97706] group-hover:text-white",
  Referrals: "bg-[#CCFBF1] text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white",
  "Digital ID": "bg-[#CFFAFE] text-[#0891B2] group-hover:bg-[#0891B2] group-hover:text-white",
  Certificates: "bg-[#FFEDD5] text-[#EA580C] group-hover:bg-[#EA580C] group-hover:text-white",
  "AI Assistant": "bg-[#EDE9FE] text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white"
};

export default async function MemberDashboardPage() {
  const [snapshots, announcements] = await Promise.all([
    getLatestMemberSnapshots(),
    getPublishedAnnouncements(6).catch(() => [])
  ]);

  return (
    <div className="grid gap-8">
      <BalanceHero rows={[
        {
          icon: "savings",
          label: "Savings Balance",
          amount: formatSnapshotAmount(snapshots.savings?.amount ?? null),
          date: `As of ${formatSnapshotDate(snapshots.savings?.effectiveDate ?? null)}`
        },
        {
          icon: "share_capital",
          label: "Share Capital",
          amount: formatSnapshotAmount(snapshots.share_capital?.amount ?? null),
          date: `As of ${formatSnapshotDate(snapshots.share_capital?.effectiveDate ?? null)}`
        }
      ]} />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Account Status", value: "Active", tone: "success" as const },
          { label: "Open Loans", value: "—", tone: "neutral" as const },
          { label: "Insurance", value: "Active", tone: "success" as const },
          { label: "Loyalty Points", value: "—", tone: "neutral" as const }
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <p className="text-xs text-[#94A3B8]">{stat.label}</p>
            <div className="mt-2">
              <StatusBadge tone={stat.tone}>{stat.value}</StatusBadge>
            </div>
          </div>
        ))}
      </div>

      {/* Services grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3673FC]">
              Services
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#0F172A]">What would you like to do?</h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberNavigation.map((item) => {
            const Icon = iconMap[item.label] ?? item.icon;
            const colorClass = colorMap[item.label] ?? "bg-[#DAE7FF] text-[#3673FC] group-hover:bg-[#3673FC] group-hover:text-white";
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all hover:border-[#3673FC]/40 hover:shadow-md"
              >
                <div className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors ${colorClass}`}>
                  <Icon aria-hidden size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#0F172A]">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#475569]">
                    {descriptions[item.label]}
                  </p>
                </div>
                <ArrowRight
                  className="ml-auto mt-0.5 shrink-0 text-[#CBD5E1] transition-colors group-hover:text-[#3673FC]"
                  aria-hidden
                  size={16}
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Announcements & News */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3673FC]">
              Announcements
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#0F172A]">News &amp; Events</h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#DAE7FF", color: "#3673FC" }}>
            <Megaphone size={13} />
            From BMPC
          </div>
        </div>
        <AnnouncementsFeed items={announcements} />
      </section>
    </div>
  );
}
