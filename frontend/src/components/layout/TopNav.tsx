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
  CheckCheck,
  Trash2,
  ExternalLink,
  Terminal,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
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
  verification_status?: string;
  avatar_url?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "achievement" | "lab" | "batch" | "certificate" | "security" | "ai";
  read: boolean;
  link?: string;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  // Profile Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notification Dropdown
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    api.getMe()
      .then((data) => {
        if (data) {
          setUser(data);
          initializeNotifications(data);
        }
      })
      .catch((err) => {
        console.error("Error loading user profile in topnav:", err);
        initializeNotifications(null);
      });
  }, []);

  // Initialize notifications with persistence
  const initializeNotifications = (userData: UserProfile | null) => {
    let readIds: string[] = [];
    try {
      const stored = localStorage.getItem("cyberlearn_read_notifs");
      if (stored) {
        readIds = JSON.parse(stored);
      }
    } catch {}

    const baseNotifs: NotificationItem[] = [
      {
        id: "notif-welcome-labs",
        title: "Hands-on Practice Labs Ready",
        description: "Explore interactive CTF sandboxes, Linux command terminals, and Web Security Proxy.",
        timestamp: "Just now",
        type: "lab",
        read: readIds.includes("notif-welcome-labs"),
        link: "/labs",
      },
      {
        id: "notif-ai-coach",
        title: "Multi-Session AI Coach Active",
        description: "Ask your personal cyber tutor questions about OWASP Top 10, SOP, or privilege escalation.",
        timestamp: "10m ago",
        type: "ai",
        read: readIds.includes("notif-ai-coach"),
        link: "/ai-coach",
      },
      {
        id: "notif-nid-verify",
        title: "ID & Certificate Verification",
        description:
          userData?.verification_status === "verified"
            ? "Your NID identity is officially verified. Cryptographic certificates are available."
            : "Complete your NID verification to unlock verified recruiter credentials.",
        timestamp: "1h ago",
        type: "security",
        read: readIds.includes("notif-nid-verify"),
        link: "/verify-nid",
      },
      {
        id: "notif-cohorts",
        title: "Live Cohort Batches Open",
        description: "Join structured instructor-led batches with direct invite codes and live schedules.",
        timestamp: "3h ago",
        type: "batch",
        read: readIds.includes("notif-cohorts"),
        link: "/batches",
      },
      {
        id: "notif-xp-streak",
        title: "Gamification & Leaderboard",
        description: `You have ${userData?.xp ? userData.xp.toLocaleString() : 0} XP. Keep completing challenges to climb the rank ladder!`,
        timestamp: "1d ago",
        type: "achievement",
        read: readIds.includes("notif-xp-streak"),
        link: "/leaderboard",
      },
    ];

    setNotifications(baseNotifs);
  };

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        setNotifOpen(false);
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

  // Notification actions
  const markAsRead = (id: string, link?: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);

    try {
      const readIds = updated.filter((n) => n.read).map((n) => n.id);
      localStorage.setItem("cyberlearn_read_notifs", JSON.stringify(readIds));
    } catch {}

    if (link) {
      setNotifOpen(false);
      router.push(link);
    }
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      const readIds = updated.map((n) => n.id);
      localStorage.setItem("cyberlearn_read_notifs", JSON.stringify(readIds));
    } catch {}
  };

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === "unread") return !n.read;
    return true;
  });

  const getNotifIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "achievement":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "lab":
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case "security":
        return <ShieldCheck className="w-4 h-4 text-primary" />;
      case "batch":
        return <GraduationCap className="w-4 h-4 text-purple-400" />;
      case "certificate":
        return <Award className="w-4 h-4 text-accent" />;
      case "ai":
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
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
        {/* Notifications Dropdown Container */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setDropdownOpen(false);
              setNotifOpen((prev) => !prev)}
            }
            className={`relative p-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-all duration-200 cursor-pointer ${
              notifOpen ? "bg-surface-elevated text-primary" : ""
            }`}
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-error text-white font-mono text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-surface animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-[-60px] sm:right-0 mt-2 w-[340px] sm:w-[400px] rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden z-50 divide-y divide-border/60"
              >
                {/* Header */}
                <div className="p-3.5 sm:p-4 bg-surface-elevated/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-primary hover:text-primary-light flex items-center gap-1 transition-colors cursor-pointer"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter Tabs */}
                {notifications.length > 0 && (
                  <div className="px-3 py-2 bg-surface flex items-center justify-between text-xs border-b border-border/40">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setNotifFilter("all")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          notifFilter === "all"
                            ? "bg-surface-elevated text-foreground border border-border"
                            : "text-foreground-muted hover:text-foreground"
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        onClick={() => setNotifFilter("unread")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          notifFilter === "unread"
                            ? "bg-surface-elevated text-foreground border border-border"
                            : "text-foreground-muted hover:text-foreground"
                        }`}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>
                    <button
                      onClick={clearAllNotifications}
                      className="text-[10px] text-foreground-muted hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear all</span>
                    </button>
                  </div>
                )}

                {/* Notifications List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-border/30 scrollbar-thin">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-foreground-muted">
                        <Bell className="w-6 h-6 opacity-40" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">No notifications</p>
                        <p className="text-[11px] text-foreground-muted">
                          {notifFilter === "unread"
                            ? "You have caught up with all your updates!"
                            : "You will be alerted about lab progress, batch sessions, and badges here."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredNotifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markAsRead(item.id, item.link)}
                        className={`p-3.5 flex items-start gap-3 hover:bg-surface-elevated/80 transition-colors cursor-pointer group relative ${
                          !item.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          {getNotifIcon(item.type)}
                        </div>

                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4
                              className={`text-xs font-semibold truncate ${
                                !item.read ? "text-foreground font-bold" : "text-foreground-secondary"
                              }`}
                            >
                              {item.title}
                            </h4>
                            <span className="text-[10px] font-mono text-foreground-muted shrink-0 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {item.timestamp}
                            </span>
                          </div>

                          <p className="text-[11px] text-foreground-muted leading-relaxed line-clamp-2">
                            {item.description}
                          </p>

                          {item.link && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary mt-1 group-hover:underline">
                              <span>View details</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        {/* Unread indicator / Dismiss */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          {!item.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                          <button
                            onClick={(e) => dismissNotification(e, item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-error text-foreground-muted transition-opacity cursor-pointer rounded"
                            title="Dismiss notification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-2.5 bg-surface-elevated/40 text-center">
                  <Link
                    href="/profile"
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] font-semibold text-primary hover:text-primary-light transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all achievements & activity history</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setNotifOpen(false);
              setDropdownOpen((prev) => !prev)}
            }
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
                  {userRole !== "admin" && (
                    <>
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
                    </>
                  )}

                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-colors font-medium cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-foreground-muted" />
                    <span>Settings & Preferences</span>
                  </Link>
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
