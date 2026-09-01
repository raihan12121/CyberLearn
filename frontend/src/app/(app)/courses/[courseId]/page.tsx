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
  Award,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore, isUserSubscribed } from "@/lib/authStore";
import SubscriptionPaywallModal from "@/components/subscription/SubscriptionPaywallModal";
import Link from "next/link";
import { Lock } from "lucide-react";

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  if (url.includes("youtube.com/embed/") || url.includes("youtube-nocookie.com/embed/")) {
    return url;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}?rel=0&autoplay=0`;
  }
  if (url.startsWith("http")) {
    return url;
  }
  return null;
}

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
        id?: string;
        q: string;
        options: string[];
        answer: number;
        explanation?: string;
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
        title: "Module 1: Web Architecture & Core Protocols",
        lessons: [
          {
            id: "web-intro",
            title: "How the Web Works: HTTP Server Architecture",
            type: "video",
            duration: "12 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/7GBlCinu9yg",
            content: "Explore the foundational architecture of the web: HTTP request/response lifecycles, headers, status codes, socket connections, and how web servers parse incoming requests.",
          },
          {
            id: "same-origin-policy",
            title: "The Same-Origin Policy (SOP) & CORS",
            type: "reading",
            duration: "15 mins",
            completed: false,
            content: `The Same-Origin Policy (SOP) is a cornerstone security mechanism in modern web browsers that prevents scripts on one origin from reading data from another origin.

