"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Award,
  TrendingUp,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, Badge, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

const mockLeaderboardData = [
  { rank: 1, name: "AlexHacker", xp: 45230, solved: 154, activeDays: 45, current: false },
  { rank: 2, name: "SecureSam", xp: 42100, solved: 142, activeDays: 38, current: false },
  { rank: 3, name: "CyberNinja", xp: 39850, solved: 135, activeDays: 52, current: false },
  { rank: 4, name: "NetSlayer", xp: 35120, solved: 110, activeDays: 28, current: false },
  { rank: 5, name: "BitShift", xp: 32400, solved: 98, activeDays: 21, current: false },
  { rank: 6, name: "John Doe", xp: 12560, solved: 42, activeDays: 14, current: true }, // Current User
  { rank: 7, name: "FirewallFighter", xp: 11800, solved: 38, activeDays: 12, current: false },
  { rank: 8, name: "CookieMonster", xp: 9500, solved: 30, activeDays: 10, current: false },
  { rank: 9, name: "ZeroDay", xp: 8200, solved: 25, activeDays: 8, current: false },
  { rank: 10, name: "CryptoQueen", xp: 7400, solved: 22, activeDays: 7, current: false },
];

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardData, setLeaderboardData] = useState(mockLeaderboardData);

  useEffect(() => {
    api.getLeaderboard()
      .then((data) => {
        if (data && data.length > 0) {
          setLeaderboardData(data);
        }
      })
      .catch((err) => console.log("Using cached leaderboard stand-ins:", err));
  }, []);

  const filtered = leaderboardData.filter((user) => {
    const nameStr = (user.name || (user as any).username || "").toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return !q || nameStr.includes(q);
  });

  const topThree = leaderboardData.filter((u) => u.rank <= 3);
  const others = filtered.filter((u) => u.rank > 3);
  const currentUserEntry = leaderboardData.find((u) => u.current);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Global Leaderboard</h1>
            <p className="text-foreground-secondary mt-1">
              Compete with cybersecurity students worldwide. Climb ranks by completing labs.
            </p>
          </div>
          <Badge variant="warning" size="md" className="bg-warning/5 border border-warning/20 text-warning py-2 px-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            <span>{currentUserEntry ? `Rank #${currentUserEntry.rank} Worldwide` : "Competing Worldwide"}</span>
          </Badge>
        </div>
      </motion.div>

      {/* Top 3 Podiums */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8 pb-4">
        {/* 2nd place (renders left on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="order-2 md:order-1"
        >
          <Card padding="lg" className="text-center relative border border-border bg-surface/80 flex flex-col items-center">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-foreground-secondary/20 flex items-center justify-center border-2 border-foreground-secondary shadow-lg">
              <span className="text-lg font-extrabold text-foreground-secondary">2</span>
            </div>
            <div className="mt-4">
              <Avatar name={topThree[1]?.name || "TBD"} size="lg" />
            </div>
            <h3 className="text-base font-bold text-foreground mt-3">{topThree[1]?.name || "TBD"}</h3>
            <p className="text-xs text-foreground-muted">Solved: {topThree[1]?.solved ?? 0} labs</p>
            <div className="mt-4 px-4 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>{(topThree[1]?.xp ?? 0).toLocaleString()} XP</span>
            </div>
          </Card>
        </motion.div>

        {/* 1st place (renders center and taller) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-1 md:order-2"
        >
          <Card padding="lg" glow="primary" className="text-center relative border-2 border-warning bg-surface/90 flex flex-col items-center py-8">
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center border-2 border-warning shadow-lg glow-yellow">
              <Trophy className="w-6 h-6 text-warning animate-bounce" />
            </div>
            <div className="mt-4 relative">
              <Avatar name={topThree[0]?.name || "TBD"} size="lg" className="w-20 h-20 border-2 border-warning" />
              <Sparkles className="w-5 h-5 text-warning absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-foreground mt-3 flex items-center gap-1.5">
              {topThree[0]?.name || "TBD"}
            </h3>
            <p className="text-xs text-foreground-muted">Solved: {topThree[0]?.solved ?? 0} labs</p>
            <div className="mt-4 px-5 py-2 bg-warning/10 rounded-full text-sm font-bold text-warning flex items-center gap-1 shadow-glow border border-warning/10">
              <Zap className="w-4 h-4 text-warning" />
              <span>{(topThree[0]?.xp ?? 0).toLocaleString()} XP</span>
            </div>
          </Card>
        </motion.div>

        {/* 3rd place (renders right) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="order-3"
        >
          <Card padding="lg" className="text-center relative border border-border bg-surface/80 flex flex-col items-center">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-amber-700/20 flex items-center justify-center border-2 border-amber-700 shadow-lg">
              <span className="text-lg font-extrabold text-amber-700">3</span>
            </div>
            <div className="mt-4">
              <Avatar name={topThree[2]?.name || "TBD"} size="lg" />
            </div>
            <h3 className="text-base font-bold text-foreground mt-3">{topThree[2]?.name || "TBD"}</h3>
            <p className="text-xs text-foreground-muted">Solved: {topThree[2]?.solved ?? 0} labs</p>
            <div className="mt-4 px-4 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>{(topThree[2]?.xp ?? 0).toLocaleString()} XP</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Table search filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base font-bold text-foreground">Top Active Learners</h3>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-[var(--radius-lg)] pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
          />
        </div>
      </div>

      {/* List */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/20 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                <th className="py-3 px-6">Rank</th>
                <th className="py-3 px-6">Learner</th>
                <th className="py-3 px-6">Labs Solved</th>
                <th className="py-3 px-6">Streak</th>
                <th className="py-3 px-6 text-right">XP Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {others.map((user) => (
                <tr
                  key={user.rank}
                  className={`text-sm transition-colors duration-150 ${
                    user.current ? "bg-primary/5 hover:bg-primary/10 font-bold" : "hover:bg-surface-elevated/40"
                  }`}
                >
                  <td className="py-4 px-6 font-bold text-foreground-secondary">
                    {user.current ? (
                      <Badge variant="primary">#{user.rank}</Badge>
                    ) : (
                      <span>#{user.rank}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 flex items-center gap-3">
                    <Avatar name={user.name} size="sm" />
                    <div>
                      <span className="text-foreground">{user.name}</span>
                      {user.current && (
                        <span className="text-[10px] text-primary block">You</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-foreground-secondary">{user.solved} solved</td>
                  <td className="py-4 px-6">
                    <span className="flex items-center gap-1 text-warning">
                      <Flame className="w-4 h-4" />
                      {user.activeDays} days
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-primary">
                    {user.xp.toLocaleString()} XP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
