import {
  BadgeCheck,
  Bell,
  Bot,
  Coins,
  FileBadge,
  HeartPulse,
  Landmark,
  Megaphone,
  PiggyBank,
  ScrollText,
  Shield,
  Upload,
  Users
} from "lucide-react";

export const memberNavigation = [
  { href: "/member/balances", label: "Balances", icon: PiggyBank },
  { href: "/member/loans", label: "Loans", icon: Landmark },
  { href: "/member/insurance", label: "Insurance", icon: Shield },
  { href: "/member/mortuary", label: "Mortuary", icon: HeartPulse },
  { href: "/member/points", label: "Points", icon: Coins },
  { href: "/member/referrals", label: "Referrals", icon: Users },
  { href: "/member/id", label: "Digital ID", icon: BadgeCheck },
  { href: "/member/certificates", label: "Certificates", icon: FileBadge },
  { href: "/member/assistant", label: "AI Assistant", icon: Bot }
];

export const adminNavigation = [
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/imports", label: "CSV imports", icon: Upload },
  { href: "/admin/loans", label: "Loan reviews", icon: ScrollText },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/knowledge-base", label: "Knowledge base", icon: Bot },
  { href: "/admin/notifications", label: "Notifications", icon: Bell }
];
