"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Terminal,
  Award,
  Zap,
  Star,
  Settings,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Globe,
  User,
} from "lucide-react";
import { Card, Badge, Button, ProgressBar, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

const mockSkillStats = [
  { name: "Web Security", value: 85, color: "bg-primary" },
  { name: "Linux Administration", value: 65, color: "bg-accent" },
  { name: "Network Defense", value: 40, color: "bg-warning" },
  { name: "Cryptography", value: 50, color: "bg-secondary" },
  { name: "AI Safety", value: 20, color: "bg-error" },
];

const mockAchievementsList = [
  { name: "50 Labs Master", icon: "🏆", date: "June 14, 2026", desc: "Completed 50 sandbox practice labs." },
  { name: "Web Wizard", icon: "🧙", date: "June 12, 2026", desc: "Bypassed 10 web filter challenges." },
  { name: "Top 10% Rank", icon: "⭐", date: "June 08, 2026", desc: "Ranked among top 10% global active learners." },
  { name: "First Blood", icon: "🎯", date: "June 05, 2026", desc: "Submitted flag within first 5 mins of lab launch." },
];

const mockActivityTimeline = [
  { action: "Completed SQL Injection Bypass Lab", xp: "+150 XP", date: "June 15, 2026, 7:12 PM" },
  { action: "Earned 'Web Wizard' Achievement Badge", xp: "+50 XP", date: "June 12, 2026, 4:32 PM" },
  { action: "Solved 'Book Recon' OSINT Challenge", xp: "+100 XP", date: "June 09, 2026, 11:20 AM" },
  { action: "Successfully set up 2FA Authenticator", xp: "", date: "June 05, 2026, 9:15 AM" },
];

export default function ProfilePage() {
  const router = useRouter();
  
  const [profileData, setProfileData] = useState({
    full_name: "John Doe",
    username: "johndoe",
    joined_date: "Joined June 2026",
    role: "student",
    rank: 248,
    xp: 12560,
    solved_labs_count: 72,
    streak_days: 14
  });

  const [skills, setSkills] = useState(mockSkillStats);
  const [badges, setBadges] = useState(mockAchievementsList);
  const [timeline, setTimeline] = useState(mockActivityTimeline);

  useEffect(() => {
    api.getProfileDetails()
      .then((data) => {
        if (data) {
          setProfileData({
            full_name: data.full_name || "John Doe",
            username: data.username || data.email.split("@")[0],
            joined_date: data.joined_date || "Joined June 2026",
            role: data.role || "student",
            rank: data.rank,
            xp: data.xp,
            solved_labs_count: data.solved_labs_count,
            streak_days: data.streak_days
          });
          
          if (data.skill_stats && data.skill_stats.length > 0) {
            const colors = ["bg-primary", "bg-accent", "bg-warning", "bg-secondary", "bg-error"];
            const mappedSkills = data.skill_stats.map((s: { name: string; value: number }, idx: number) => ({
              name: s.name,
              value: s.value,
              color: colors[idx % colors.length]
            }));
            setSkills(mappedSkills);
          }
          
          if (data.badges && data.badges.length > 0) {
            setBadges(data.badges);
          }
          
          if (data.timeline && data.timeline.length > 0) {
            setTimeline(data.timeline);
          }
        }
      })
      .catch((err) => console.log("Using cached mock profile assets:", err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Banner / Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-r from-primary/10 via-secondary/10 to-surface border border-border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <Avatar name={profileData.full_name} size="lg" className="w-20 h-20 border-2 border-primary" />
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{profileData.full_name}</h1>
              <Badge variant="primary">{profileData.role === "admin" ? "Platform Admin" : "Pro Member"}</Badge>
            </div>
            <p className="text-sm text-foreground-secondary mt-1">@{profileData.username} • Student & Ethical Hacker</p>
            <p className="text-xs text-foreground-muted flex items-center justify-center md:justify-start gap-1 mt-2">
              <Calendar className="w-3.5 h-3.5" /> {profileData.joined_date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => router.push("/portfolio/me")}
            icon={<Globe className="w-4 h-4" />}
          >
            View Cyber Portfolio
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/settings")}
            icon={<Settings className="w-4 h-4" />}
          >
            Edit Profile
          </Button>
        </div>
      </motion.div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stats & Skills (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Performance Summary Cards */}
          <Card padding="lg" className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Cyber Metrics</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-surface-elevated/40 border border-border p-3 rounded-[var(--radius-lg)]">
                <p className="text-[10px] text-foreground-secondary font-semibold">Rank</p>
                <p className="text-base font-bold text-primary mt-0.5">#{profileData.rank}</p>
              </div>
              <div className="bg-surface-elevated/40 border border-border p-3 rounded-[var(--radius-lg)]">
                <p className="text-[10px] text-foreground-secondary font-semibold">XP Points</p>
                <p className="text-base font-bold text-warning mt-0.5">{profileData.xp.toLocaleString()}</p>
              </div>
              <div className="bg-surface-elevated/40 border border-border p-3 rounded-[var(--radius-lg)]">
                <p className="text-[10px] text-foreground-secondary font-semibold">Labs Solved</p>
                <p className="text-base font-bold text-accent mt-0.5">{profileData.solved_labs_count}</p>
              </div>
              <div className="bg-surface-elevated/40 border border-border p-3 rounded-[var(--radius-lg)]">
                <p className="text-[10px] text-foreground-secondary font-semibold">Streak</p>
                <p className="text-base font-bold text-error mt-0.5">{profileData.streak_days} Days</p>
              </div>
            </div>
          </Card>

          {/* Skill progress bars */}
          <Card padding="lg" className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Cyber Skillset</h3>
            <div className="space-y-3">
              {skills.map((skill) => (
                <div key={skill.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground-secondary">{skill.name}</span>
                    <span className="text-foreground">{skill.value}%</span>
                  </div>
                  <ProgressBar value={skill.value} variant="gradient" size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Achievements & Activity timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Achievements Grid */}
          <Card padding="lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">Badges & Achievements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badges.map((badge) => (
                <div key={badge.name} className="flex gap-3 bg-surface-elevated/30 border border-border p-3.5 rounded-[var(--radius-lg)] hover:bg-surface-elevated/50 transition-colors duration-150">
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{badge.name}</h4>
                    <p className="text-[10px] text-foreground-muted mt-0.5 font-normal leading-normal">{badge.desc}</p>
                    <span className="text-[9px] text-primary mt-2 block font-semibold">{badge.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card padding="lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">Activity Timeline</h3>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {timeline.map((activity, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 z-10">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4">
                    <div>
                      <p className="text-xs font-bold text-foreground">{activity.action}</p>
                      <span className="text-[10px] text-foreground-muted mt-0.5 block">{activity.date}</span>
                    </div>
                    {activity.xp && (
                      <Badge variant="success" size="sm" className="w-fit">
                        {activity.xp}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
