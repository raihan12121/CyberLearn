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
} from "lucide-react";
import { api } from "@/lib/api";

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const navSections: NavSection[] = [
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
      { label: "1v1 Speed Duels", href: "/challenges/duels", icon: Zap },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "Certificates & Exams", href: "/certificates", icon: Award },
      { label: "ID Verification", href: "/verify-nid", icon: BadgeCheck },
      { label: "Community", href: "/community", icon: Users },
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    api.getMe()
      .then((user) => {
        if (user && user.role === "admin") {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleLinkClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

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
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-foreground tracking-tight">
                CyberLearn
              </span>
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
        <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-6">
          {navSections.map((section) => (
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
                    (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-[var(--radius)]
                          text-sm font-medium transition-all duration-200
                          ${
                            isActive
                              ? "bg-primary/10 text-primary border-l-2 border-primary"
                              : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                          }
                          ${collapsed ? "justify-center px-0" : ""}
                        `}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

        {isAdmin && (
          <div>
            {!collapsed && (
              <h3 className="px-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                Admin
              </h3>
            )}
            <ul className="space-y-1">
              <li>
                <Link
                  href="/admin"
                  onClick={handleLinkClick}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-[var(--radius)]
                    text-sm font-medium transition-all duration-200
                    ${
                      pathname?.startsWith("/admin")
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                    }
                    ${collapsed ? "justify-center px-0" : ""}
                  `}
                  title={collapsed ? "Admin Portal" : undefined}
                >
                  <Shield className="w-4 h-4 shrink-0 text-amber-400" />
                  {!collapsed && <span className="text-amber-400 font-semibold">Admin Portal</span>}
                </Link>
              </li>
            </ul>
          </div>
        )}
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
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 mt-1 rounded-[var(--radius)] text-foreground-muted hover:text-foreground-secondary hover:bg-surface-elevated transition-all duration-200 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}

