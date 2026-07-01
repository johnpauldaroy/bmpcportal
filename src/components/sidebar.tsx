"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BadgeCheck,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileBadge,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  PiggyBank,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Upload,
  Users,
  X
} from "@/components/ui/icon";
import type { LucideIcon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/browser";

type NavItem = { href: string; label: string; icon: LucideIcon };

const memberNav: NavItem[] = [
  { href: "/member", label: "Dashboard", icon: LayoutDashboard },
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

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/imports", label: "CSV Imports", icon: Upload },
  { href: "/admin/loans", label: "Loan Reviews", icon: ScrollText },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/knowledge-base", label: "Knowledge Base", icon: Bot },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

type SidebarProps = {
  variant: "member" | "admin";
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
};

function NavItem({
  item,
  active,
  collapsed,
  onClick
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : "10px",
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "10px 0" : "10px 16px",
        borderRadius: "9999px",
        fontSize: "14px",
        fontWeight: 500,
        letterSpacing: "0.01em",
        textDecoration: "none",
        transition: "background 0.2s cubic-bezier(0.2, 0, 0, 1)",
        background: active ? "#1F52F1" : "transparent",
        color: active ? "#ffffff" : "#c8daea"
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "#1933B4";
          (e.currentTarget as HTMLElement).style.color = "#ffffff";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#c8daea";
        }
      }}
    >
      <item.icon size={20} style={{ flexShrink: 0, color: "inherit" }} />
      {!collapsed && <span style={{ color: "inherit" }}>{item.label}</span>}
    </Link>
  );
}

export function Sidebar({ variant, collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = variant === "admin" ? adminNav : memberNav;
  const logoHref = variant === "member" ? "/member" : "/admin";
  const roleLabel = variant === "admin" ? "Admin Panel" : "Member Portal";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/member" || href === "/admin") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header
        style={{ background: "#1B308D", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden"
      >
        <Link href={logoHref} className="flex items-center gap-3" style={{ textDecoration: "none" }}>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl shadow-md" style={{ background: "#1F52F1", color: "#fff" }}>
            <ShieldCheck size={19} />
          </span>
          <span>
            <span className="block text-sm font-bold leading-5" style={{ color: "#ffffff" }}>BMPC Portal</span>
            <span className="block text-xs" style={{ color: "#7a9ab8" }}>{roleLabel}</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2 transition-colors"
          style={{ color: "#c8daea", background: "transparent" }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#1B308D" }}
      >
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href={logoHref} className="flex items-center gap-3" style={{ textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl shadow-md" style={{ background: "#1F52F1", color: "#fff" }}>
              <ShieldCheck size={19} />
            </span>
            <span>
              <span className="block text-sm font-bold" style={{ color: "#ffffff" }}>BMPC Portal</span>
              <span className="block text-xs" style={{ color: "#7a9ab8" }}>{roleLabel}</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-xl p-2"
            style={{ color: "#7a9ab8" }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4a6a84" }}>
            {variant === "admin" ? "Admin" : "Member"}
          </p>
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={false}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: "#c8daea", background: "transparent" }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full shadow-xl transition-all duration-300 z-30 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
        style={{ background: "#1B308D", borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Logo */}
        <div
          className={`flex items-center py-4 ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Link href={logoHref} className="flex items-center gap-3 min-w-0" style={{ textDecoration: "none" }}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl shadow-md" style={{ background: "#1F52F1", color: "#fff" }}>
              <ShieldCheck size={19} />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold" style={{ color: "#ffffff" }}>BMPC Portal</span>
                <span className="block truncate text-xs" style={{ color: "#7a9ab8" }}>{roleLabel}</span>
              </span>
            )}
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-3 px-2">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4a6a84" }}>
              {variant === "admin" ? "Admin" : "Member"}
            </p>
          )}
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleSignOut}
            title={collapsed ? "Sign Out" : undefined}
            className={`flex w-full items-center rounded-xl text-sm font-medium transition-colors ${
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
            }`}
            style={{ color: "#c8daea", background: "transparent" }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="absolute -right-3.5 top-[72px] grid size-7 place-items-center rounded-full shadow-lg transition-colors"
          style={{ background: "#1B308D", border: "1px solid #1933B4", color: "#c8daea" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
}
