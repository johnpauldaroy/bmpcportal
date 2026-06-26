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
} from "lucide-react";
// Landmark & PiggyBank used in BalanceHero (client), kept here for iconMap
import Link from "next/link";
import { Megaphone } from "lucide-react";
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
  Balances: "bg-[#e5f3ef] text-[#136f63] group-hover:bg-[#136f63] group-hover:text-white",
  Loans: "bg-[#e5edf9] text-[#2563eb] group-hover:bg-[#2563eb] group-hover:text-white",
  Insurance: "bg-[#f0f0ff] text-[#6366f1] group-hover:bg-[#6366f1] group-hover:text-white",
  Mortuary: "bg-[#fff0f0] text-[#ef4444] group-hover:bg-[#ef4444] group-hover:text-white",
  Points: "bg-[#fffbe5] text-[#d99b2b] group-hover:bg-[#d99b2b] group-hover:text-white",
  Referrals: "bg-[#f0fdf4] text-[#16a34a] group-hover:bg-[#16a34a] group-hover:text-white",
  "Digital ID": "bg-[#e5f3ef] text-[#136f63] group-hover:bg-[#136f63] group-hover:text-white",
  Certificates: "bg-[#fff7ed] text-[#ea580c] group-hover:bg-[#ea580c] group-hover:text-white",
  "AI Assistant": "bg-[#f5f0ff] text-[#9333ea] group-hover:bg-[#9333ea] group-hover:text-white"
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
          <div key={stat.label} className="rounded-xl border border-[#d8e1ea] bg-white p-4 shadow-sm">
            <p className="text-xs text-[#8a99a8]">{stat.label}</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#136f63]">
              Services
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#10233f]">What would you like to do?</h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberNavigation.map((item) => {
            const Icon = iconMap[item.label] ?? item.icon;
            const colorClass = colorMap[item.label] ?? "bg-[#e5f3ef] text-[#136f63] group-hover:bg-[#136f63] group-hover:text-white";
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-4 rounded-xl border border-[#d8e1ea] bg-white p-5 shadow-sm transition-all hover:border-[#136f63]/40 hover:shadow-md"
              >
                <div className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors ${colorClass}`}>
                  <Icon aria-hidden size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#10233f]">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#5f6c7b]">
                    {descriptions[item.label]}
                  </p>
                </div>
                <ArrowRight
                  className="ml-auto mt-0.5 shrink-0 text-[#c8d5e0] transition-colors group-hover:text-[#136f63]"
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#136f63]">
              Announcements
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#10233f]">News &amp; Events</h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#e5f3ef", color: "#136f63" }}>
            <Megaphone size={13} />
            From BMPC
          </div>
        </div>
        <AnnouncementsFeed items={announcements} />
      </section>
    </div>
  );
}
