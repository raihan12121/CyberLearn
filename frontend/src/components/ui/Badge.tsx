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
  | "teal"
  | "cisco"
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
  primary: "bg-[#00BCEB]/15 text-[#00BCEB] border border-[#00BCEB]/30",
  cisco: "bg-[#00BCEB]/20 text-[#00BCEB] border border-[#00BCEB]/40 font-bold",
  secondary: "bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/20",
  success: "bg-[#00C49F]/15 text-[#00C49F] border border-[#00C49F]/30",
  teal: "bg-[#00C49F]/15 text-[#00C49F] border border-[#00C49F]/30",
  warning: "bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30",
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
            variant === "success" || variant === "teal"
              ? "bg-[#00C49F]"
              : variant === "danger"
              ? "bg-rose-400"
              : variant === "warning"
              ? "bg-[#F5A623]"
              : variant === "purple" || variant === "accent"
              ? "bg-indigo-400"
              : "bg-[#00BCEB]"
          }`}
        />
      )}
      {children}
    </span>
  );
}
