import React from "react";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "purple" | "outline";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-800 text-slate-300 border border-slate-700/60",
  primary: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  secondary: "bg-slate-800/80 text-slate-300 border border-slate-700/40",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  purple: "bg-blue-500/10 text-blue-400 border border-blue-500/20", // standardized to clean blue
  outline: "bg-transparent border border-border text-foreground-secondary",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px] font-semibold tracking-wide",
  md: "px-2.5 py-1 text-xs font-semibold tracking-wide",
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full whitespace-nowrap
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === "success"
              ? "bg-emerald-400"
              : variant === "danger"
              ? "bg-rose-400"
              : variant === "warning"
              ? "bg-amber-400"
              : "bg-blue-400"
          }`}
        />
      )}
      {children}
    </span>
  );
}
