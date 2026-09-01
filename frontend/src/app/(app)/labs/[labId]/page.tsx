"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Globe,
  Network,
  ShieldAlert,
  HelpCircle,
  RotateCcw,
  Flag,
  CheckCircle,
  Clock,
  ArrowLeft,
  Zap,
  Lock,
  Terminal as TerminalIcon,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore, isUserSubscribed } from "@/lib/authStore";
import SubscriptionPaywallModal from "@/components/subscription/SubscriptionPaywallModal";
import WebProxyInspector from "@/components/labs/WebProxyInspector";
import NetworkTopologyGraph from "@/components/labs/NetworkTopologyGraph";
import SocLogWorkbench from "@/components/labs/SocLogWorkbench";
import SocraticHintDrawer from "@/components/labs/SocraticHintDrawer";
import TerminalWorkbench from "@/components/labs/TerminalWorkbench";

export default function LabWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const labId = (params?.labId as string) || "sql-injection-bypass";
  const { user, loading, fetchUser } = useAuthStore();
  const subscribed = isUserSubscribed(user);

  // Session & workspace state
  const [activeTab, setActiveTab] = useState<"terminal" | "proxy" | "network" | "soc">("terminal");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"idle" | "running" | "completed">("idle");
  const [timeRemaining, setTimeRemaining] = useState<number>(1800);
  const [userFlag, setUserFlag] = useState("");
  const [flagFeedback, setFlagFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  // Verify auth session from database on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Launch lab session on mount (only for subscribed users)
  useEffect(() => {
    if (!subscribed) return;

    api.startLab(labId)
      .then((data) => {
        if (data && data.id) {
          setSessionId(data.id);
          setSessionStatus("running");
        }
      })
      .catch((err) => {
        console.warn("Could not start lab via backend API:", err);
      });
  }, [labId, subscribed]);

  // Timer effect
  useEffect(() => {
    if (sessionStatus !== "running") return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStatus]);

  // Flag Submission Handler
  const handleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFlag.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const sid = sessionId || `session-${labId}`;

    api.submitFlag(sid, userFlag.trim())
      .then((res) => {
        setIsSubmitting(false);
        if (res.correct) {
          setFlagFeedback({ success: true, msg: res.message || "Flag accepted! XP awarded." });
          setSessionStatus("completed");
        } else {
          setFlagFeedback({ success: false, msg: res.message || "Incorrect flag payload. Try again!" });
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        setFlagFeedback({
          success: false,
          msg: err.message || "Failed to submit flag. Please verify backend connection and try again."
        });
      });
  };

  // Reset Session
  const handleReset = () => {
    if (!sessionId) return;
    api.resetLab(sessionId)
      .then(() => {
        setTimeRemaining(1800);
        setFlagFeedback(null);
        setUserFlag("");
      })
      .catch(() => {
        setTimeRemaining(1800);
        setFlagFeedback(null);
      });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Loading state while authenticating user session against database
  if (loading && !user) {
    return (
      <div className="max-w-4xl mx-auto py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-foreground-secondary">Verifying credentials & lab entitlements...</p>
      </div>
    );
  }

  // Paywall locked view for unsubscribed free users
  if (!subscribed) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/labs")} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Labs Catalog
        </Button>

        <Card padding="lg" className="border-primary/40 bg-surface-elevated/40 text-center py-12 px-6 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Cyber glow effect */}
          <div className="absolute -right-16 -top-16 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/15 border border-primary/30 text-primary shadow-xl">
            <Lock className="w-12 h-12 animate-pulse text-primary" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <Badge variant="primary" size="sm" className="font-mono uppercase text-[10px] tracking-wider">
              Pro Subscription Required
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground capitalize">
              {labId.replace(/-/g, " ")} Workspace Locked
            </h2>
            <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
              Interactive Web Security Proxy Inspector, Attack Network Topology Graph, SIEM Log Analyzer, and live Flag Verification engines are exclusively available for Pro and Premium subscribers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left py-2">
            <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <TerminalIcon className="w-4 h-4" />
                <span>Linux Terminal</span>
              </div>
              <p className="text-[11px] text-foreground-muted">Interactive sandboxed Linux PTY & bash shell with live flag discovery.</p>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Globe className="w-4 h-4" />
                <span>Web Proxy</span>
              </div>
              <p className="text-[11px] text-foreground-muted">Live HTTP Repeater, header tamper, and injection payload tester.</p>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
              <div className="flex items-center gap-2 text-accent font-bold text-xs">
                <Network className="w-4 h-4" />
                <span>Attack Graph</span>
              </div>
              <p className="text-[11px] text-foreground-muted">Visual subnet map, port discovery, and host pivot analysis.</p>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
              <div className="flex items-center gap-2 text-secondary-light font-bold text-xs">
                <Flag className="w-4 h-4" />
                <span>XP Rewards</span>
              </div>
              <p className="text-[11px] text-foreground-muted">Capture flags to rank up on the global CTF leaderboard.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setPaywallOpen(true)}
              className="w-full sm:w-auto font-bold shadow-lg"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              <span>Unlock Labs with Pro ($12/mo)</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/pricing")}
              className="w-full sm:w-auto"
            >
              Explore Pricing Plans
            </Button>
          </div>
        </Card>

        <SubscriptionPaywallModal
          isOpen={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          title="Unlock Lab Workspaces"
          resourceName={labId.replace(/-/g, " ")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-[var(--radius-xl)] border border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/labs")} icon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground capitalize">
                {labId.replace(/-/g, " ")}
              </h1>
              <Badge variant="primary" size="sm" className="capitalize">
                {sessionStatus}
              </Badge>
            </div>
            <p className="text-xs text-foreground-muted">
              Interactive offensive security sandbox session • Target IP: 10.10.14.55
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border font-mono text-sm">
            <Clock className="w-4 h-4 text-warning" />
            <span className={timeRemaining < 300 ? "text-error animate-pulse font-bold" : "text-foreground"}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHintOpen(true)}
            icon={<HelpCircle className="w-4 h-4 text-accent" />}
          >
            AI Hints
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-4 h-4" />}
            title="Reset sandbox environment"
          />
        </div>
      </div>

      {/* Flag Submission Bar */}
      <Card padding="sm" className="bg-surface border-primary/30 shadow-md">
        <form onSubmit={handleFlagSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold shrink-0">
            <Flag className="w-4 h-4" />
            <span>SUBMIT LAB FLAG:</span>
          </div>
          <input
            type="text"
            placeholder="FLAG{...}"
            value={userFlag}
            onChange={(e) => setUserFlag(e.target.value)}
            disabled={sessionStatus === "completed" || isSubmitting}
            className="flex-1 px-3 py-1.5 text-xs font-mono bg-surface-elevated border border-border rounded-md text-foreground focus:outline-none focus:border-primary"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={sessionStatus === "completed" || isSubmitting || !userFlag.trim()}
            className="shrink-0"
          >
            {isSubmitting ? "Validating..." : sessionStatus === "completed" ? "Completed ✓" : "Verify Flag"}
          </Button>
        </form>

        {flagFeedback && (
          <div
            className={`mt-2 p-2 rounded text-xs font-mono flex items-center gap-2 ${
              flagFeedback.success
                ? "bg-success/15 text-success border border-success/30"
                : "bg-error/15 text-error border border-error/30"
            }`}
          >
            {flagFeedback.success ? <CheckCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span>{flagFeedback.msg}</span>
          </div>
        )}
      </Card>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "terminal"
              ? "bg-primary text-white shadow-md"
              : "bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
          }`}
        >
          <TerminalIcon className="w-4 h-4" />
          <span>Interactive Terminal</span>
        </button>

        <button
          onClick={() => setActiveTab("proxy")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "proxy"
              ? "bg-primary text-white shadow-md"
              : "bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Web Proxy Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab("network")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "network"
              ? "bg-primary text-white shadow-md"
              : "bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Network Topology</span>
        </button>

        <button
          onClick={() => setActiveTab("soc")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "soc"
              ? "bg-primary text-white shadow-md"
              : "bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>SOC Log Analyzer</span>
        </button>
      </div>

      {/* Dynamic Tab Body */}
      <div className="relative min-h-[500px]">
        {activeTab === "terminal" && (
          <TerminalWorkbench sessionId={sessionId || `session-${labId}`} labId={labId} />
        )}
        {activeTab === "proxy" && (
          <WebProxyInspector labId={labId} />
        )}
        {activeTab === "network" && (
          <NetworkTopologyGraph />
        )}
        {activeTab === "soc" && (
          <SocLogWorkbench />
        )}
      </div>

      {/* Socratic Hint Drawer */}
      <SocraticHintDrawer
        isOpen={isHintOpen}
        onClose={() => setIsHintOpen(false)}
        labId={labId}
      />
    </div>
  );
}
