"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Settings, ShieldCheck, User } from "@/components/ui/icon";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/browser";

type ShellLayoutProps = {
  children: React.ReactNode;
  variant: "member" | "admin";
};

export function ShellLayout({ children, variant }: ShellLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasNotifications] = useState(true); // badge indicator
  const router = useRouter();
  const hasSidebar = variant === "admin";
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {hasSidebar && (
        <Sidebar variant={variant} collapsed={collapsed} onCollapse={setCollapsed} />
      )}

      <div className={hasSidebar ? `transition-all duration-300 ${collapsed ? "lg:pl-[68px]" : "lg:pl-60"}` : ""}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-2.5 shadow-sm sm:px-6">

          {/* Left: logo */}
          <div className="flex items-center gap-3">
            {!hasSidebar && (
              <Link href="/member" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
                <span className="grid size-8 place-items-center rounded-lg shadow-sm" style={{ background: "#1F52F1", color: "#fff" }}>
                  <ShieldCheck size={16} />
                </span>
                <span className="hidden text-sm font-bold text-[#0F172A] sm:block">BMPC Portal</span>
              </Link>
            )}
          </div>

          {/* Center: label */}
          <div className="flex items-center gap-2 text-sm text-[#475569]">
            <span className="font-medium text-[#0F172A]">
              {variant === "admin" ? "Admin Panel" : "Member Portal"}
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Barbaza Multi-Purpose Cooperative</span>
          </div>

          {/* Right: notification + profile dropdown */}
          <div className="flex items-center gap-1">

            {/* Notification bell */}
            <button
              className="relative rounded-lg p-2 transition-colors hover:bg-[#F1F5F9]"
              style={{ color: "#475569" }}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {hasNotifications && (
                <span
                  className="absolute right-1.5 top-1.5 size-2 rounded-full"
                  style={{ background: "#1F52F1" }}
                />
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#F1F5F9]"
                style={{ color: "#334155" }}
              >
                {/* Avatar circle */}
                <span
                  className="grid size-8 place-items-center rounded-full text-xs font-bold"
                  style={{ background: "#1B308D", color: "#fff" }}
                >
                  {variant === "admin" ? "A" : "M"}
                </span>
                <span className="hidden text-sm font-medium sm:block">
                  {variant === "admin" ? "Admin" : "My Account"}
                </span>
                <ChevronDown
                  size={14}
                  style={{
                    color: "#94A3B8",
                    transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s"
                  }}
                />
              </button>

              {/* Dropdown menu */}
              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border py-1 shadow-xl"
                  style={{ background: "#fff", borderColor: "#E2E8F0", zIndex: 50 }}
                >
                  {/* User info */}
                  <div className="border-b px-4 py-3" style={{ borderColor: "#F1F5F9" }}>
                    <p className="text-xs font-semibold text-[#0F172A]">
                      {variant === "admin" ? "Admin Account" : "Member Account"}
                    </p>
                    <p className="mt-0.5 text-xs text-[#94A3B8]">
                      {variant === "admin" ? "admin@barbazampc.coop" : "member@barbazampc.coop"}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      href={variant === "admin" ? "/admin" : "/member"}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[#F1F5F9]"
                      style={{ color: "#334155", textDecoration: "none" }}
                    >
                      <User size={15} style={{ color: "#94A3B8" }} />
                      My Profile
                    </Link>
                    <Link
                      href={variant === "admin" ? "/admin" : "/member"}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[#F1F5F9]"
                      style={{ color: "#334155", textDecoration: "none" }}
                    >
                      <Settings size={15} style={{ color: "#94A3B8" }} />
                      Settings
                    </Link>
                  </div>

                  {/* Sign out */}
                  <div className="border-t py-1" style={{ borderColor: "#F1F5F9" }}>
                    <button
                      onClick={() => { setProfileOpen(false); handleSignOut(); }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[#fef2f2]"
                      style={{ color: "#b42318" }}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
