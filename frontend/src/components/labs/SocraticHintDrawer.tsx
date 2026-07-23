"use client";

import React, { useState, useEffect } from "react";
import { Lightbulb, Lock, Unlock, Zap, HelpCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

interface HintLevel {
  level: number;
  title: string;
  cost: number;
  unlocked: boolean;
  content: string;
}

interface SocraticHintDrawerProps {
  labId: string;
  isOpen?: boolean;
  onClose?: () => void;
  userXp?: number;
}

export default function SocraticHintDrawer({
  labId,
  isOpen = true,
  onClose: _onClose,
  userXp: initialUserXp = 150,
}: SocraticHintDrawerProps) {
  const [hints, setHints] = useState<HintLevel[]>([
    {
      level: 1,
      title: "Level 1: Conceptual Guidance",
      cost: 0,
      unlocked: true,
      content:
        "Observe the input fields on the target web application login form. SQL injection occurs when unsanitized user input is concatenated directly into a database query string.",
    },
    {
      level: 2,
      title: "Level 2: Recommended Tooling & Technique",
      cost: 10,
      unlocked: false,
      content:
        "Consider placing a single quote (') inside the username field to break the SQL syntax. You can append boolean logic like `OR '1'='1` to force the query to evaluate to true.",
    },
    {
      level: 3,
      title: "Level 3: Command & Syntax Blueprint",
      cost: 25,
      unlocked: false,
      content:
        "Use the payload: `admin' OR '1'='1` in the username input and any password string. Alternatively in curl: `curl -X POST http://target.lab:8080/login -d \"username=admin' OR '1'='1&password=x\"`.",
    },
  ]);

  const [userXp, setUserXp] = useState(initialUserXp);

  useEffect(() => {
    api.getProfileDetails()
      .then((data) => {
        if (data && typeof data.xp === "number") {
          setUserXp(data.xp);
        }
      })
      .catch((err) => console.log("Using local user XP:", err));
  }, []);

  const handleUnlockHint = (level: number, cost: number) => {
    if (userXp < cost) return;

    api.unlockHint(labId, level, cost)
      .then((res) => {
        if (res && res.unlocked) {
          setUserXp(res.remaining_xp);
          setHints((prev) =>
            prev.map((h) => (h.level === level ? { ...h, unlocked: true } : h))
          );
        }
      })
      .catch((err) => {
        console.warn("Backend hint unlock error, performing local unlock:", err);
        setUserXp((prev) => Math.max(0, prev - cost));
        setHints((prev) =>
          prev.map((h) => (h.level === level ? { ...h, unlocked: true } : h))
        );
      });
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl p-4 font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-foreground text-sm">
            AI Socratic Hint Assistant
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-mono">
          <Zap className="w-3.5 h-3.5" />
          <span>{userXp} XP Available</span>
        </div>
      </div>

      {/* Hints Accordion */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {hints.map((hint) => (
          <div
            key={hint.level}
            className={`p-3.5 rounded-xl border transition-all ${
              hint.unlocked
                ? "bg-surface-elevated border-primary/30"
                : "bg-surface border-border opacity-90"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {hint.unlocked ? (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-foreground-muted" />
                )}
                <span className="font-semibold text-xs text-foreground">{hint.title}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-foreground-muted">
                {hint.cost === 0 ? "FREE" : `-${hint.cost} XP`}
              </span>
            </div>

            {hint.unlocked ? (
              <p className="text-xs text-foreground-secondary leading-relaxed bg-surface/50 p-2.5 rounded border border-border/40 font-mono">
                {hint.content}
              </p>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-foreground-muted">
                  Unlock progressive hint without spoiling the solution
                </span>
                <button
                  onClick={() => handleUnlockHint(hint.level, hint.cost)}
                  disabled={userXp < hint.cost}
                  className="bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/30 px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                >
                  Unlock ({hint.cost} XP)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
