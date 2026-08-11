"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import Avatar from "../ui/Avatar";
import { api } from "@/lib/api";

interface TopNavProps {
  onMenuClick?: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const [profileName, setProfileName] = useState("User");
  const [fullName, setFullName] = useState("Active User");

  useEffect(() => {
    api.getMe()
      .then((data) => {
        if (data) {
          setFullName(data.full_name || "User");
          const firstName = data.full_name ? data.full_name.split(" ")[0] : "User";
          setProfileName(firstName);
        }
      })
      .catch((err) => console.error("Error loading user profile in topnav:", err));
  }, []);

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated shrink-0 cursor-pointer"
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
        <button className="relative p-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-all duration-200 cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 p-1.5 rounded-[var(--radius)] hover:bg-surface-elevated transition-all duration-200 cursor-pointer">
          <Avatar name={fullName} size="sm" status="online" />
          <div className="hidden md:flex items-center gap-1">
            <span className="text-sm font-medium text-foreground">{profileName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-foreground-muted" />
          </div>
        </button>
      </div>
    </header>
  );
}
