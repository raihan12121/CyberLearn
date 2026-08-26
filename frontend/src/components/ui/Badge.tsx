import React from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "purple"
  | "accent"
  | "cyan"
  | "outline";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-bright text-foreground-secondary border border-border",
  primary: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
  secondary: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  danger: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  purple: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
  accent: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  cyan: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  outline: "bg-transparent border border-border text-foreground-secondary",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px] font-bold tracking-wide",
  md: "px-2.5 py-1 text-xs font-bold tracking-wide",
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
        inline-flex items-center gap-1.5 rounded-full whitespace-nowrap font-medium transition-colors
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            variant === "success"
              ? "bg-emerald-400"
              : variant === "danger"
              ? "bg-rose-400"
              : variant === "warning"
              ? "bg-amber-400"
              : variant === "purple" || variant === "accent"
              ? "bg-indigo-400"
              : variant === "cyan"
              ? "bg-cyan-400"
              : "bg-sky-400"
          }`}
        />
      )}
      {children}
    </span>
  );
}
