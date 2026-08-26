"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  Sun,
  Moon,
  FileCheck,
  DollarSign,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useTheme } from "@/lib/theme";

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    tabId?: string;
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
      { label: "Courses", href: "/courses", icon: BookOpen },
      { label: "Live Batches", href: "/batches", icon: GraduationCap },
      { label: "Labs & Sandboxes", href: "/labs", icon: Terminal },
    ],
  },
  {
    title: "Certify & Compete",
    items: [
      { label: "CTF Challenges", href: "/challenges", icon: Swords },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "Certification Exams", href: "/exams", icon: FileCheck },
      { label: "Issued Certificates", href: "/certificates", icon: Award },
      { label: "NID Identity Verify", href: "/verify-nid", icon: BadgeCheck },
      { label: "Community Forum", href: "/community", icon: Users },
    ],
  },
];

const adminNavSections: NavSection[] = [
  {
    title: "Admin Command Center",
    items: [
      { label: "Overview & Health", href: "/admin", icon: Activity },
      { label: "Users & Roles", href: "/admin/users", icon: Users },
      { label: "Courses & Lessons", href: "/admin/courses", icon: BookOpen },
      { label: "Exams & Questions", href: "/admin/exams", icon: FileCheck },
      { label: "Live Cohorts", href: "/admin/batches", icon: GraduationCap },
      { label: "Labs & Sandboxes", href: "/admin/labs", icon: Terminal },
      { label: "Certificates Registry", href: "/admin/certificates", icon: Award },
      { label: "KYC Verification", href: "/admin/verifications", icon: BadgeCheck },
      { label: "Community Moderation", href: "/admin/community", icon: MessageSquare },
      { label: "Financials & Billing", href: "/admin/billing", icon: DollarSign },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

function SidebarNavContent({
  mobileOpen = false,
  setMobileOpen,
  collapsed = false,
  setCollapsed,
}: SidebarProps) {
  const pathname = usePathname();

  const { user, fetchUser } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const { resolvedTheme, toggleTheme } = useTheme();

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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen bg-surface border-r border-border z-50
          flex flex-col transition-all duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-[68px]" : "w-[240px]"}
        `}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border shrink-0 bg-surface-elevated/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/10">
              <Shield className="w-4 h-4 text-sky-400" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base font-bold text-foreground tracking-tight truncate">
                  Cyber<span className="text-sky-400">Learn</span>
                </span>
                {isAdmin ? (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    Admin
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    PRO
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen?.(false)}
            className="lg:hidden p-1.5 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-elevated cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {sectionsToRender.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="px-3 text-[10px] font-bold text-foreground-muted uppercase tracking-widest mb-2">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  let isActive = false;
                  if (item.href === "/admin") {
                    isActive = pathname === "/admin";
                  } else if (item.href === "/dashboard") {
                    isActive = pathname === "/dashboard";
                  } else {
                    isActive = pathname === item.href || (pathname ? pathname.startsWith(item.href) : false);
                  }

                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`
                          flex items-center gap-2.5 px-3 py-2 rounded-lg
                          text-xs font-medium transition-all duration-150
                          ${
                            isActive
                              ? "bg-gradient-to-r from-sky-500/15 to-indigo-500/10 text-sky-400 font-semibold border-l-2 border-sky-400 pl-2.5 shadow-sm"
                              : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated/70"
                          }
                          ${collapsed ? "justify-center px-0 pl-0 border-l-0" : ""}
                        `}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sky-400" : "text-foreground-muted"}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Bar */}
        <div className="border-t border-border p-2.5 shrink-0 space-y-1 bg-surface-elevated/50">
          <button
            onClick={toggleTheme}
            className={`
              w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg
              text-xs font-medium text-foreground-secondary
              hover:text-foreground hover:bg-surface-elevated transition-all duration-150 cursor-pointer
              ${collapsed ? "justify-center px-0" : ""}
            `}
            title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 shrink-0 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 shrink-0 text-indigo-400" />
            )}
            {!collapsed && <span>{resolvedTheme === "dark" ? "Light Theme" : "Dark Theme"}</span>}
          </button>

          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={`
              flex items-center gap-2.5 px-3 py-1.5 rounded-lg
              text-xs font-medium text-foreground-secondary
              hover:text-foreground hover:bg-surface-elevated transition-all duration-150
              ${collapsed ? "justify-center px-0" : ""}
            `}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4 shrink-0 text-foreground-muted" />
            {!collapsed && <span>Settings</span>}
          </Link>

          {/* Collapse Button (desktop) */}
          <button
            onClick={() => setCollapsed?.(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-1.5 mt-0.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-all duration-150 cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted font-medium">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default function Sidebar(props: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = props.collapsed !== undefined ? props.collapsed : internalCollapsed;
  const setCollapsed = props.setCollapsed || setInternalCollapsed;

  return (
    <Suspense fallback={<div className="w-[240px] h-screen bg-surface" />}>
      <SidebarNavContent
        {...props}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
    </Suspense>
  );
}
