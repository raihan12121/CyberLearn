"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal as TerminalIcon,
  Globe,
  Network,
  ShieldAlert,
  HelpCircle,
  Play,
  RotateCcw,
  Flag,
  CheckCircle,
  Clock,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";
import WebProxyInspector from "@/components/labs/WebProxyInspector";
import NetworkTopologyGraph from "@/components/labs/NetworkTopologyGraph";
import SocLogWorkbench from "@/components/labs/SocLogWorkbench";
import SocraticHintDrawer from "@/components/labs/SocraticHintDrawer";
import XTermTerminal from "@/components/labs/XTermTerminal";

export default function LabWorkspacePage() {

  const params = useParams();
  const router = useRouter();
  const labId = (params?.labId as string) || "linux-navigation";

  // Session & workspace state
  const [activeTab, setActiveTab] = useState<"terminal" | "proxy" | "network" | "soc">("terminal");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"idle" | "running" | "completed">("idle");
  const [timeRemaining, setTimeRemaining] = useState<number>(1800);
  const [userFlag, setUserFlag] = useState("");
  const [flagFeedback, setFlagFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<Array<{ text: string; type: "cmd" | "output" | "error" | "sys" }>>([
    { text: "CyberLearn Terminal v2.4 (Ubuntu 24.04 LTS)", type: "sys" },
    { text: "Type 'help' to view available sandbox commands.", type: "sys" },
  ]);
  const [inputCmd, setInputCmd] = useState("");
  const termEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal
  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory]);

  // Launch lab session on mount
  useEffect(() => {
    api.startLab(labId)
      .then((data) => {
        if (data && data.id) {
          setSessionId(data.id);
          setSessionStatus("running");
        }
      })
      .catch((err) => {
        console.warn("Could not start lab via backend API, initializing local session:", err);
        setSessionId(`session-${labId}-local`);
        setSessionStatus("running");
      });
  }, [labId]);

  // Timer effect
  useEffect(() => {
    if (sessionStatus !== "running") return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStatus]);

  // Handle Terminal Execution
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputCmd.trim();
    if (!cmd) return;

    const newHistory = [...terminalHistory, { text: `user@cyberlearn:~$ ${cmd}`, type: "cmd" as const }];
    const lower = cmd.toLowerCase();

    if (lower === "clear") {
      setTerminalHistory([]);
      setInputCmd("");
      return;
    } else if (lower === "help") {
      newHistory.push({
        text: "Available Commands: ls, cd, pwd, cat, nmap, curl, whoami, clear, flag-hint",
        type: "sys",
      });
    } else if (lower === "ls" || lower === "ls -la") {
      newHistory.push({
        text: "drwxr-xr-x 2 root root 4096 Jul 22 10:00 .\ndrwxr-xr-x 3 root root 4096 Jul 22 10:00 ..\n-rw-r--r-- 1 root root  240 Jul 22 10:00 instructions.txt\n-r--r----- 1 root root   38 Jul 22 10:00 flag.txt",
        type: "output",
      });
    } else if (lower === "pwd") {
      newHistory.push({ text: "/home/learner/sandbox", type: "output" });
    } else if (lower === "whoami") {
      newHistory.push({ text: "learner (uid=1000, gid=1000)", type: "output" });
    } else if (lower.startsWith("cat flag.txt") || lower.startsWith("cat instructions.txt")) {
      newHistory.push({
        text: "Hint: To retrieve the real flag, solve the lab objective or check the Socratic hints drawer!",
        type: "output",
      });
    } else if (lower.startsWith("nmap")) {
      newHistory.push({
        text: "Starting Nmap 7.94 ( https://nmap.org )\nNmap scan report for 10.0.4.15\nPORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http\n443/tcp open https",
        type: "output",
      });
    } else {
      newHistory.push({ text: `bash: ${cmd}: command executed in virtual sandbox container environment`, type: "output" });
    }

    setTerminalHistory(newHistory);
    setInputCmd("");
  };

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
        // Fallback flag format validation for offline testing
        if (userFlag.trim().startsWith("FLAG{") && userFlag.trim().endsWith("}")) {
          setFlagFeedback({ success: true, msg: "Flag accepted! XP awarded." });
          setSessionStatus("completed");
        } else {
          setFlagFeedback({ success: false, msg: err.message || "Invalid flag pattern. Expected format: FLAG{...}" });
        }
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

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-[var(--radius-xl)] border border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/labs")} icon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground capitalize">{labId.replace(/-/g, " ")} Workspace</h1>
            <p className="text-xs text-foreground-muted">Sandbox Container ID: {sessionId || "Initializing..."}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-elevated px-3 py-1.5 rounded-[var(--radius)] border border-border text-xs font-mono text-foreground">
            <Clock className="w-4 h-4 text-warning" />
            <span>Time Left: {formatTime(timeRemaining)}</span>
          </div>

          <Button variant="ghost" size="sm" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHintOpen(true)}
            icon={<HelpCircle className="w-4 h-4 text-accent" />}
          >
            Socratic Hints
          </Button>
        </div>
      </div>

      {/* Tool Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[var(--radius)] transition-all cursor-pointer ${
            activeTab === "terminal" ? "bg-primary text-white" : "bg-surface text-foreground-secondary hover:text-foreground border border-border"
          }`}
        >
          <TerminalIcon className="w-4 h-4" />
          Interactive Terminal
        </button>

        <button
          onClick={() => setActiveTab("proxy")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[var(--radius)] transition-all cursor-pointer ${
            activeTab === "proxy" ? "bg-primary text-white" : "bg-surface text-foreground-secondary hover:text-foreground border border-border"
          }`}
        >
          <Globe className="w-4 h-4" />
          Web Proxy Inspector
        </button>

        <button
          onClick={() => setActiveTab("network")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[var(--radius)] transition-all cursor-pointer ${
            activeTab === "network" ? "bg-primary text-white" : "bg-surface text-foreground-secondary hover:text-foreground border border-border"
          }`}
        >
          <Network className="w-4 h-4" />
          Topology Graph
        </button>

        <button
          onClick={() => setActiveTab("soc")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[var(--radius)] transition-all cursor-pointer ${
            activeTab === "soc" ? "bg-primary text-white" : "bg-surface text-foreground-secondary hover:text-foreground border border-border"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          SOC Log Workbench
        </button>
      </div>

      {/* Active Tool Area */}
      <div className="min-h-[520px]">
        {activeTab === "terminal" && (
          <XTermTerminal sessionId={sessionId || "session-demo"} labId={labId} />
        )}


        {activeTab === "proxy" && <WebProxyInspector labId={labId} />}

        {activeTab === "network" && <NetworkTopologyGraph />}

        {activeTab === "soc" && <SocLogWorkbench />}
      </div>

      {/* Flag Submission Bar */}
      <Card padding="lg" className="border-primary/40 bg-surface-elevated/40">
        <form onSubmit={handleFlagSubmit} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Flag className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-foreground">Submit Lab Flag:</span>
          </div>

          <input
            type="text"
            required
            placeholder="FLAG{sha256_hash_payload}"
            value={userFlag}
            onChange={(e) => setUserFlag(e.target.value)}
            className="flex-1 w-full bg-surface border border-border rounded-[var(--radius)] px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow"
          />

          <Button type="submit" disabled={isSubmitting} icon={<CheckCircle className="w-4 h-4" />}>
            {isSubmitting ? "Verifying..." : "Submit Flag"}
          </Button>
        </form>

        {flagFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-[var(--radius)] text-xs font-semibold flex items-center gap-2 ${
              flagFeedback.success ? "bg-success/10 text-success border border-success/30" : "bg-error/10 text-error border border-error/30"
            }`}
          >
            {flagFeedback.success ? <CheckCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span>{flagFeedback.msg}</span>
          </motion.div>
        )}
      </Card>

      {/* Socratic Hint Drawer */}
      <SocraticHintDrawer
        isOpen={isHintOpen}
        onClose={() => setIsHintOpen(false)}
        labId={labId}
        userXp={1250}
      />
    </div>
  );
}
