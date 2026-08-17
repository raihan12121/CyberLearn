"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Zap,
  Flame,
  Terminal,
  Trophy,
  Target,
  ChevronRight,
  BookOpen,
  Star,
  Award,
  TrendingUp,
  Clock,
  Shield,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { Card, Badge, ProgressBar, Avatar, Button } from "@/components/ui";
import { api } from "@/lib/api";
import SkillRadarChart from "@/components/dashboard/SkillRadarChart";

interface ProfileState {
  full_name: string;
  username: string;
  xp: number;
  streak_days: number;
  solved_labs_count: number;
  rank: number;
  timeline: { action: string; xp: string; date: string }[];
  badges: { name: string; icon: string; desc: string; date: string }[];
}

export default function DashboardPage() {
  const router = useRouter();

  // Dynamic States
  const [profile, setProfile] = useState<ProfileState>({
    full_name: "Learner",
    username: "learner",
    xp: 0,
    streak_days: 0,
    solved_labs_count: 0,
    rank: 1,
    timeline: [],
    badges: [],
  });

  const [leaderboard, setLeaderboard] = useState<{ name: string; xp: number; rank: number }[]>([]);
  const [activeCourses, setActiveCourses] = useState<{ title: string; progress: number; lessons: string; currentLesson: string; image: string; id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current user is admin
    api.getMe()
      .then((user) => {
        if (user && user.role === "admin") {
          setIsAdmin(true);
          router.replace("/admin");
          return;
        }
      })
      .catch(() => {});

    // Fetch Profile Details
    const fetchProfilePromise = api.getProfileDetails()
      .then((data) => {
        if (data) {
          setProfile({
            full_name: data.full_name || "Learner",
            username: data.username || data.email.split("@")[0],
            xp: data.xp || 0,
            streak_days: data.streak_days || 0,
            solved_labs_count: data.solved_labs_count || 0,
            rank: data.rank || 1,
            timeline: data.timeline || [],
            badges: data.badges || [],
          });
        }
        return data;
      })
      .catch((err) => {
        console.warn("Could not fetch profile details, using mock defaults:", err);
        return null;
      });

    // Fetch Leaderboard
    const fetchLeaderboardPromise = api.getLeaderboard()
      .then((data) => {
        if (data && data.length > 0) {
          setLeaderboard(data.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch leaderboard data:", err);
      });

    // Fetch Course Progress & Catalog to determine Active Courses
    Promise.all([api.getCourses(), api.getProgress(), fetchProfilePromise])
      .then(([courses, progressList, profileData]) => {
        if (!courses || courses.length === 0) return;

        const active: typeof activeCourses = [];

        courses.forEach((c: any) => {
          // Get lessons for this course
          // Map to local metadata for display assets
          const courseMapping: Record<string, { image: string; currentLesson: string }> = {
            "web-security-fundamentals": { image: "🛡️", currentLesson: "Cross Site Scripting (XSS)" },
            "linux-basics": { image: "🐧", currentLesson: "File Permissions" },
            "network-security-essentials": { image: "🔌", currentLesson: "Network Protocols" },
            "python-for-security": { image: "🐍", currentLesson: "Python Syntax" },
            "owasp-top-10": { image: "🕸️", currentLesson: "Vulnerability Overview" },
            "ethical-hacking-pentest": { image: "⚔️", currentLesson: "Nmap Scans" },
            "ai-security-prompt-injection": { image: "🤖", currentLesson: "LLM Safety" },
          };

          const mapping = courseMapping[c.id] || { image: "🛡️", currentLesson: "Introduction" };

          // Calculate actual completion percentage from progress list
          const courseProgress = progressList.filter((p: { course_id: string; status: string }) => p.course_id === c.id);
          const completedCount = courseProgress.filter((p: { status: string }) => p.status === "completed").length;
          
          // Total lessons seeded in backend or local list
          const totalLessonsCount = c.lessons?.length || 10;
          const progressPct = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

          // If there is progress, mark it as active
          if (progressPct > 0) {
            active.push({
              id: c.id,
              title: c.title,
              progress: progressPct,
              lessons: `${totalLessonsCount} lessons`,
              currentLesson: mapping.currentLesson,
              image: mapping.image,
            });
          }
        });

        setActiveCourses(active.slice(0, 2));
      })
      .catch((err) => {
        console.warn("Could not calculate active courses progress:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const statsRow = [
    { label: "XP Earned", value: profile.xp.toLocaleString(), icon: Zap, color: "text-primary", bg: "bg-primary/10" },
    { label: "Current Streak", value: `${profile.streak_days} Days`, icon: Flame, color: "text-warning", bg: "bg-warning/10" },
    { label: "Labs Completed", value: `${profile.solved_labs_count}`, icon: Terminal, color: "text-accent", bg: "bg-accent/10" },
    { label: "Rank", value: `#${profile.rank}`, icon: Trophy, color: "text-secondary-light", bg: "bg-secondary/10" },
  ];

  const recommended = [
    { id: "network-security-essentials", title: "Network Essentials", category: "Networking", difficulty: "Beginner" },
    { id: "python-for-security", title: "Python for Security", category: "Programming", difficulty: "Intermediate" },
    { id: "owasp-top-10", title: "OWASP Top 10", category: "Web Security", difficulty: "Beginner" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Admin Mode Quick Switcher Banner */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">Administrator Session Active</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  System Admin
                </span>
              </div>
              <p className="text-xs text-foreground-secondary mt-0.5">
                You are currently viewing the student dashboard. Switch to the Admin Control Center to manage users, review student KYC verifications, and inspect system telemetry.
              </p>
            </div>
          </div>

          <Button
            onClick={() => router.push("/admin")}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none shadow-md flex items-center gap-2 cursor-pointer text-xs"
          >
            <Shield className="w-4 h-4" />
            <span>Open Admin Portal</span>
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile.full_name}! 👋
          </h1>
          <p className="text-foreground-secondary mt-1">
            Pick up where you left off and continue your learning journey.
          </p>
        </div>
        <Card padding="sm" className="flex items-center gap-3 w-fit shrink-0">
          <Target className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-foreground-secondary">Daily Goal</p>
            <p className="text-sm font-semibold text-foreground">
              {Math.min(profile.solved_labs_count, 5)}/5 Labs
            </p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {Math.round((Math.min(profile.solved_labs_count, 5) / 5) * 100)}%
            </span>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsRow.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* 6-Axis Skill Radar Component */}
      <SkillRadarChart />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Continue Learning</h2>
              <button
                onClick={() => router.push("/courses")}
                className="text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1 cursor-pointer"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCourses.map((course) => (
                <Card key={course.title} hover padding="lg" className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{course.image}</span>
                      <Badge variant="primary" size="sm">{course.lessons}</Badge>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-foreground-secondary mb-3">
                      Next: {course.currentLesson}
                    </p>
                  </div>
                  <div>
                    <ProgressBar value={course.progress} showLabel variant="gradient" size="sm" className="mb-4" />
                    <Button size="sm" className="w-full" onClick={() => router.push(`/courses/${course.id}`)}>
                      Continue
                    </Button>
                  </div>
                </Card>
              ))}
              {activeCourses.length === 0 && (
                <Card padding="lg" className="col-span-1 md:col-span-2 text-center text-foreground-secondary">
                  No courses in progress. Explore the catalog to start!
                </Card>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <Card padding="none">
              {profile.timeline.slice(0, 3).map((activity, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 ${
                    i < profile.timeline.length - 1 && i < 2 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                      <Terminal className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-foreground-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {activity.date}
                      </p>
                    </div>
                  </div>
                  {activity.xp && (
                    <Badge variant="success" size="sm">{activity.xp}</Badge>
                  )}
                </div>
              ))}
              {profile.timeline.length === 0 && (
                <div className="p-4 text-center text-sm text-foreground-secondary">
                  No recent learning activities recorded yet.
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Achievements */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Achievements</h2>
            <Card padding="lg">
              <div className="grid grid-cols-3 gap-3">
                {profile.badges.slice(0, 3).map((achievement) => (
                  <div
                    key={achievement.name}
                    className="text-center"
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <p className="text-[10px] text-foreground-secondary leading-tight">
                      {achievement.name}
                    </p>
                  </div>
                ))}
                {profile.badges.length === 0 && (
                  <div className="col-span-3 text-center text-xs text-foreground-muted py-2">
                    Submit flags to earn achievement badges.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Recommended */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recommended</h2>
            <div className="space-y-3">
              {recommended.map((course) => (
                <Card
                  key={course.title}
                  hover
                  padding="sm"
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => router.push(`/courses/${course.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{course.title}</p>
                      <p className="text-xs text-foreground-muted">{course.category}</p>
                    </div>
                  </div>
                  <Badge
                    variant={course.difficulty === "Beginner" ? "success" : "warning"}
                    size="sm"
                  >
                    {course.difficulty}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Leaderboard</h2>
            <Card padding="lg">
              {leaderboard.map((user) => (
                <div key={user.rank} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${
                      user.rank === 1 ? "text-warning" : user.rank === 2 ? "text-foreground-secondary" : "text-warning/60"
                    }`}>
                      #{user.rank}
                    </span>
                    <Avatar name={user.name} size="sm" />
                    <span className="text-sm font-medium text-foreground">{user.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-primary">{user.xp.toLocaleString()} XP</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center text-xs text-foreground-muted py-2">
                  No competitors listed yet.
                </div>
              )}
              <button
                onClick={() => router.push("/leaderboard")}
                className="w-full text-center text-sm text-primary mt-3 hover:text-primary-hover transition-colors cursor-pointer"
              >
                View Full Leaderboard →
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
