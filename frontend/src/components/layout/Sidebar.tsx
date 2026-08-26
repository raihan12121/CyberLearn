"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
      { label: "Overview & Health", href: "/admin?tab=overview", tabId: "overview", icon: Activity },
      { label: "Users & Roles", href: "/admin?tab=users", tabId: "users", icon: Users },
      { label: "Courses & Lessons", href: "/admin?tab=courses", tabId: "courses", icon: BookOpen },
      { label: "Exams & Questions", href: "/admin?tab=exams", tabId: "exams", icon: FileCheck },
      { label: "Live Cohorts", href: "/admin?tab=batches", tabId: "batches", icon: GraduationCap },
      { label: "Labs & Sandboxes", href: "/admin?tab=labs", tabId: "labs", icon: Terminal },
      { label: "Certificates Registry", href: "/admin?tab=certificates", tabId: "certificates", icon: Award },
      { label: "KYC Verification", href: "/admin?tab=verifications", tabId: "verifications", icon: BadgeCheck },
      { label: "Community Moderation", href: "/admin?tab=community", tabId: "community", icon: MessageSquare },
      { label: "Financials & Billing", href: "/admin?tab=billing", tabId: "billing", icon: DollarSign },
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
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "overview";

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
          fixed top-0 left-0 h-screen bg-[#0F172A] border-r border-[#1E293B] z-50
          flex flex-col transition-all duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-[68px]" : "w-[240px]"}
        `}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[#1E293B] shrink-0 bg-[#0C1222]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/25 flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/10">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base font-bold text-white tracking-tight truncate">
                  CyberLearn
                </span>
                {isAdmin ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Admin
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/50">
                    PRO
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen?.(false)}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
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
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  let isActive = false;
                  if (pathname === "/admin" && item.tabId) {
                    isActive = currentTab === item.tabId;
                  } else {
                    isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && !item.href.includes("?") && pathname?.startsWith(item.href));
                  }

                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`
                          flex items-center gap-2.5 px-3 py-2 rounded-md
                          text-xs font-medium transition-all duration-150
                          ${
                            isActive
                              ? "bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-500 pl-2.5 shadow-sm"
                              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                          }
                          ${collapsed ? "justify-center px-0 pl-0 border-l-0" : ""}
                        `}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
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
        <div className="border-t border-[#1E293B] p-2.5 shrink-0 space-y-1 bg-[#0C1222]">
          <button
            onClick={toggleTheme}
            className={`
              w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md
              text-xs font-medium text-slate-400
              hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-150 cursor-pointer
              ${collapsed ? "justify-center px-0" : ""}
            `}
            title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 shrink-0 text-slate-400" />
            ) : (
              <Moon className="w-4 h-4 shrink-0 text-slate-400" />
            )}
            {!collapsed && <span>{resolvedTheme === "dark" ? "Light Theme" : "Dark Theme"}</span>}
          </button>

          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={`
              flex items-center gap-2.5 px-3 py-1.5 rounded-md
              text-xs font-medium text-slate-400
              hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-150
              ${collapsed ? "justify-center px-0" : ""}
            `}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4 shrink-0 text-slate-400" />
            {!collapsed && <span>Settings</span>}
          </Link>

          {/* Collapse Button (desktop) */}
          <button
            onClick={() => setCollapsed?.(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-1.5 mt-0.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-150 cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
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
    <Suspense fallback={<div className="w-[240px] h-screen bg-[#0F172A]" />}>
      <SidebarNavContent
        {...props}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
    </Suspense>
  );
}
