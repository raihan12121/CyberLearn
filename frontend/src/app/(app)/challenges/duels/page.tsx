"use client";

import React, { useState, useEffect } from "react";
import { Zap, Swords, Trophy, Clock, Shield, Flame, CheckCircle, RefreshCw, UserCheck } from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";

interface DuelMatch {
  id: string;
  opponent: {
    name: string;
    rank: string;
    xp: number;
    avatar: string;
  };
  targetMachine: string;
  category: string;
  timeLeft: number;
  myScore: number;
  opScore: number;
}

export default function HackerDuelsPage() {
  const [matchmaking, setMatchmaking] = useState(false);
  const [activeMatch, setActiveMatch] = useState<DuelMatch | null>(null);

  const handleStartMatchmaking = () => {
    setMatchmaking(true);
    setTimeout(() => {
      setMatchmaking(false);
      setActiveMatch({
        id: "duel-9912",
        opponent: {
          name: "Viper_Zero",
          rank: "Penetration Tester",
          xp: 4850,
          avatar: "🐍",
        },
        targetMachine: "Vulnerable-Node-10.10.33.8",
        category: "Speed Web Hacking",
        timeLeft: 600,
        myScore: 100,
        opScore: 0,
      });
    }, 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-surface to-surface border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                Live Compete Mode
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">1v1 Hacker Duels & Speed CTF Arena</h1>
            <p className="text-sm text-foreground-secondary mt-1">
              Race against opposing security practitioners in real-time speed hacking matches. First to exploit or patch wins!
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleStartMatchmaking}
            disabled={matchmaking}
            icon={<Swords className="w-4 h-4" />}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
          >
            {matchmaking ? "Searching Opponent..." : "Find 1v1 Ranked Match"}
          </Button>
        </div>
      </div>

      {/* Matchmaking / Active Match View */}
      {matchmaking && (
        <Card padding="lg" className="text-center py-12 space-y-4">
          <RefreshCw className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-foreground">Searching for Opponent of Equal Rank...</h3>
          <p className="text-xs text-foreground-secondary">Pairing with online players in your MMR tier.</p>
        </Card>
      )}

      {activeMatch && !matchmaking && (
        <div className="bg-surface border-2 border-purple-500/40 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="text-xs font-mono text-purple-400 font-bold">
              MATCH ID: #{activeMatch.id} • {activeMatch.category}
            </span>
            <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              <Clock className="w-4 h-4" />
              <span>09:42 Remaining</span>
            </div>
          </div>

          {/* Player vs Player Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* You */}
            <div className="bg-surface-elevated border border-emerald-500/40 p-5 rounded-xl text-center space-y-2">
              <div className="text-3xl">👤</div>
              <h3 className="font-bold text-foreground text-sm">You (Raihan)</h3>
              <p className="text-xs text-emerald-400 font-semibold font-mono">Score: {activeMatch.myScore} XP</p>
              <Badge variant="success" size="sm">First Flag Captured</Badge>
            </div>

            {/* VS Badge */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-500 text-purple-400 font-black flex items-center justify-center mx-auto text-lg">
                VS
              </div>
              <p className="text-xs text-foreground-muted mt-2">Target Machine: {activeMatch.targetMachine}</p>
            </div>

            {/* Opponent */}
            <div className="bg-surface-elevated border border-border p-5 rounded-xl text-center space-y-2">
              <div className="text-3xl">{activeMatch.opponent.avatar}</div>
              <h3 className="font-bold text-foreground text-sm">{activeMatch.opponent.name}</h3>
              <p className="text-xs text-foreground-muted font-mono">Score: {activeMatch.opScore} XP</p>
              <Badge variant="outline" size="sm">{activeMatch.opponent.rank}</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table preview */}
      <Card padding="lg">
        <h3 className="font-bold text-foreground text-sm mb-3">Global Speed Duel Leaders</h3>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between py-2 border-b border-border text-foreground-secondary">
            <span>#1 CyberNinja_X (Winrate: 92%)</span>
            <span className="text-primary font-bold">4,120 Win XP</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border text-foreground-secondary">
            <span>#2 NullPointer (Winrate: 88%)</span>
            <span className="text-primary font-bold">3,890 Win XP</span>
          </div>
          <div className="flex items-center justify-between py-2 text-foreground-secondary">
            <span>#3 HexMaster (Winrate: 84%)</span>
            <span className="text-primary font-bold">3,650 Win XP</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
