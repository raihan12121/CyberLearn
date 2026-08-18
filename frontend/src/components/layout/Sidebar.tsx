"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Terminal,
  Swords,
  Users,
  Award,
  Trophy,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Zap,
  X,
  GraduationCap,
  BadgeCheck,
  Activity,
  Server,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const studentNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "AI Cyber Coach", href: "/ai-coach", icon: Bot },
      { label: "Cyber Portfolio", href: "/portfolio/me", icon: User },
    ],
  },
  {
    title: "Learn Hub",
    items: [
      { label: "Video & Text Courses", href: "/courses", icon: BookOpen },
      { label: "Live Batches", href: "/batches", icon: GraduationCap },
      { label: "Practice Labs", href: "/labs", icon: Terminal },
    ],
  },
  {
    title: "Compete Hub",
    items: [
      { label: "CTF Challenges", href: "/challenges", icon: Swords },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "Certificates & Exams", href: "/certificates", icon: Award },
      { label: "ID Verification", href: "/verify-nid", icon: BadgeCheck },
      { label: "Community", href: "/community", icon: Users },
    ],
  },
];

const adminNavSections: NavSection[] = [
  {
    title: "Admin Command Center",
    items: [
      { label: "Admin Overview", href: "/admin", icon: Shield },
      { label: "User Management", href: "/admin?tab=users", icon: Users },
      { label: "KYC Verification", href: "/admin?tab=verifications", icon: BadgeCheck },
      { label: "Active Sandboxes", href: "/admin?tab=containers", icon: Terminal },
      { label: "System Telemetry", href: "/admin?tab=telemetry", icon: Activity },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export default function Sidebar({
  mobileOpen = false,
  setMobileOpen,
  collapsed: collapsedProp,
  setCollapsed: setCollapsedProp,
}: SidebarProps) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = collapsedProp !== undefined ? collapsedProp : internalCollapsed;
  const setCollapsed = setCollapsedProp || setInternalCollapsed;
  
  const { user, fetchUser } = useAuthStore();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchUser().catch(() => {});
  }, [fetchUser]);


  const handleLinkClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const sectionsToRender = isAdmin ? adminNavSections : studentNavSections;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen bg-surface border-r border-border z-50
          flex flex-col transition-all duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-[72px]" : "w-[240px]"}
        `}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAdmin ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"}`}>
              <Shield className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground tracking-tight">
                  CyberLearn
                </span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen?.(false)}
            className="lg:hidden p-1 rounded-[var(--radius)] text-foreground-muted hover:text-foreground hover:bg-surface-elevated cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
          {sectionsToRender.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="px-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname?.startsWith(item.href.split("?")[0]));

                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)]
                          text-sm font-medium transition-all duration-200
                          ${
                            isActive
                              ? isAdmin
                                ? "bg-amber-500/20 text-amber-300 font-semibold border-l-2 border-amber-400"
                                : "bg-primary/10 text-primary border-l-2 border-primary"
                              : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                          }
                          ${collapsed ? "justify-center px-0" : ""}
                        `}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isAdmin ? "text-amber-400" : "text-primary") : ""}`} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-2 shrink-0">
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)]
              text-sm font-medium text-foreground-secondary
              hover:text-foreground hover:bg-surface-elevated transition-all duration-200
              ${collapsed ? "justify-center px-0" : ""}
            `}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          {/* Collapse Button (desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 mt-1 rounded-[var(--radius)] text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-all duration-200 cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
