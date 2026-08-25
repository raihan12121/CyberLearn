import React from "react";
import { Terminal, Shield, Network, Zap, Code2, Lock } from "lucide-react";

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
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PRESET_ICONS: Record<string, { icon: any; color: string }> = {
  "avatar-neon": { icon: Terminal, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  "avatar-phantom": { icon: Shield, color: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
  "avatar-sentinel": { icon: Network, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" },
  "avatar-valkyrie": { icon: Zap, color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  "avatar-glitch": { icon: Code2, color: "bg-pink-500/20 text-pink-400 border-pink-500/40" },
  "avatar-cipher": { icon: Lock, color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
};

export default function Avatar({
  src,
  alt,
  name,
  size = "md",
  status,
  className = "",
}: AvatarProps) {
  const isImageUrl = src && (src.startsWith("http") || src.startsWith("data:image") || src.startsWith("/") || src.includes("."));
  const preset = src && PRESET_ICONS[src];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {isImageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-border shadow-sm`}
          onError={(e) => {
            // If image fails to load, gracefully fallback to initials
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      ) : preset ? (
        (() => {
          const Icon = preset.icon;
          return (
            <div
              className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold border-2 ${preset.color}`}
            >
              <Icon className="w-1/2 h-1/2" />
            </div>
          );
        })()
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
