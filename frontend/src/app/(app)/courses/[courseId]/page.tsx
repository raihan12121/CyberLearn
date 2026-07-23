"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Play,
  FileText,
  HelpCircle,
  ChevronRight,
  Shield,
  Bot,
  Zap,
} from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import Link from "next/link";

const courseData: Record<string, {
  title: string;
  category: string;
  difficulty: string;
  xp: number;
  modules: {
    title: string;
    lessons: {
      id: string;
      title: string;
      type: "video" | "reading" | "quiz";
      duration: string;
      completed: boolean;
      content?: string;
      videoUrl?: string;
      quizQuestions?: {
        q: string;
        options: string[];
        answer: number;
      }[];
    }[];
  }[];
}> = {
  "web-security-fundamentals": {
    title: "Web Security Fundamentals",
    category: "Web Security",
    difficulty: "Beginner",
    xp: 1200,
    modules: [
      {
        title: "Module 1: Introduction to Web Security",
        lessons: [
          {
            id: "web-intro",
            title: "How the Web Works: HTTP and HTML",
            type: "video",
            duration: "10 mins",
            completed: true,
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
            content: "Welcome to Web Security Fundamentals! In this lesson, we will explore the underlying architecture of the web, focusing on HTTP protocol, client-server models, headers, and basic HTML structure. Understanding these basics is critical before searching for vulnerabilities.",
          },
          {
            id: "same-origin-policy",
            title: "The Same-Origin Policy (SOP)",
            type: "reading",
            duration: "15 mins",
            completed: true,
            content: `The Same-Origin Policy (SOP) is a critical security mechanism that restricts how a document or script loaded from one origin can interact with a resource from another origin. 
            
Origin is defined by:
1. Scheme (e.g. http, https)
2. Host (domain name)
3. Port (e.g. 80, 443)

If any of these three elements differ, they are considered different origins. For example, a script on \`https://attacker.com\` cannot access cookies or state on \`https://bank.com\` due to SOP.`,
          },
          {
            id: "sop-quiz",
            title: "Module 1 Assessment",
            type: "quiz",
            duration: "5 mins",
            completed: false,
            quizQuestions: [
              {
                q: "Which of the following defines an Origin in the context of the Same-Origin Policy?",
                options: [
                  "Protocol, Domain Name, and Port",
                  "Domain Name and Path",
                  "IP Address and Port",
                  "Protocol and Domain Name only",
                ],
                answer: 0,
              },
              {
                q: "If SOP prevents cross-origin reads, why can you still embed cross-origin images or scripts?",
                options: [
                  "SOP has exceptions that allow cross-origin embedding, but restricts reading the raw data",
                  "SOP is only active on banking sites",
                  "SOP is outdated and no longer used by modern browsers",
                  "It requires user authentication to embed them",
                ],
                answer: 0,
              },
            ],
          },
        ],
      },
      {
        title: "Module 2: Injection Vulnerabilities",
        lessons: [
          {
            id: "xss-intro",
            title: "Cross-Site Scripting (XSS) Types",
            type: "video",
            duration: "12 mins",
            completed: false,
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
            content: "Learn the difference between Stored XSS, Reflected XSS, and DOM-based XSS. We will write basic payloads and study their exploitation routes.",
          },
          {
            id: "sql-injection-intro",
            title: "SQL Injection (SQLi) Basics",
            type: "reading",
            duration: "20 mins",
            completed: false,
            content: `SQL Injection occurs when user input is directly concatenated into a database query. This allows attackers to manipulate SQL queries.

For example, a query like:
\`\`\`sql
SELECT * FROM users WHERE username = '` + "`" + ` + userInput + ` + "`" + `' AND password = '` + "`" + ` + passwordInput + ` + "`" + `';
\`\`\`

If the attacker inputs:
\`\`\`text
admin' OR '1'='1
\`\`\`

The query becomes:
\`\`\`sql
SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = '...';
\`\`\`
This query will return true, bypassing password verification!`,
          },
        ],
      },
    ],
  },
  "linux-basics": {
    title: "Linux Basics",
    category: "Linux",
    difficulty: "Beginner",
    xp: 1500,
    modules: [
      {
        title: "Module 1: The Command Line Interface",
        lessons: [
          {
            id: "linux-navigation",
            title: "Navigation & Listing Commands",
            type: "video",
            duration: "8 mins",
            completed: true,
            content: "Learn how to use cd, ls, pwd, and find to navigate file directories in Linux.",
          },
          {
            id: "file-management",
            title: "Creating, Reading, and Editing Files",
            type: "reading",
            duration: "12 mins",
            completed: false,
            content: "Understand commands like touch, mkdir, cat, nano, echo, and rm.",
          },
        ],
      },
    ],
  },
  "network-security-essentials": {
    title: "Network Security Essentials",
    category: "Networking",
    difficulty: "Beginner",
    xp: 1200,
    modules: [
      {
        title: "Module 1: Fundamentals of Network Defense",
        lessons: [
          {
            id: "network-basics",
            title: "Understanding Network Protocols",
            type: "video",
            duration: "15 mins",
            completed: false,
            content: "Learn the foundation of network communications with TCP/IP, DNS, and IP routing protocols.",
          },
          {
            id: "packet-sniffing",
            title: "Packet Sniffing and Security",
            type: "reading",
            duration: "20 mins",
            completed: false,
            content: "Understand how plaintext network traffic can be intercepted and how tools like tcpdump and Wireshark allow analysis.",
          },
        ],
      },
    ],
  },
  "python-for-security": {
    title: "Python for Security",
    category: "Programming",
    difficulty: "Intermediate",
    xp: 2000,
    modules: [
      {
        title: "Module 1: Automation and Custom Tooling",
        lessons: [
          {
            id: "python-basics",
            title: "Python Basics for Scripting",
            type: "reading",
            duration: "15 mins",
            completed: false,
            content: "Learn variables, loops, conditionals, and requests library to automate basic security auditing tasks.",
          },
          {
            id: "port-scanner",
            title: "Building a Simple Port Scanner",
            type: "reading",
            duration: "20 mins",
            completed: false,
            content: "Write a simple script using socket module to connect to system addresses and identify open ports.",
          },
        ],
      },
    ],
  },
  "owasp-top-10": {
    title: "OWASP Top 10 Deep Dive",
    category: "Web Security",
    difficulty: "Intermediate",
    xp: 1600,
    modules: [
      {
        title: "Module 1: OWASP Core Framework",
        lessons: [
          {
            id: "owasp-intro",
            title: "Introduction to OWASP Top 10",
            type: "video",
            duration: "10 mins",
            completed: false,
            content: "Overview of the top security risks listed by OWASP, including impact, likelihood, and general mitigations.",
          },
          {
            id: "broken-auth",
            title: "Broken Authentication Mechanisms",
            type: "reading",
            duration: "15 mins",
            completed: false,
            content: "Study authentication flaws, session hijacking, credential stuffing, and brute-force bypass methods.",
          },
        ],
      },
    ],
  },
  "ethical-hacking-pentest": {
    title: "Ethical Hacking & Penetration Testing",
    category: "CTF",
    difficulty: "Advanced",
    xp: 3000,
    modules: [
      {
        title: "Module 1: Auditing & Reconnaissance",
        lessons: [
          {
            id: "pentest-intro",
            title: "Pentesting Methodologies",
            type: "video",
            duration: "12 mins",
            completed: false,
            content: "Introduction to standard penetration testing methodologies: reconnaissance, scanning, gaining access, maintaining access, and reporting.",
          },
          {
            id: "nmap-scanning",
            title: "Active Reconnaissance with Nmap",
            type: "reading",
            duration: "20 mins",
            completed: false,
            content: "Learn Nmap scan types, flags, speed parameters, firewall evasion, and service version detection.",
          },
        ],
      },
    ],
  },
  "ai-security-prompt-injection": {
    title: "AI Security & Prompt Injection",
    category: "AI Security",
    difficulty: "Expert",
    xp: 1000,
    modules: [
      {
        title: "Module 1: Security for LLMs",
        lessons: [
          {
            id: "ai-risks",
            title: "Vulnerabilities of LLM Systems",
            type: "video",
            duration: "10 mins",
            completed: false,
            content: "Overview of prompt injections, training data poisoning, model theft, and insecure output handling.",
          },
          {
            id: "securing-llm",
            title: "Hardening LLM Prompts",
            type: "reading",
            duration: "15 mins",
            completed: false,
            content: "Methods to validate LLM inputs/outputs, sanitize user fields, and create robust, instruction-compliant system prompts.",
          },
        ],
      },
    ],
  },
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = (params?.courseId as string) || "web-security-fundamentals";
  const course = courseData[courseId] || courseData["web-security-fundamentals"];

  // State
  const [activeLesson, setActiveLesson] = useState(course.modules[0].lessons[0]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [completedLessonsSet, setCompletedLessonsSet] = useState<Set<string>>(new Set());

  // Fetch progress on load
  useEffect(() => {
    if (!courseId) return;

    // Fetch dynamic course data from backend
    api.getCourse(courseId)
      .then((data) => {
        if (data && data.lessons && data.lessons.length > 0) {
          // Map backend lessons to view format
          const mappedLessons = data.lessons.map((l: { id: string; title: string; content_type?: string; duration?: number; content?: string }) => ({
            id: l.id,
            title: l.title,
            type: (l.content_type || "reading") as "video" | "reading" | "quiz",
            duration: `${l.duration || 15} mins`,
            completed: false,
            content: l.content || "Lesson content loading...",
          }));

          if (mappedLessons.length > 0) {
            setActiveLesson(mappedLessons[0]);
          }
        }
      })
      .catch((err) => {
        console.warn("Backend course fetch error, using client preset:", err);
      });
    
    // Set initial completed lessons based on static preset
    const initialSet = new Set<string>();
    course.modules.forEach((mod) => {
      mod.lessons.forEach((l) => {
        if (l.completed) initialSet.add(l.id);
      });
    });

    Promise.resolve().then(() => {
      setCompletedLessonsSet(initialSet);
    });

    api.getProgress()
      .then((progressList) => {
        const completedIds = new Set<string>(initialSet);
        progressList.forEach((p: { status: string; course_id: string; lesson_id: string }) => {
          if (p.status === "completed" && p.course_id === courseId) {
            completedIds.add(p.lesson_id);
          }
        });
        setCompletedLessonsSet(completedIds);
      })
      .catch((err) => {
        console.warn("Backend offline or progress fetch failed, using offline progress state:", err);
      });
  }, [courseId, course.modules]);


  // Lesson click handler
  const handleLessonClick = (lesson: {
    id: string;
    title: string;
    type: "video" | "reading" | "quiz";
    duration: string;
    completed: boolean;
    content?: string;
    videoUrl?: string;
    quizQuestions?: { q: string; options: string[]; answer: number }[];
  }) => {
    setActiveLesson(lesson);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  // Mark lesson as completed
  const markLessonComplete = (lessonId: string) => {
    api.updateProgress(courseId, lessonId, "completed", 100.0)
      .then(() => {
        const newSet = new Set(completedLessonsSet);
        newSet.add(lessonId);
        setCompletedLessonsSet(newSet);
      })
      .catch((err) => {
        console.warn("Could not log progress to backend, updating locally:", err);
        const newSet = new Set(completedLessonsSet);
        newSet.add(lessonId);
        setCompletedLessonsSet(newSet);
      });
  };

  // Quiz submission handler
  const handleQuizSubmit = () => {
    if (!activeLesson.quizQuestions) return;
    let score = 0;
    activeLesson.quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answer) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    if (score === activeLesson.quizQuestions.length) {
      markLessonComplete(activeLesson.id);
    }
  };

  // Total lessons counting
  const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const completedLessons = course.modules.reduce(
    (acc, mod) => acc + mod.lessons.filter((l) => completedLessonsSet.has(l.id)).length,
    0
  );
  const progressPct = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/courses")}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Courses
        </Button>
        <Badge variant="primary">{course.category}</Badge>
      </div>

      {/* Main Grid: Left Column is Module Sidebar, Right is Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Module Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card padding="lg">
            <h2 className="text-xl font-bold text-foreground mb-1">{course.title}</h2>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="success" size="sm">{course.difficulty}</Badge>
              <span className="text-xs text-foreground-muted">+{course.xp} XP</span>
            </div>
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground-secondary">Progress</span>
                <span className="text-primary">{progressPct}% Complete</span>
              </div>
              <ProgressBar value={progressPct} variant="gradient" size="sm" />
            </div>
          </Card>

          <div className="space-y-3">
            {course.modules.map((mod, modIdx) => (
              <div key={modIdx} className="space-y-1">
                <p className="text-xs font-bold text-foreground-secondary px-2 uppercase tracking-wider mt-2 block">
                  {mod.title}
                </p>
                <div className="space-y-1">
                  {mod.lessons.map((lesson) => {
                    const isSelected = activeLesson.id === lesson.id;
                    const Icon =
                      lesson.type === "video" ? Play :
                      lesson.type === "quiz" ? HelpCircle : FileText;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        className={`w-full flex items-center justify-between p-3 rounded-[var(--radius)] text-left transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border border-primary text-primary"
                            : "bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${
                            isSelected ? "bg-primary/20" : "bg-surface-elevated"
                          }`}>
                            <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-foreground-muted"}`} />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isSelected ? "text-foreground" : "text-foreground-secondary"}`}>
                              {lesson.title}
                            </p>
                            <span className="text-xs text-foreground-muted">{lesson.duration}</span>
                          </div>
                        </div>
                        {completedLessonsSet.has(lesson.id) && (
                          <CheckCircle className="w-4 h-4 text-accent shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card padding="lg" className="min-h-[500px] flex flex-col">
            {/* Active Lesson Header */}
            <div className="border-b border-border pb-4 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {activeLesson.type} Lesson
                </span>
                <h2 className="text-2xl font-bold text-foreground mt-0.5">
                  {activeLesson.title}
                </h2>
              </div>
              <Link
                href="/ai-coach"
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-semibold transition-colors"
              >
                <Bot className="w-4 h-4 text-primary" />
                Ask Coach
              </Link>
            </div>

            {/* Video Player Mock */}
            {activeLesson.type === "video" && (
              <div className="mb-6 rounded-[var(--radius-lg)] overflow-hidden bg-surface-elevated border border-border aspect-video flex flex-col justify-center items-center text-center relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-surface-elevated/80 to-transparent flex flex-col justify-end p-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white font-bold text-lg">{activeLesson.title}</p>
                  <p className="text-white/70 text-xs mt-1">Click to play tutorial</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary flex items-center justify-center cursor-pointer group-hover:scale-110 transition-transform duration-200 shadow-lg glow-primary">
                  <Play className="w-8 h-8 text-primary fill-primary" />
                </div>
                <span className="text-xs text-foreground-secondary font-mono mt-4">
                  Simulated Video Lesson
                </span>
              </div>
            )}

            {/* Reading Content */}
            <div className="prose prose-invert max-w-none text-foreground-secondary text-sm leading-7 space-y-4 font-normal flex-1">
              {activeLesson.content && (
                <div className="whitespace-pre-line bg-surface-elevated/40 p-4 rounded-[var(--radius-lg)] border border-border font-mono text-xs">
                  {activeLesson.content}
                </div>
              )}
            </div>

            {/* Quiz Content */}
            {activeLesson.type === "quiz" && activeLesson.quizQuestions && (
              <div className="space-y-6 mt-4 flex-1">
                {activeLesson.quizQuestions.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <p className="font-semibold text-foreground text-sm">
                      {idx + 1}. {q.q}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[idx] === optIdx;
                        const isCorrect = q.answer === optIdx;
                        let optClass = "border-border hover:bg-surface-elevated/50 text-foreground-secondary";
                        if (quizSubmitted) {
                          if (isCorrect) {
                            optClass = "border-success bg-success/10 text-success";
                          } else if (isSelected) {
                            optClass = "border-error bg-error/10 text-error";
                          }
                        } else if (isSelected) {
                          optClass = "border-primary bg-primary/10 text-primary";
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [idx]: optIdx })}
                            className={`p-3 rounded-[var(--radius)] text-left text-xs font-medium border transition-all duration-200 flex items-center justify-between cursor-pointer ${optClass}`}
                          >
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                  {!quizSubmitted ? (
                    <Button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < activeLesson.quizQuestions.length}
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-semibold text-foreground">
                        Your Score:{" "}
                        <span className={quizScore === activeLesson.quizQuestions.length ? "text-success" : "text-warning"}>
                          {quizScore} / {activeLesson.quizQuestions.length}
                        </span>
                      </p>
                      <Button variant="outline" size="sm" onClick={() => {
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setQuizScore(0);
                      }}>
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Non-quiz Mark Completed Action */}
            {activeLesson.type !== "quiz" && (
              <div className="mt-8 pt-4 border-t border-border flex justify-end">
                {completedLessonsSet.has(activeLesson.id) ? (
                  <div className="flex items-center gap-2 text-accent text-sm font-semibold">
                    <CheckCircle className="w-5 h-5 animate-pulse" />
                    Lesson Completed
                  </div>
                ) : (
                  <Button
                    onClick={() => markLessonComplete(activeLesson.id)}
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
