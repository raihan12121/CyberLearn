import React from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away";
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-xl",
};

const statusColors: Record<string, string> = {
  online: "bg-accent",
  offline: "bg-foreground-muted",
  away: "bg-warning",
};

const statusSize: Record<string, string> = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({
  src,
  alt,
  name,
  size = "md",
  status,
  className = "",
}: AvatarProps) {
  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-border`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold bg-primary/20 text-primary-light border-2 border-border`}
        >
          {name ? getInitials(name) : "?"}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSize[size]} ${statusColors[status]} rounded-full ring-2 ring-background`}
        />
      )}
    </div>
  );
}
