import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "primary" | "secondary" | "accent" | "cyan" | "success" | "warning" | "error" | "blue" | "purple" | "green" | false;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  className = "",
  hover = false,
  glow = false,
  padding = "md",
  onClick,
}: CardProps) {
  const glowClass = glow
    ? glow === "primary" || glow === "blue"
      ? "glow-primary"
      : glow === "accent" || glow === "purple" || glow === "secondary"
      ? "glow-accent"
      : glow === "cyan"
      ? "shadow-[0_0_24px_rgba(6,182,212,0.25)]"
      : glow === "success" || glow === "green"
      ? "glow-success"
      : glow === "warning"
      ? "glow-warning"
      : "glow-error"
    : "";

  return (
    <div
      className={`
        bg-surface rounded-[var(--radius-lg)] border border-border/80 shadow-sm
        ${paddingClasses[padding]}
        ${hover ? "card-hover cursor-pointer" : ""}
        ${glowClass}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
