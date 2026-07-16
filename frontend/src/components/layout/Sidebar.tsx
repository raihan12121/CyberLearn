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
} from "lucide-react";
import { api } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Courses", href: "/courses", icon: BookOpen },
  { label: "Practice Labs", href: "/labs", icon: Terminal },
  { label: "Challenges", href: "/challenges", icon: Swords },
  { label: "Community", href: "/community", icon: Users },
  { label: "Certificates", href: "/certificates", icon: Award },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "AI Coach", href: "/ai-coach", icon: Bot },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
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

  const items = isAdmin
    ? [...navItems, { label: "Admin Portal", href: "/admin", icon: Shield }]
    : navItems;

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen bg-surface border-r border-border z-40
        flex flex-col transition-all duration-300 ease-out
        ${collapsed ? "w-[72px]" : "w-[240px]"}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-foreground tracking-tight">
            CyberLearn
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)]
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
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 shrink-0">
        <Link
          href="/settings"
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
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 rounded-[var(--radius)] text-foreground-muted hover:text-foreground-secondary hover:bg-surface-elevated transition-all duration-200 cursor-pointer"
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
  );
}
