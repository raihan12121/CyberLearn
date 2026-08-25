"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, Zap, X } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import SubscriptionPaywallModal from "./SubscriptionPaywallModal";

interface SubscriptionBannerProps {
  type?: "courses" | "labs" | "general";
}

export default function SubscriptionBanner({ type = "general" }: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (dismissed) return null;

  const title =
    type === "courses"
      ? "Course Video Lessons & Assessments Require a Subscription"
      : type === "labs"
      ? "Practice Sandbox Containers Require a Paid Subscription"
      : "Unlock Unlimited Cyber Security Training with Pro";

  const description =
    type === "courses"
      ? "You are currently on the Free tier. Upgrade to Pro to watch all video lessons, read complete curriculum modules, and complete graded quizzes."
      : type === "labs"
      ? "Live Linux sandboxes, interactive Wireshark sniffers, and web security proxies require an active Pro or Premium subscription."
      : "Get unlimited cloud container sandboxes, comprehensive video courses, AI tutoring, and verified industry certificates.";

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-accent/10 to-secondary/15 border border-primary/30 p-4 sm:p-5 shadow-lg">
        {/* Glow backdrop */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm" className="font-mono uppercase text-[10px]">
                  Free Tier
                </Badge>
                <h3 className="text-sm sm:text-base font-bold text-foreground">{title}</h3>
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPaywallOpen(true)}
              className="gap-1.5 shadow-md text-xs font-bold"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <SubscriptionPaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title={title}
        description={description}
      />
    </>
  );
}
