import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  rightIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-surface-elevated border border-border rounded-[var(--radius-lg)]
            px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted
            transition-all duration-200
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow
            hover:border-border-hover
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? "pl-10" : ""}
            ${rightIcon ? "pr-10" : ""}
            ${error ? "border-error focus:border-error focus:ring-error/25" : ""}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted cursor-pointer hover:text-foreground transition-colors">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
