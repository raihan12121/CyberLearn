import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "cyber" | "cisco";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#00BCEB] to-[#004BAF] text-white hover:from-[#049FD9] hover:to-[#003680] shadow-sm hover:shadow-[#00BCEB]/25 border border-[#00BCEB]/40 focus:ring-2 focus:ring-[#00BCEB]/40 font-bold",
  cisco:
    "bg-gradient-to-r from-[#00BCEB] to-[#00C49F] text-slate-950 font-extrabold hover:opacity-95 shadow-md shadow-[#00BCEB]/20 border border-[#00BCEB]/50",
  cyber:
    "bg-gradient-to-r from-[#00BCEB] via-[#6366F1] to-[#EC4899] text-white hover:opacity-95 shadow-md shadow-[#00BCEB]/25 border border-[#00BCEB]/40 font-bold",
  secondary:
    "bg-surface-elevated text-foreground-secondary hover:text-foreground hover:bg-surface-bright border border-border shadow-sm",
  outline:
    "bg-transparent text-foreground border border-border hover:border-[#00BCEB]/60 hover:text-[#00BCEB] hover:bg-[#00BCEB]/10",
  ghost:
    "bg-transparent text-foreground-secondary hover:text-foreground hover:bg-surface-elevated",
  danger:
    "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 font-bold",
  success:
    "bg-[#00C49F]/15 text-[#00C49F] border border-[#00C49F]/30 hover:bg-[#00C49F]/25 font-bold",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-[var(--radius-md)]",
  md: "px-4 py-2 text-sm gap-2 rounded-[var(--radius-md)]",
  lg: "px-5 py-2.5 text-base gap-2.5 rounded-[var(--radius-lg)]",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 ease-out cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
