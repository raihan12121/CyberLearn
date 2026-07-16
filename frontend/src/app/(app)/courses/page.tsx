"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
} from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";

const categories = ["All", "Web Security", "Linux", "Networking", "Programming", "CTF", "AI Security"];

const courses = [
  {
    id: "web-security-fundamentals",
    title: "Web Security Fundamentals",
    category: "Web Security",
    difficulty: "Beginner",
    duration: "6 hours",
    lessons: 12,
    progress: 0,
    desc: "Learn core web application security concepts, including injection, broken auth, and sensitive data exposure.",
    image: "🛡️",
    xp: 1200,
  },
  {
    id: "linux-basics",
    title: "Linux Basics",
    category: "Linux",
    difficulty: "Beginner",
    duration: "8 hours",
    lessons: 18,
    progress: 0,
    desc: "Master the Linux command line, file systems, permissions, shell scripting, and basic administration.",
    image: "🐧",
    xp: 1500,
  },
  {
    id: "network-security-essentials",
    title: "Network Security Essentials",
    category: "Networking",
    difficulty: "Beginner",
    duration: "5 hours",
    lessons: 15,
    progress: 0,
    desc: "Understand network protocols, packet sniffing, firewalls, and secure communications.",
    image: "🔌",
    xp: 1200,
  },
  {
    id: "python-for-security",
    title: "Python for Security",
    category: "Programming",
    difficulty: "Intermediate",
    duration: "10 hours",
    lessons: 20,
    progress: 0,
    desc: "Automate security tasks, write custom scanners, and create exploitation scripts with Python.",
    image: "🐍",
    xp: 2000,
  },
  {
    id: "owasp-top-10",
    title: "OWASP Top 10 Deep Dive",
    category: "Web Security",
    difficulty: "Intermediate",
    duration: "7 hours",
    lessons: 10,
    progress: 0,
    desc: "An in-depth study of the top 10 web application vulnerabilities defined by OWASP.",
    image: "🕸️",
    xp: 1600,
  },
  {
    id: "ethical-hacking-pentest",
    title: "Ethical Hacking & Penetration Testing",
    category: "CTF",
    difficulty: "Advanced",
    duration: "15 hours",
    lessons: 25,
    progress: 0,
    desc: "A hands-on guide to penetration testing methodologies, scanning, vulnerability analysis, and exploitation.",
    image: "⚔️",
    xp: 3000,
  },
  {
    id: "ai-security-prompt-injection",
    title: "AI Security & Prompt Injection",
    category: "AI Security",
    difficulty: "Expert",
    duration: "4 hours",
    lessons: 8,
    progress: 0,
    desc: "Learn about the security risks of Large Language Models, prompt injection, and how to defend against them.",
    image: "🤖",
    xp: 1000,
  },
];

const difficultyColor: Record<string, "success" | "primary" | "warning" | "danger"> = {
  Beginner: "success",
  Intermediate: "primary",
  Advanced: "warning",
  Expert: "danger",
};

export default function CoursesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseList, setCourseList] = useState(courses);

  useEffect(() => {
    Promise.all([api.getCourses(), api.getProgress()])
      .then(([coursesData, progressData]) => {
        if (coursesData && coursesData.length > 0) {
          const merged = coursesData.map((c: any) => {
            const local = courses.find((l) => l.id === c.id);
            
            // Calculate progress based on completed lessons count from database
            const dbLessons = c.lessons || [];
            const totalLessons = dbLessons.length;
            const courseLessonsProgress = progressData.filter(
              (p: any) => p.course_id === c.id && p.status === "completed"
            );
            const completedCount = courseLessonsProgress.length;
            const calculatedProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

            return {
              ...c,
              progress: calculatedProgress,
              image: local ? local.image : "🛡️",
              xp: local ? local.xp : 1200,
              duration: local ? local.duration : "5 hours",
              lessons: totalLessons, // Use actual count of lessons in the database
            };
          });
          setCourseList(merged);
        }
      })
      .catch((err) => {
        console.log("Error loading courses and progress:", err);
        // Fallback to offline defaults
        setCourseList(courses);
      });
  }, []);

  const filtered = courseList.filter((c) => {
    const matchCategory = activeCategory === "All" || c.category === activeCategory;
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        c.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Course Catalog</h1>
            <p className="text-foreground-secondary mt-1">
              Select a learning track, complete challenges, and earn certificates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Card padding="sm" className="flex items-center gap-3 bg-surface-elevated/50">
              <Award className="w-5 h-5 text-warning" />
              <div>
                <p className="text-xs text-foreground-secondary">Certificates Earned</p>
                <p className="text-sm font-semibold text-foreground">0/7 Courses</p>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-surface-elevated text-foreground-secondary hover:text-foreground border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-[var(--radius-lg)] pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover padding="lg" className="h-full flex flex-col justify-between">
              <div>
                {/* Image and difficulty */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{course.image}</span>
                  <Badge variant={difficultyColor[course.difficulty]} size="sm">
                    {course.difficulty}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-foreground mb-2 leading-snug">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-foreground-secondary mb-4 leading-relaxed line-clamp-3">
                  {course.desc}
                </p>
              </div>

              <div>
                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-foreground-muted mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {course.lessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    {course.xp} XP
                  </span>
                </div>

                {/* Progress */}
                {course.progress > 0 && (
                  <div className="mb-4">
                    <ProgressBar value={course.progress} showLabel size="sm" variant="gradient" />
                  </div>
                )}

                {/* CTA */}
                <Button
                  fullWidth
                  onClick={() => router.push(`/courses/${course.id}`)}
                  variant={course.progress > 0 ? "primary" : "outline"}
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  {course.progress > 0 ? "Continue Course" : "Start Course"}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
