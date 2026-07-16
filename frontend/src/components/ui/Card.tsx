import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "primary" | "secondary" | "accent" | "blue" | "purple" | "green" | false;
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
      : glow === "secondary" || glow === "purple"
      ? "glow-secondary"
      : "glow-accent"
    : "";

  return (
    <div
      className={`
        bg-surface-elevated rounded-[var(--radius-lg)] border border-border
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
