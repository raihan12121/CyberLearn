import React from "react";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: "primary" | "gradient" | "success" | "warning" | "danger" | "cyber" | "cisco";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const variantBg: Record<string, string> = {
  primary: "bg-gradient-to-r from-[#00BCEB] to-[#004BAF] shadow-sm shadow-[#00BCEB]/30",
  cisco: "bg-gradient-to-r from-[#00BCEB] to-[#00C49F] shadow-sm shadow-[#00BCEB]/30",
  gradient: "bg-gradient-to-r from-[#00BCEB] via-[#6366F1] to-[#818CF8] shadow-sm shadow-indigo-500/30",
  cyber: "bg-gradient-to-r from-[#00BCEB] via-[#00C49F] to-[#6366F1] shadow-sm shadow-cyan-500/30",
  success: "bg-gradient-to-r from-[#00C49F] to-[#10B981] shadow-sm shadow-[#00C49F]/30",
  warning: "bg-gradient-to-r from-[#F5A623] to-[#D97706] shadow-sm shadow-amber-500/30",
  danger: "bg-gradient-to-r from-[#F43F5E] to-[#E11D48] shadow-sm shadow-rose-500/30",
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
