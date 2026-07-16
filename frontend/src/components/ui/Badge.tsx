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
  default: "bg-surface-bright text-foreground-secondary",
  primary: "bg-primary/15 text-primary-light",
  secondary: "bg-secondary/15 text-secondary-light",
  success: "bg-accent/15 text-accent-light",
  warning: "bg-warning/15 text-warning",
  danger: "bg-error/15 text-error",
  purple: "bg-secondary/15 text-secondary-light",
  outline: "bg-transparent border border-border text-foreground-secondary",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
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
        inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === "success"
              ? "bg-accent"
              : variant === "danger"
              ? "bg-error"
              : variant === "warning"
              ? "bg-warning"
              : "bg-primary"
          }`}
        />
      )}
      {children}
    </span>
  );
}