An origin is defined strictly by the tuple:
1. Protocol/Scheme (e.g., https://)
2. Host/Domain (e.g., cyberlearn.io)
3. Port (e.g., 443)

Cross-Origin Resource Sharing (CORS) relaxes SOP through explicit server response headers:
- Access-Control-Allow-Origin
- Access-Control-Allow-Credentials
- Access-Control-Allow-Methods`,
          },
          {
            id: "web-sec-quiz-1",
            title: "Module 1 Assessment",
            type: "quiz",
            duration: "5 mins",
            completed: false,
            quizQuestions: [
              {
                q: "Which three components define a web Origin in the Same-Origin Policy?",
                options: [
                  "Protocol, Hostname, and Port",
                  "Hostname, URL Path, and Query String",
                  "IP Address, MAC Address, and Session ID",
                  "Domain Name and User-Agent",
                ],
                answer: 0,
              },
              {
                q: "What header allows a server to explicitly authorize cross-origin AJAX requests?",
                options: [
                  "Access-Control-Allow-Origin",
                  "X-Frame-Options: DENY",
                  "Strict-Transport-Security",
                  "Content-Security-Policy",
                ],
                answer: 0,
              },
            ],
          },
        ],
      },
      {
        title: "Module 2: Client-Side & Server-Side Attacks",
        lessons: [
          {
            id: "xss-deep-dive",
            title: "Cross-Site Scripting (XSS) Origins & Exploitation",
            type: "video",
            duration: "18 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/mKAWpFdVcPY",
            content: "Learn how Stored XSS, Reflected XSS, and DOM-based XSS execute malicious JavaScript within victim browsers. We review real payload samples, cookie theft mechanics, and defensive contextual encoding.",
          },
          {
            id: "sqli-mechanics",
            title: "Running an SQL Injection Attack & Prepared Statements",
            type: "video",
            duration: "20 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/ciNHn38EyRc",
            content: "Master SQL injection vulnerability mechanics from classic authentication bypass (' OR 1=1 --) to UNION-based extraction and error-based payloads, alongside defensive parameterized queries.",
          },
          {
            id: "csrf-video-lesson",
            title: "Cross-Site Request Forgery (CSRF) Deep Dive",
            type: "video",
            duration: "15 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/vRBihr41JTo",
            content: "Understand how CSRF attacks trick authenticated victim browsers into dispatching state-changing requests and how Anti-CSRF tokens and SameSite cookies prevent them.",
          },
        ],
      },
    ],
  },

  "linux-basics": {
    title: "Linux Basics & System Administration",
    category: "Linux",
    difficulty: "Beginner",
    xp: 1500,
    modules: [
      {
        title: "Module 1: Terminal Navigation & File Management",
        lessons: [
          {
            id: "linux-nav-video",
            title: "Linux Tutorial: Basic Command Line Navigation",
            type: "video",
            duration: "15 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/cBokz0LTizk",
            content: "Master the Linux command line hierarchy. Learn pwd, cd, ls -la, mkdir, touch, cat, grep, find, and piping commands (|) in standard Bash environments.",
          },
          {
            id: "linux-perms-video",
            title: "Linux File Permissions in 5 Minutes (Chmod & Chown)",
            type: "video",
            duration: "8 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/LnKoncbQBsM",
            content: "Understand read (r=4), write (w=2), and execute (x=1) permissions across User, Group, and Others with octal and symbolic chmod operations.",
          },
        ],
      },
      {
        title: "Module 2: Permissions, SUID & Process Control",
        lessons: [
          {
            id: "linux-shell-video",
            title: "Shell Scripting Crash Course: Beginner to Pro",
            type: "video",
            duration: "22 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/v-F3YLd6oMw",
            content: "Learn variables, loops, conditional statements, positional arguments, and automating routine system maintenance tasks with Bash scripts.",
          },
          {
            id: "linux-suid-video",
            title: "Linux Privilege Escalation for Beginners (SUID & GTFOBins)",
            type: "video",
            duration: "20 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/ZTnwg3qCdVM",
            content: "Deep dive into Setuid (SUID), Setgid (SGID), and capabilities. Learn how misconfigured binaries allow low-privilege users to spawn root shells.",
          },
          {
            id: "linux-quiz",
            title: "Linux Administration Assessment",
            type: "quiz",
            duration: "8 mins",
            completed: false,
            quizQuestions: [
              {
                q: "What numeric permission gives the owner read, write, and execute, while group and others only receive read and execute?",
                options: ["755", "644", "777", "700"],
                answer: 0,
              },
              {
                q: "What special permission bit allows a binary to execute with the privileges of the file owner rather than the running user?",
                options: ["SUID (Set User ID)", "Sticky Bit", "SGID", "Immutable Bit"],
                answer: 0,
              },
            ],
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
        title: "Module 1: Network Protocols & The OSI Stack",
        lessons: [
          {
            id: "net-tcpip-video",
            title: "Computer Networks & The TCP/IP Protocol Suite",
            type: "video",
            duration: "18 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/3QhU9jd03a0",
            content: "Understand TCP vs UDP, IP addressing, the SYN -> SYN-ACK -> ACK three-way handshake, port ranges, and how packets travel across subnets and gateways.",
          },
          {
            id: "net-subnet-reading",
            title: "Subnetting, Routing Tables & Firewalls",
            type: "reading",
            duration: "20 mins",
            completed: false,
            content: `IPv4 CIDR notation (e.g., /24 = 255.255.255.0 = 254 usable hosts) defines broadcast and network boundaries.
Packet filtering firewalls (iptables, nftables, UFW) evaluate incoming/outgoing traffic based on state, source/destination IP, and port rules.`,
          },
        ],
      },
      {
        title: "Module 2: Packet Analysis & Reconnaissance",
        lessons: [
          {
            id: "wireshark-video",
            title: "Wireshark Tutorial for Beginners: Network Traffic Analysis",
            type: "video",
            duration: "20 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/qTaOZrDnMzQ",
            content: "Master Wireshark filters (http, tcp.flags.syn==1, ip.addr==x.x.x.x), stream reconstruction (Follow TCP Stream), and finding plaintext credentials in captured PCAP files.",
          },
          {
            id: "nmap-video",
            title: "Nmap Tutorial to Find Network Vulnerabilities",
            type: "video",
            duration: "22 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/4t4kBkMsDbQ",
            content: "Learn Nmap scan types: SYN Stealth Scan (-sS), Version Detection (-sV), Default Scripts (-sC), Aggressive Scan (-A), and timing templates (-T4).",
          },
          {
            id: "net-quiz",
            title: "Network Security Assessment",
            type: "quiz",
            duration: "5 mins",
            completed: false,
            quizQuestions: [
              {
                q: "What are the flags exchanged in a standard TCP 3-Way Handshake?",
                options: ["SYN -> SYN-ACK -> ACK", "ACK -> SYN -> RST", "SYN -> ACK -> FIN", "PING -> PONG -> ACK"],
                answer: 0,
              },
              {
                q: "Which Nmap switch performs a TCP SYN stealth scan without completing the connection handshake?",
                options: ["-sS", "-sT", "-sU", "-sV"],
                answer: 0,
              },
            ],
          },
        ],
      },
    ],
  },

  "python-for-security": {
    title: "Python for Security & Tooling",
    category: "Programming",
    difficulty: "Intermediate",
    xp: 2000,
    modules: [
      {
        title: "Module 1: Socket Programming & Network Scripting",
        lessons: [
          {
            id: "py-sec-intro-video",
            title: "Python for Beginners: Full Course & Fundamentals",
            type: "video",
            duration: "20 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/eWRfhZUzrAc",
            content: "Review core Python syntax: variables, control flow, functions, lists, dictionaries, error handling, and string manipulation for security scripts.",
          },
          {
            id: "py-sockets-video",
            title: "Python Socket Programming Tutorial",
            type: "video",
            duration: "20 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/3QiPPX-KeSc",
            content: "Learn how to use Python's built-in socket library to create TCP client/server connections, send raw bytes, handle timeouts, and parse banners.",
          },
        ],
      },
      {
        title: "Module 2: Web Automation & Exploit Scripting",
        lessons: [
          {
            id: "py-scanner-video",
            title: "Sockets Tutorial with Python 3: Making a Port Scanner",
            type: "video",
            duration: "24 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/LV-lFjPQR20",
            content: "Step-by-step implementation of a fast multi-threaded port scanner using Python socket connections and threading.",
          },
          {
            id: "py-hacking-video",
            title: "The Best Way to Learn Python (For Ethical Hacking)",
            type: "video",
            duration: "18 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/Fxh9X3-hO4Y",
            content: "Discover practical Python libraries for penetration testing: Requests for web scraping, Scapy for packet crafting, and Cryptography for hashing.",
          },
          {
            id: "py-quiz",
            title: "Python Security Scripting Assessment",
            type: "quiz",
            duration: "5 mins",
            completed: false,
            quizQuestions: [
              {
                q: "Which Python module is standard for low-level TCP/UDP socket network connections?",
                options: ["socket", "requests", "urllib", "http.client"],
                answer: 0,
              },
              {
                q: "What method is called on a socket object to establish a TCP connection to an IP and port?",
                options: ["connect()", "bind()", "listen()", "send()"],
                answer: 0,
              },
            ],
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
        title: "Module 1: OWASP Core Framework & Injection",
        lessons: [
          {
            id: "owasp-overview-video",
            title: "7 Security Risks You Should Never Take as a Developer",
            type: "video",
            duration: "15 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/4YOpILi9Oxs",
            content: "Comprehensive overview of the OWASP Top 10 vulnerabilities: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, and SSRF.",
          },
          {
            id: "owasp-auth-video",
            title: "Hacking Websites with SQL Injection & Broken Auth",
            type: "video",
            duration: "18 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/_jKylhJtPmI",
            content: "Analyze session fixation, weak password reset tokens, SQL injection bypasses, and how to enforce robust authentication defenses.",
          },
        ],
      },
      {
        title: "Module 2: Access Control, IDOR & SSRF",
        lessons: [
          {
            id: "owasp-idor-video",
            title: "IDOR Explained: Insecure Direct Object References",
            type: "video",
            duration: "16 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/iWbWgjrj_g4",
            content: "Understand horizontal and vertical access control vulnerabilities where attackers manipulate IDs in requests to access other users' private accounts.",
          },
          {
            id: "owasp-ssrf-video",
            title: "Server-Side Request Forgery (SSRF) Explained & Demonstrated",
            type: "video",
            duration: "20 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/Zyt7lUO3mY8",
            content: "Learn how SSRF forces vulnerable backend servers to make unauthorized HTTP requests to internal cloud metadata endpoints (169.254.169.254) and intranet services.",
          },
          {
            id: "owasp-quiz",
            title: "OWASP Top 10 Assessment",
            type: "quiz",
            duration: "6 mins",
            completed: false,
            quizQuestions: [
              {
                q: "What vulnerability allows an attacker to manipulate parameters like /api/user/1024 to view another user's private data?",
                options: ["Insecure Direct Object Reference (IDOR)", "Cross-Site Scripting (XSS)", "Clickjacking", "SQL Injection"],
                answer: 0,
              },
              {
                q: "What is the standard AWS cloud metadata IP address often targeted in SSRF attacks?",
                options: ["169.254.169.254", "192.168.1.1", "127.0.0.1", "10.0.0.1"],
                answer: 0,
              },
            ],
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
        title: "Module 1: Penetration Testing Methodologies & Recon",
        lessons: [
          {
            id: "pentest-methodology-video",
            title: "Ethical Hacking Full Course: Penetration Testing Methodologies",
            type: "video",
            duration: "22 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/3FNYvj2U0HM",
            content: "Explore the end-to-end penetration testing lifecycle: Scope definition, passive/active reconnaissance, vulnerability assessment, exploitation, post-exploitation, and professional remediation reporting.",
          },
          {
            id: "metasploit-video",
            title: "Metasploit Hacking Demo & Exploitation Framework",
            type: "video",
            duration: "25 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/bBut8D7usKA",
            content: "Master msfconsole, searching exploits, configuring payloads (Meterpreter), handling multi/handler listeners, and pivoting through network perimeters.",
          },
        ],
      },
      {
        title: "Module 2: Post-Exploitation, PrivEsc & Pivoting",
        lessons: [
          {
            id: "privesc-pivoting-video",
            title: "Linux Privilege Escalation & CTF Machine Exploitation",
            type: "video",
            duration: "28 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/Qg3qOjylZpw",
            content: "Learn how to escalate privileges from low-privilege user to root via sudo vulnerabilities, cronjobs, and capabilities, followed by network pivoting.",
          },
          {
            id: "pentest-reporting-reading",
            title: "Executive vs Technical Pentest Reporting",
            type: "reading",
            duration: "15 mins",
            completed: false,
            content: `A professional pentest report requires:
1. Executive Summary: Risk overview, business impact, CVSS scores.
2. Technical Findings: Step-by-step reproduction steps, proof-of-concept evidence, and concrete remediation code.`,
          },
          {
            id: "pentest-quiz",
            title: "Ethical Hacking Assessment",
            type: "quiz",
            duration: "8 mins",
            completed: false,
            quizQuestions: [
              {
                q: "In Metasploit, what is the primary difference between staged and stageless payloads?",
                options: [
                  "Staged payloads send a tiny payload stub that pulls the larger payload in memory",
                  "Staged payloads do not require network connectivity",
                  "Stageless payloads only work on Linux systems",
                  "Staged payloads cannot use Meterpreter",
                ],
                answer: 0,
              },
              {
                q: "What technique allows an attacker to route traffic through a compromised machine into a secluded internal network?",
                options: ["Pivoting / Port Forwarding", "Fuzzing", "OSINT Scraping", "Hash Dumping"],
                answer: 0,
              },
            ],
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
        title: "Module 1: LLM Threat Models & Prompt Injection",
        lessons: [
          {
            id: "ai-threat-video",
            title: "Generative AI's Greatest Flaw: Prompt Injection Explained",
            type: "video",
            duration: "14 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/rAEqP9VEhe8",
            content: "Understand security challenges in Large Language Model (LLM) applications: Prompt Injection (LLM01), Insecure Output Handling (LLM02), Training Data Poisoning (LLM03), and Model Theft.",
          },
          {
            id: "prompt-injection-demo-video",
            title: "How to Jailbreak AI Models & Prompt Injection Vectors",
            type: "video",
            duration: "18 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/fw16D23TjJI",
            content: "Analyze direct jailbreaks ('Ignore previous instructions and do X') and indirect prompt injections (hidden payloads embedded in external web pages, emails, or PDFs ingested by AI agents).",
          },
        ],
      },
      {
        title: "Module 2: AI Guardrails & Secure Architecture",
        lessons: [
          {
            id: "ai-defense-video",
            title: "What is Retrieval-Augmented Generation (RAG) & Security",
            type: "video",
            duration: "20 mins",
            completed: false,
            videoUrl: "https://www.youtube-nocookie.com/embed/T-D1OfcDW1M",
            content: "Implement defense-in-depth for generative AI: NeMo Guardrails, structured schema enforcement, dual-LLM evaluator patterns, and sanitizing RAG context before query execution.",
          },
          {
            id: "ai-poisoning-reading",
            title: "Training Data Poisoning & Supply Chain Risks",
            type: "reading",
            duration: "15 mins",
            completed: false,
            content: `Backdoors in pre-trained models, malicious HuggingFace model serialization files (pickle RCE), and poisoning fine-tuning datasets represent critical AI supply chain threats.`,
          },
          {
            id: "ai-quiz",
            title: "AI Security Assessment",
            type: "quiz",
            duration: "5 mins",
            completed: false,
            quizQuestions: [
              {
                q: "What is an indirect prompt injection attack?",
                options: [
                  "An attack where the payload is retrieved from external untrusted content (webpage, email, PDF) read by the AI",
                  "An attack targeting the physical server hardware",
                  "A brute-force attack on API keys",
                  "A DDoS attack on the model hosting provider",
                ],
                answer: 0,
              },
              {
                q: "Why is executing raw LLM generated outputs directly in shell commands or database queries dangerous?",
                options: [
                  "Insecure Output Handling can allow prompt injections to escalate into Remote Code Execution or SQLi",
                  "It causes syntax errors in all programming languages",
                  "LLMs cannot generate valid SQL queries",
                  "It violates API terms of service",
                ],
                answer: 0,
              },
            ],
          },
        ],
      },
    ],
  },
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [backendCourseData, setBackendCourseData] = useState<any | null>(null);

  const isSubscribed = isUserSubscribed(user);
  const isLifetimePurchased = backendCourseData?.is_purchased || backendCourseData?.access_type === "lifetime";
  const hasAccess = isSubscribed || isLifetimePurchased || Boolean(backendCourseData?.has_access);

  const courseId = (params?.courseId as string) || "web-security-fundamentals";
  const course = courseData[courseId] || courseData["web-security-fundamentals"];

  // State
  const [activeLesson, setActiveLesson] = useState(course.modules[0].lessons[0]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [completedLessonsSet, setCompletedLessonsSet] = useState<Set<string>>(new Set());
  const [paywallOpen, setPaywallOpen] = useState(false);

  // Fetch progress on load
  useEffect(() => {
    if (!courseId) return;

    // Fetch dynamic course data from backend if available
    api.getCourse(courseId)
      .then((data) => {
        if (data) {
          setBackendCourseData(data);
        }
        if (data && data.lessons && data.lessons.length > 0) {
          // If backend has lessons, map them
          const mappedLessons = data.lessons.map((l: { id: string; title: string; content_type?: string; duration?: number; content?: string }) => ({
            id: l.id,
            title: l.title,
            type: (l.content_type || "reading") as "video" | "reading" | "quiz",
            duration: `${l.duration || 15} mins`,
            completed: false,
            content: l.content || "Lesson content loading...",
            videoUrl: l.content_type === "video" ? l.content : undefined,
          }));

          if (mappedLessons.length > 0) {
            // Keep rich client lessons if available, otherwise use backend
            const clientMatch = course.modules.flatMap(m => m.lessons).find(l => l.id === mappedLessons[0].id);
            if (!clientMatch) {
              setActiveLesson(mappedLessons[0]);
            }
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

    setCompletedLessonsSet(initialSet);

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

  const [quizEvaluation, setQuizEvaluation] = useState<{
    passed: boolean;
    score_pct: number;
    correct_count: number;
    total_questions: number;
    xp_awarded: number;
    results: { question_id: string; correct: boolean; selected_option: number; correct_option: number; explanation: string }[];
  } | null>(null);

  // Lesson click handler
  const handleLessonClick = (lesson: {
    id: string;
    title: string;
    type: "video" | "reading" | "quiz";
    duration: string;
    completed: boolean;
    content?: string;
    videoUrl?: string;
    quizQuestions?: { id?: string; q: string; options: string[]; answer: number; explanation?: string }[];
  }) => {
    setActiveLesson(lesson);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizEvaluation(null);
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
    
    const payloadAnswers = activeLesson.quizQuestions.map((q: any, idx: number) => ({
      question_id: q.id || `q${idx + 1}`,
      selected_option: quizAnswers[idx] ?? -1,
    }));

    api.submitQuiz(activeLesson.id, payloadAnswers)
      .then((res) => {
        setQuizEvaluation(res);
        setQuizScore(res.correct_count);
        setQuizSubmitted(true);
        if (res.passed) {
          const newSet = new Set(completedLessonsSet);
          newSet.add(activeLesson.id);
          setCompletedLessonsSet(newSet);
        }
      })
      .catch((err) => {
        console.warn("Backend quiz evaluation error, doing client fallback evaluation:", err);
        let score = 0;
        activeLesson.quizQuestions?.forEach((q, idx) => {
          if (quizAnswers[idx] === q.answer) {
            score++;
          }
        });
        setQuizScore(score);
        setQuizSubmitted(true);
        if (activeLesson.quizQuestions && score === activeLesson.quizQuestions.length) {
          markLessonComplete(activeLesson.id);
        }
      });
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
              <span className="text-xs text-foreground-muted font-mono">+{course.xp} XP</span>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground-secondary">Course Progress</span>
                <span className="text-primary font-bold">{progressPct}% Complete</span>
              </div>
              <ProgressBar value={progressPct} variant="gradient" size="sm" />
            </div>

            {/* Course Final Certification Exam Link */}
            <Link
              href={`/courses/${courseId}/exam`}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/30 hover:border-primary text-foreground transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    Course Certification Exam
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Proctored test &amp; verifiable credential
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </Link>
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
                    const Icon = !hasAccess ? Lock :
                      lesson.type === "video" ? Play :
                      lesson.type === "quiz" ? HelpCircle : FileText;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (!hasAccess) {
                            setPaywallOpen(true);
                          } else {
                            handleLessonClick(lesson);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-[var(--radius)] text-left transition-all duration-150 cursor-pointer ${
                          isSelected && hasAccess
                            ? "bg-primary/10 border border-primary text-primary"
                            : "bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${
                            isSelected && hasAccess ? "bg-primary/20 text-primary" : "bg-surface-elevated text-foreground-muted"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isSelected && hasAccess ? "text-foreground font-bold" : "text-foreground-secondary"}`}>
                              {lesson.title}
                            </p>
                            <span className="text-[11px] text-foreground-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.duration}
                            </span>
                          </div>
                        </div>
                        {!hasAccess ? (
                          <Badge variant="primary" size="sm" className="text-[9px] px-1.5 py-0">LOCKED</Badge>
                        ) : completedLessonsSet.has(lesson.id) ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                        ) : null}
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
          <Card padding="lg" className="min-h-[550px] flex flex-col justify-between">
            {!hasAccess ? (
              /* GATED PAYWALL VIEW FOR FREE USERS */
              <div className="my-auto py-12 px-4 text-center space-y-6 max-w-lg mx-auto">
                <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 border border-primary/30 text-primary shadow-lg">
                  <Lock className="w-10 h-10 animate-bounce text-primary" />
                </div>

                <div className="space-y-2">
                  <div className="inline-block">
                    <Badge variant="primary" size="sm" className="font-mono uppercase text-[10px] tracking-wider">
                      Access Required
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Course Content Locked</h3>
                  <p className="text-xs md:text-sm text-foreground-secondary leading-relaxed">
                    Full video lectures, interactive reading guides, quizzes, and verifiable completion certificates for <span className="text-foreground font-semibold">&quot;{course.title}&quot;</span> are unlocked via Lifetime Course Access or an All-Access Subscription.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left py-2">
                  <div className="p-3 rounded-xl bg-surface-elevated/80 border border-border flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground-secondary font-medium">All course video modules &amp; notes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-elevated/80 border border-border flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground-secondary font-medium">Unlimited CTF labs &amp; security tools</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-elevated/80 border border-border flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground-secondary font-medium">Full AI Cyber Coach tutoring</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-elevated/80 border border-border flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground-secondary font-medium">Verified course certificates</span>
                  </div>
                </div>

                {/* Purchase Options */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.push(`/checkout?type=course_lifetime&courseId=${courseId}`)}
                    className="w-full sm:w-auto font-bold shadow-lg"
                  >
                    <Award className="w-4 h-4 mr-1.5" />
                    <span>Buy Course Lifetime ($49)</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => router.push("/checkout?type=subscription&plan=pro")}
                    className="w-full sm:w-auto font-bold shadow-lg"
                  >
                    <Zap className="w-4 h-4 mr-1.5" />
                    <span>All-Access Pass ($12/mo)</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* SUBSCRIBED FULL CONTENT VIEW */
              <>
                <div>
                  {/* Active Lesson Header */}
                  <div className="border-b border-border pb-4 mb-6 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        {activeLesson.type === "video" && <Play className="w-3.5 h-3.5 fill-primary" />}
                        {activeLesson.type === "reading" && <FileText className="w-3.5 h-3.5" />}
                        {activeLesson.type === "quiz" && <HelpCircle className="w-3.5 h-3.5" />}
                        {activeLesson.type} Lesson
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                        {activeLesson.title}
                      </h2>
                    </div>
                    <Link
                      href="/ai-coach"
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-semibold transition-colors px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
                    >
                      <Bot className="w-4 h-4 text-primary" />
                      Ask AI Coach
                    </Link>
                  </div>

                  {/* Embedded YouTube Video Player */}
                  {activeLesson.type === "video" && (
                    <div className="mb-6 rounded-2xl overflow-hidden bg-black border border-border aspect-video shadow-2xl relative">
                      <iframe
                        src={getYouTubeEmbedUrl(activeLesson.videoUrl || activeLesson.content) || "https://www.youtube-nocookie.com/embed/7GBlCinu9yg"}
                        title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  )}

                  {/* Reading / Video Description Content */}
                  <div className="prose prose-invert max-w-none text-foreground-secondary text-sm leading-7 space-y-4 font-normal flex-1">
                    {activeLesson.content && (
                      <div className="whitespace-pre-line bg-surface-elevated/40 p-4 rounded-xl border border-border font-sans text-xs sm:text-sm leading-relaxed">
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
                                  optClass = "border-success bg-success/10 text-success font-bold";
                                } else if (isSelected) {
                                  optClass = "border-error bg-error/10 text-error";
                                }
                              } else if (isSelected) {
                                optClass = "border-primary bg-primary/10 text-primary font-semibold";
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

                      {quizSubmitted && quizEvaluation && (
                        <div className={`p-4 rounded-xl border space-y-3 ${
                          quizEvaluation.passed ? "bg-success/10 border-success/30 text-success" : "bg-warning/10 border-warning/30 text-warning"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">
                              {quizEvaluation.passed ? "🎉 Assessment Passed!" : "⚠️ Assessment Failed"} ({quizEvaluation.score_pct}%)
                            </span>
                            {quizEvaluation.xp_awarded > 0 && (
                              <span className="text-xs font-mono font-bold bg-success/20 px-2.5 py-1 rounded-full">
                                +{quizEvaluation.xp_awarded} XP Awarded
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-foreground-secondary">
                            {quizEvaluation.passed
                              ? "Great work! You demonstrated mastery of this module."
                              : "Score at least 80% to pass the assessment and earn lesson completion XP."}
                          </p>
                        </div>
                      )}

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
                              <span className={quizScore === activeLesson.quizQuestions.length ? "text-success font-bold" : "text-warning font-bold"}>
                                {quizScore} / {activeLesson.quizQuestions.length}
                              </span>
                            </p>
                            <Button variant="outline" size="sm" onClick={() => {
                              setQuizAnswers({});
                              setQuizSubmitted(false);
                              setQuizScore(0);
                              setQuizEvaluation(null);
                            }}>
                              Retry Quiz
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Non-quiz Mark Completed Action */}
                {activeLesson.type !== "quiz" && (
                  <div className="mt-8 pt-4 border-t border-border flex justify-end">
                    {completedLessonsSet.has(activeLesson.id) ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                        <CheckCircle className="w-5 h-5 animate-pulse text-emerald-400" />
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
              </>
            )}
          </Card>
        </div>
      </div>

      <SubscriptionPaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title="Unlock Course Modules & Videos"
        resourceName={course.title}
      />
    </div>
  );
}
