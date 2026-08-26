import React from "react";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: "primary" | "gradient" | "success" | "warning" | "danger" | "cyber";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const variantBg: Record<string, string> = {
  primary: "bg-gradient-to-r from-sky-400 to-blue-600 shadow-sm shadow-sky-500/30",
  gradient: "bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 shadow-sm shadow-indigo-500/30",
  cyber: "bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 shadow-sm shadow-cyan-500/30",
  success: "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm shadow-emerald-500/30",
  warning: "bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm shadow-amber-500/30",
  danger: "bg-gradient-to-r from-rose-400 to-pink-600 shadow-sm shadow-rose-500/30",
};

const sizeClasses: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

export default function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  size = "md",
  showLabel = false,
  label,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-medium text-foreground-secondary">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-xs font-mono font-bold text-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-surface-bright/80 border border-border/60 rounded-full overflow-hidden p-[1px] ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${variantBg[variant] || variantBg.primary}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
