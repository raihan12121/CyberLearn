"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  User,
  Settings,
  Award,
  Shield,
  LogOut,
  Zap,
  Sparkles,
} from "lucide-react";
import Avatar from "../ui/Avatar";
import { api } from "@/lib/api";
import { signOutFirebase } from "@/lib/firebase";

interface TopNavProps {
  onMenuClick?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  role: string;
  xp: number;
  avatar_url?: string;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getMe()
      .then((data) => {
        if (data) {
          setUser(data);
        }
      })
      .catch((err) => console.error("Error loading user profile in topnav:", err));
  }, []);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await signOutFirebase();
    } catch {}
    api.logout();
    router.push("/login");
  };

  const displayName = user?.full_name || user?.username || (user?.email ? user.email.split("@")[0] : "User");
  const firstName = displayName.split(" ")[0];
  const userRole = user?.role || "student";
  const userXp = user?.xp || 0;

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated shrink-0 cursor-pointer transition-colors"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search courses, labs..."
            className="w-full bg-surface-elevated border border-border rounded-[var(--radius-lg)] pl-9 pr-3 sm:pl-10 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-3 sm:ml-6 shrink-0">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-all duration-200 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-[var(--radius-lg)] hover:bg-surface-elevated transition-all duration-200 cursor-pointer border border-transparent hover:border-border"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <Avatar name={displayName} src={user?.avatar_url} size="sm" status="online" />
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                {firstName}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180 text-primary" : ""
                }`}
              />
            </div>
          </button>

          {/* Dropdown Menu Modal */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden z-50 divide-y divide-border/60"
              >
                {/* User Summary Header */}
                <div className="p-4 bg-surface-elevated/40">
                  <div className="flex items-center gap-3">
                    <Avatar name={displayName} src={user?.avatar_url} size="md" status="online" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                      <p className="text-xs text-foreground-muted truncate">{user?.email || "student@cyberlearn.io"}</p>
                    </div>
                  </div>

                  {/* Badges / Stats row */}
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-border/40">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <Zap className="w-3.5 h-3.5" />
                      {userXp.toLocaleString()} XP
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {userRole}
                    </span>
                  </div>
                </div>

                {/* Nav Links */}
                <div className="py-1.5 px-1.5 space-y-0.5 text-xs">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-colors font-medium cursor-pointer"
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span>My Profile & Stats</span>
                  </Link>

                  <Link
                    href="/certificates"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-colors font-medium cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-accent" />
                    <span>Certificates & Credentials</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-colors font-medium cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-foreground-muted" />
                    <span>Settings & Security</span>
                  </Link>

                  {userRole === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-colors font-medium cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Admin Control Center</span>
                    </Link>
                  )}
                </div>

                {/* Logout Action */}
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-error hover:bg-error/10 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
