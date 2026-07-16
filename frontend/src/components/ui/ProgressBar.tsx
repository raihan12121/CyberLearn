import React from "react";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: "primary" | "gradient" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const variantBg: Record<string, string> = {
  primary: "bg-primary",
  gradient: "bg-gradient-to-r from-primary to-accent",
  success: "bg-accent",
  warning: "bg-warning",
};

const sizeClasses: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

export default function ProgressBar({
  value,
  max = 100,
  variant = "gradient",
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
            <span className="text-xs font-semibold text-foreground-secondary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-surface-bright rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${variantBg[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
