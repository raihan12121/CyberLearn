"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, ThemeMode, useIsMounted } from "@/lib/theme";

interface ThemeToggleProps {
  variant?: "button" | "dropdown";
  size?: "sm" | "md";
  className?: string;
}

export default function ThemeToggle({
  variant = "button",
  size = "md",
  className = "",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const mounted = useIsMounted();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const isSm = size === "sm";

  if (variant === "button") {
    return (
      <button
        onClick={toggleTheme}
        className={`
          relative p-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground
          hover:bg-surface-elevated transition-all duration-200 cursor-pointer
          border border-transparent hover:border-border flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-primary-glow
          ${className}
        `}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                transition={{ duration: 0.2 }}
                className="text-amber-400"
              >
                <Moon className={isSm ? "w-4 h-4" : "w-4.5 h-4.5"} />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
                transition={{ duration: 0.2 }}
                className="text-amber-500"
              >
                <Sun className={isSm ? "w-4 h-4" : "w-4.5 h-4.5"} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    );
  }

  // Dropdown Variant
  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      value: "light",
      label: "Light",
      icon: <Sun className="w-4 h-4 text-amber-500" />,
    },
    {
      value: "dark",
      label: "Dark",
      icon: <Moon className="w-4 h-4 text-amber-400" />,
    },
    {
      value: "system",
      label: "System",
      icon: <Monitor className="w-4 h-4 text-primary" />,
    },
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 p-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer border border-border"
        aria-label="Select Theme"
        aria-expanded={dropdownOpen}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
        <span className="text-xs capitalize font-medium text-foreground">
          {mounted ? theme : "Theme"}
        </span>
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-36 rounded-xl bg-surface border border-border shadow-xl overflow-hidden z-50 p-1 divide-y divide-border/40"
          >
            {themeOptions.map((opt) => {
              const isSelected = mounted && theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
