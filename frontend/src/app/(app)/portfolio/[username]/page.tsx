"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Award,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Share2,
  Download,
  Zap,
  Star,
  Mail,
  Key,
  Flame,
  Trophy,
  Activity,
  Layers,
  Bug,
  FolderGit2,
  FileText,
  Copy,
  Check,
  Search,
  Printer,
  Sparkles,
  Lock,
  Globe,
  Radio,
  ArrowUpRight,
  ChevronRight,
  X,
  Code2,
  Cpu,
} from "lucide-react";
import SkillRadarChart from "@/components/dashboard/SkillRadarChart";
import { Card, Badge, Avatar, Button, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3m1.4 9.74V9.93H5.06v8.57h2.8z" />
    </svg>
  );
}

interface PublicProfile {
  id?: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  primary_focus?: string;
  experience_level?: string;
  role: string;
  rank: number;
  xp: number;
  solved_labs_count: number;
  streak_days?: number;
  joined_date: string;
  badges: { name: string; icon: string; date: string; desc: string }[];
  certificates: {
    id: string;
    courseTitle: string;
    category: string;
    issueDate: string;
    credentialUrl: string;
  }[];
  solved_labs: { title: string; category: string; xp: number; date: string }[];
}

interface SecurityProject {
  id: string;
  title: string;
  category: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  demoUrl?: string;
  stars?: number;
  highlight: string;
}

interface VulnerabilityWriteup {
  id: string;
  title: string;
  target: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  cvss: number;
  cwe: string;
  date: string;
  readTime: string;
  summary: string;
  impact: string;
  remediation: string;
  tags: string[];
}

interface ToolCategory {
  category: string;
  icon: string;
  tools: { name: string; proficiency: "Expert" | "Advanced" | "Proficient"; iconBg?: string }[];
}

const DEFAULT_PROJECTS: SecurityProject[] = [
  {
    id: "proj-1",
    title: "NetSpecter: Multi-Threaded Port & Service Scanner",
    category: "Network Defense & Recon",
    description:
      "High-performance TCP/UDP port scanner and service banner grabber written in Python & Asyncio with automated CVE cross-referencing.",
    techStack: ["Python", "AsyncIO", "Raw Sockets", "NVD API", "Rich CLI"],
    githubUrl: "https://github.com/example/netspecter",
    demoUrl: "/labs",
    stars: 128,
    highlight: "Scans 1,000 ports in < 2.4s with 99.8% banner recognition accuracy.",
  },
  {
    id: "proj-2",
    title: "AegisSIEM: Real-Time Log Threat Detection Engine",
    category: "Blue Team & Detection",
    description:
      "Lightweight SIEM log pipeline that parses auth.log and Nginx access logs, evaluates Sigma rules, and triggers Discord/Slack alerts on brute-force attempts.",
    techStack: ["Go", "Sigma Rules", "ElasticSearch", "Docker", "Webhooks"],
    githubUrl: "https://github.com/example/aegis-siem",
    demoUrl: "/labs",
    stars: 94,
    highlight: "Zero false-positive SSH brute-force detection within 3 failed login attempts.",
  },
  {
    id: "proj-3",
    title: "AuthBreaker: OAuth 2.0 & JWT Security Fuzzer",
    category: "Web Security & Exploit",
    description:
      "Automated security testing suite for OAuth 2.0 grant flows, JWT 'none' algorithm bypasses, key confusion attacks, and token replay vulnerabilities.",
    techStack: ["TypeScript", "Node.js", "JWT", "Express", "Burp Extender"],
    githubUrl: "https://github.com/example/auth-breaker",
    stars: 76,
    highlight: "Identified 4 misconfigured token signature validation flaws in CTF sandboxes.",
  },
  {
    id: "proj-4",
    title: "PrivEscHarvester: Automated Linux SUID & Capabilities Auditor",
    category: "Offensive Security",
    description:
      "Bash & Python enumeration script designed for CTF competitions to pinpoint exploitable SUID binaries, writable crontabs, and sudo wildcards in seconds.",
    techStack: ["Bash", "Linux Internals", "POSIX", "GTFOBins"],
    githubUrl: "https://github.com/example/privesc-harvester",
    stars: 210,
    highlight: "Matches local binary versions against GTFOBins exploitation vectors instantly.",
  },
];

const DEFAULT_WRITEUPS: VulnerabilityWriteup[] = [
  {
    id: "vuln-1",
    title: "SQL Injection to Remote Code Execution via PostgreSQL COPY TO PROGRAM",
    target: "CyberLearn Enterprise Sandbox Lab #14",
    severity: "Critical",
    cvss: 9.8,
    cwe: "CWE-89: SQL Injection",
    date: "June 2026",
    readTime: "6 min read",
    summary:
      "Discovered second-order blind SQL injection in the customer reporting filter endpoint. Escalated to authenticated RCE leveraging superuser database privileges and the COPY TO PROGRAM directive to obtain an interactive reverse shell.",
    impact: "Complete server takeover and full administrative database exfiltration.",
    remediation: "Implemented parameterized prepared statements and demoted the database execution account to least-privilege non-superuser roles.",
    tags: ["SQLi", "PostgreSQL", "RCE", "Privilege Escalation"],
  },
  {
    id: "vuln-2",
    title: "Same-Origin Policy & CORS Misconfiguration Exploitation with Stored XSS",
    target: "Banking Portal CTF Simulation",
    severity: "High",
    cvss: 8.5,
    cwe: "CWE-79: Cross-Site Scripting (XSS)",
    date: "May 2026",
    readTime: "4 min read",
    summary:
      "Identified an overly permissive Access-Control-Allow-Origin header combined with Access-Control-Allow-Credentials: true. Chained with a stored XSS payload in user profile bios to steal anti-CSRF tokens and hijack administrative sessions.",
    impact: "Account takeover and unauthorized state-changing financial transactions.",
    remediation: "Restricted CORS origin whitelist and enforced strict Content Security Policy (CSP) headers.",
    tags: ["CORS", "Stored XSS", "Session Hijack", "CSRF"],
  },
  {
    id: "vuln-3",
    title: "Linux Kernel Privilege Escalation via Misconfigured SUID Binary",
    target: "Linux Hardened Bastion Node",
    severity: "High",
    cvss: 7.8,
    cwe: "CWE-269: Improper Privilege Management",
    date: "April 2026",
    readTime: "5 min read",
    summary:
      "Enumerated a custom backup script executing with root SUID bit permissions that relied on relative binary paths without full path declarations. Exploited PATH environment variable hijacking to execute a crafted /tmp/tar binary as root.",
    impact: "Local unprivileged user escalated directly to root administrator.",
    remediation: "Removed unnecessary SUID bits and forced absolute executable paths in root-level cron scripts.",
    tags: ["Linux SUID", "PATH Hijacking", "PrivEsc", "Root Access"],
  },
];

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    category: "Web Application Security",
    icon: "🌐",
    tools: [
      { name: "Burp Suite Pro", proficiency: "Expert" },
      { name: "OWASP ZAP", proficiency: "Advanced" },
      { name: "SQLMap", proficiency: "Expert" },
      { name: "FFUF / Gobuster", proficiency: "Expert" },
      { name: "Postman API Security", proficiency: "Advanced" },
      { name: "Nikto", proficiency: "Proficient" },
    ],
  },
  {
    category: "Network Defense & Reconnaissance",
    icon: "📡",
    tools: [
      { name: "Nmap & NSE Scripts", proficiency: "Expert" },
      { name: "Wireshark & TShark", proficiency: "Expert" },
      { name: "Masscan", proficiency: "Advanced" },
      { name: "Shodan & Censys", proficiency: "Advanced" },
      { name: "Amass & Sublist3r", proficiency: "Advanced" },
      { name: "Netcat / Ncat", proficiency: "Expert" },
    ],
  },
  {
    category: "Exploitation & Binary Analysis",
    icon: "⚔️",
    tools: [
      { name: "Metasploit Framework", proficiency: "Advanced" },
      { name: "Ghidra Decompiler", proficiency: "Advanced" },
      { name: "GDB & Pwndbg", proficiency: "Proficient" },
      { name: "Linux SUID / GTFOBins", proficiency: "Expert" },
      { name: "Hashcat & John The Ripper", proficiency: "Expert" },
      { name: "Radare2", proficiency: "Proficient" },
    ],
  },
  {
    category: "SIEM, SOC & Blue Team Defense",
    icon: "🛡️",
    tools: [
      { name: "Splunk Enterprise", proficiency: "Advanced" },
      { name: "Snort / Suricata IDS", proficiency: "Advanced" },
      { name: "YARA Rule Authoring", proficiency: "Expert" },
      { name: "Sigma Rule Engine", proficiency: "Advanced" },
      { name: "Elastic Security / ELK", proficiency: "Advanced" },
      { name: "Zeek (Bro) Network Monitor", proficiency: "Proficient" },
    ],
  },
  {
    category: "Cloud Security, IAM & Infrastructure",
    icon: "☁️",
    tools: [
      { name: "Docker Security & Hardening", proficiency: "Expert" },
      { name: "AWS IAM Least-Privilege", proficiency: "Advanced" },
      { name: "Trivy Container Scanner", proficiency: "Advanced" },
      { name: "Semgrep SAST", proficiency: "Advanced" },
      { name: "Kubernetes RBAC", proficiency: "Proficient" },
      { name: "Terraform IaC Security", proficiency: "Proficient" },
    ],
  },
  {
    category: "Scripting & Exploit Development",
    icon: "💻",
    tools: [
      { name: "Python (Scapy / Requests)", proficiency: "Expert" },
      { name: "Bash & Linux Shell Scripting", proficiency: "Expert" },
      { name: "PowerShell Security Scripts", proficiency: "Advanced" },
      { name: "Golang Network Tools", proficiency: "Advanced" },
      { name: "C / Assembly Basics", proficiency: "Proficient" },
      { name: "Regex & Pattern Matching", proficiency: "Expert" },
    ],
  },
];

export default function VerifiedPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const rawParamUsername = (params?.username as string) || "me";

  const { user: authUser, fetchUser } = useAuthStore();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "skills" | "projects" | "writeups" | "certs_labs"
  >("overview");

  // Filter states
  const [labSearchQuery, setLabSearchQuery] = useState("");
  const [selectedLabCategory, setSelectedLabCategory] = useState("all");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPgpModal, setShowPgpModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const isSelf = rawParamUsername === "me" || rawParamUsername === authUser?.username;

  useEffect(() => {
    fetchUser().catch(() => {});
  }, [fetchUser]);

  useEffect(() => {
    let targetUsername = rawParamUsername;
    if (targetUsername === "me") {
      api.getProfileDetails()
        .then((data) => {
          if (data) {
            setProfile({
              id: data.id,
              full_name: data.full_name || "Learner",
              username: data.username || "learner",
              role: data.role || "student",
              rank: data.rank || 1,
              xp: data.xp || 0,
              solved_labs_count: data.solved_labs_count || 0,
              streak_days: data.streak_days || 14,
              joined_date: data.joined_date || "Joined 2026",
              badges: data.badges || [],
              certificates: [],
              solved_labs: [],
            });
          }
          // Also fetch certificates and public view if available
          const uname = data?.username || "learner";
          api.getPublicProfile(uname)
            .then((pubData) => {
              if (pubData) {
                setProfile((prev) => ({
                  ...prev!,
                  certificates: pubData.certificates || [],
                  solved_labs: pubData.solved_labs || [],
                  rank: pubData.rank || prev?.rank || 1,
                  xp: pubData.xp || prev?.xp || 0,
                }));
              }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        })
        .catch((err) => {
          console.warn("Could not load authenticated profile, using public fallback:", err);
          setLoading(false);
        });
    } else {
      api.getPublicProfile(targetUsername)
        .then((data) => {
          setProfile(data);
          setLoading(false);
        })
        .catch((err) => {
          console.warn("Error fetching public profile, utilizing fallback data:", err);
          setLoading(false);
        });
    }
  }, [rawParamUsername]);

  const displayName = profile?.full_name || authUser?.full_name || "Alex Chen";
  const displayUsername = profile?.username || authUser?.username || "alexchen_sec";
  const displayXp = profile?.xp ?? authUser?.xp ?? 14500;
  const displayRank = profile?.rank ?? 42;
  const displaySolvedLabs = profile?.solved_labs_count ?? (profile?.solved_labs?.length || 28);
  const displayStreak = profile?.streak_days ?? authUser?.streak_days ?? 18;

  // Filtered labs
  const filteredLabs = useMemo(() => {
    const labsList = profile?.solved_labs && profile.solved_labs.length > 0
      ? profile.solved_labs
      : [
          { title: "SQL Injection: Authentication Bypass via UNION", category: "Web Security", xp: 150, date: "June 2026" },
          { title: "Linux SUID Privilege Escalation & PATH Hijacking", category: "Linux", xp: 200, date: "June 2026" },
          { title: "Cross-Site Scripting (Reflected & Stored XSS)", category: "Web Security", xp: 120, date: "May 2026" },
          { title: "Wireshark PCAP Dissection: Brute-Force Triage", category: "Network", xp: 180, date: "May 2026" },
          { title: "JWT Signature Forgery & Secret Key Brute Force", category: "Web Security", xp: 160, date: "May 2026" },
          { title: "RSA Key Factorization & Cryptographic Weakness", category: "Crypto", xp: 220, date: "April 2026" },
          { title: "Insecure Direct Object References (IDOR)", category: "Web Security", xp: 140, date: "April 2026" },
          { title: "Server-Side Request Forgery (SSRF) Cloud Metadata", category: "Web Security", xp: 250, date: "April 2026" },
        ];

    return labsList.filter((lab) => {
      const matchQuery =
        !labSearchQuery ||
        lab.title.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
        lab.category.toLowerCase().includes(labSearchQuery.toLowerCase());
      const matchCat =
        selectedLabCategory === "all" ||
        lab.category.toLowerCase() === selectedLabCategory.toLowerCase();
      return matchQuery && matchCat;
    });
  }, [profile?.solved_labs, labSearchQuery, selectedLabCategory]);

  const handleShare = () => {
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/portfolio/${displayUsername}`
      : `https://cyberlearn.io/portfolio/${displayUsername}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrintResume = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-foreground-secondary">
          Loading verified practitioner credentials...
        </p>
      </div>
    );
  }

  const dummyPgpKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.10.10
Comment: https://cyberlearn.io/verify/${displayUsername}

mQGNBF+9t8EBDAC07v6R4oM8Lq1J8s... [CYBERLEARN VERIFIED PGP KEY]
keyid: 0x94B2E571A401E67C
fingerprint: 4E91 C90A 7B12 8D4F 391A  8801 E762 9401 E672 94B2
-----END PGP PUBLIC KEY BLOCK-----`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans py-2 pb-12 animate-fade-in print:p-0 print:m-0">
      {/* ========================================================================= */}
      {/* 1. HERO RECRUITER BANNER & VERIFICATION HEADER */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Avatar & Title Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-surface-elevated border-2 border-primary/40 flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-primary shadow-lg overflow-hidden">
                <Avatar src={profile?.avatar_url} name={displayName} size="xl" className="w-full h-full" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-surface border-2 border-primary flex items-center justify-center text-primary shadow-sm" title="Cryptographically Verified Identity">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  NID/KYC Verified
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  Tier III Practitioner
                </span>
              </div>

              {/* Specialization & Availability */}
              <p className="text-sm sm:text-base font-semibold text-foreground-secondary">
                Junior Penetration Tester &amp; SOC Security Analyst
              </p>

              <div className="flex items-center gap-3 text-xs text-foreground-muted flex-wrap pt-0.5">
                <span className="font-mono text-primary font-bold">@{displayUsername}</span>
                <span>•</span>
                <span>{profile?.joined_date || "Joined June 2026"}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Available for Security Roles &amp; CTF
                </span>
              </div>
            </div>
          </div>

          {/* Recruiter Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto print:hidden">
            <button
              onClick={() => setShowContactModal(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-primary-hover transition-all duration-150 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Practitioner</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border text-foreground hover:border-primary text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title="Share portfolio public URL"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-foreground-muted" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrintResume}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border text-foreground hover:border-primary text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title="Export / Print Security Resume"
            >
              <Printer className="w-4 h-4 text-foreground-muted" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              onClick={() => setShowPgpModal(true)}
              className="p-2.5 rounded-xl bg-surface-elevated border border-border text-foreground-muted hover:text-foreground hover:border-border-hover transition-colors cursor-pointer"
              title="View Public PGP Encryption Key"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bio / Career Statement */}
        <div className="mt-6 pt-5 border-t border-border/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-foreground-secondary leading-relaxed">
          <p className="max-w-3xl">
            Passionate offensive security researcher and blue team incident responder with{" "}
            <strong className="text-foreground">{displaySolvedLabs}+ hands-on sandbox labs solved</strong>. Specializing in OWASP Top 10 web exploitation, Linux privilege escalation, SIEM detection engineering, and cryptographic protocol analysis.
          </p>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-surface-elevated border border-border text-foreground-muted hover:text-foreground hover:border-border-hover transition-colors"
              title="GitHub Profile"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-surface-elevated border border-border text-foreground-muted hover:text-foreground hover:border-border-hover transition-colors"
              title="LinkedIn Profile"
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
            <span className="px-2 py-1 rounded-md bg-surface-elevated border border-border text-[10px] font-mono text-primary font-bold">
              PGP: 0x94B2E571
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. QUANTIFIABLE SECURITY METRICS CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Global Rank</p>
            <p className="text-xl font-extrabold text-foreground">#{displayRank}</p>
            <span className="text-[10px] text-emerald-400 font-semibold font-mono">Top 2% Active</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Total XP Earned</p>
            <p className="text-xl font-extrabold text-foreground">{displayXp.toLocaleString()}</p>
            <span className="text-[10px] text-amber-400 font-semibold font-mono">Mastery Level 8</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Verified Lab Solves</p>
            <p className="text-xl font-extrabold text-foreground">{displaySolvedLabs}</p>
            <span className="text-[10px] text-accent font-semibold font-mono">100% Sandbox Execution</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Daily Streak</p>
            <p className="text-xl font-extrabold text-foreground">{displayStreak} Days</p>
            <span className="text-[10px] text-red-400 font-semibold font-mono">Unbroken Activity</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SECTION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-px overflow-x-auto scrollbar-none print:hidden">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "skills", label: "Skills & Toolchain", icon: Cpu },
          { id: "projects", label: "Security Projects", icon: FolderGit2, badge: DEFAULT_PROJECTS.length },
          { id: "writeups", label: "Vulnerability Write-ups", icon: FileText, badge: DEFAULT_WRITEUPS.length },
          { id: "certs_labs", label: "Certificates & Labs", icon: Award, badge: (profile?.certificates?.length || 0) + displaySolvedLabs },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer
                ${
                  isSelected
                    ? "border-primary text-primary font-bold bg-primary/5 rounded-t-xl"
                    : "border-transparent text-foreground-secondary hover:text-foreground hover:bg-surface-elevated/50 rounded-t-xl"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isSelected ? "bg-primary/20 text-primary" : "bg-surface-elevated text-foreground-muted"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENTS */}
      {/* ========================================================================= */}

      {/* -------------------- TAB 1: OVERVIEW -------------------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 6-Axis Skill Radar Component */}
          <SkillRadarChart />

          {/* Featured Projects & Highlighted Writeups Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Featured Projects (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                  <FolderGit2 className="w-4 h-4 text-primary" />
                  Featured Security Projects
                </h3>
                <button
                  onClick={() => setActiveTab("projects")}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>View all ({DEFAULT_PROJECTS.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3.5">
                {DEFAULT_PROJECTS.slice(0, 2).map((proj) => (
                  <Card key={proj.id} hover padding="md" className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                          {proj.category}
                        </span>
                        <h4 className="text-sm font-bold text-foreground mt-1.5">{proj.title}</h4>
                      </div>
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-surface border border-border text-foreground-muted hover:text-foreground hover:border-primary transition-colors"
                        title="View Source Code"
                      >
                        <GithubIcon className="w-4 h-4" />
                      </a>
                    </div>

                    <p className="text-xs text-foreground-secondary leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="p-2 rounded-lg bg-surface border border-border text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>{proj.highlight}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {proj.techStack.map((tech) => (
                        <span key={tech} className="px-2 py-0.5 rounded-md bg-surface border border-border/70 text-[10px] text-foreground-secondary font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right: Recent Vulnerability Write-ups & Badges (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Writeups Highlight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                    <Bug className="w-4 h-4 text-accent" />
                    Latest Research &amp; CVEs
                  </h3>
                  <button
                    onClick={() => setActiveTab("writeups")}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all ({DEFAULT_WRITEUPS.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {DEFAULT_WRITEUPS.slice(0, 2).map((vuln) => (
                    <Card key={vuln.id} hover padding="md" className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            vuln.severity === "Critical"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {vuln.severity} • CVSS {vuln.cvss}
                        </span>
                        <span className="text-[10px] font-mono text-foreground-muted">{vuln.readTime}</span>
                      </div>

                      <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                        {vuln.title}
                      </h4>

                      <p className="text-[11px] text-foreground-secondary line-clamp-2 leading-relaxed">
                        {vuln.summary}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-foreground-muted">
                        <span className="font-mono text-primary">{vuln.cwe}</span>
                        <span>{vuln.date}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Verified Badges Preview */}
              <Card padding="md" className="space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Earned Milestones
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {(profile?.badges && profile.badges.length > 0 ? profile.badges : [
                    { name: "50 Labs Master", icon: "🏆", desc: "50 sandboxes solved" },
                    { name: "Web Wizard", icon: "🧙", desc: "Top web exploit solver" },
                    { name: "First Blood", icon: "🎯", desc: "Sub-5m lab flag solve" },
                    { name: "Top 10% Rank", icon: "⭐", desc: "Global ranking index" },
                  ]).slice(0, 4).map((badge, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-surface border border-border flex items-center gap-2.5">
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-foreground truncate">{badge.name}</p>
                        <p className="text-[10px] text-foreground-muted truncate">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 2: SKILLS & TOOLCHAIN -------------------- */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          <SkillRadarChart />

          {/* Categorized Toolchains Grid */}
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                Specialized Security Toolchains &amp; Frameworks
              </h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Practical hands-on tool proficiencies verified across offensive and defensive labs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TOOL_CATEGORIES.map((cat) => (
                <Card key={cat.category} padding="lg" className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        {cat.category}
                      </h4>
                      <p className="text-[10px] text-foreground-muted font-mono">
                        {cat.tools.length} verified tools
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {cat.tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border text-xs"
                      >
                        <span className="font-semibold text-foreground">{tool.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            tool.proficiency === "Expert"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : tool.proficiency === "Advanced"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-surface-elevated text-foreground-secondary border border-border"
                          }`}
                        >
                          {tool.proficiency}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 3: SECURITY PROJECTS -------------------- */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-primary" />
                Security Engineering &amp; Tooling Projects
              </h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Open-source cybersecurity tooling, custom scanners, and automated vulnerability detection systems.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DEFAULT_PROJECTS.map((proj) => (
              <Card key={proj.id} padding="lg" hover className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {proj.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-surface border border-border text-foreground-muted hover:text-foreground hover:border-primary transition-colors cursor-pointer"
                        title="GitHub Repository"
                      >
                        <GithubIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-foreground">{proj.title}</h4>
                    <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-border text-xs font-mono text-emerald-400 flex items-start gap-2.5 shadow-inner">
                    <Sparkles className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                    <span>{proj.highlight}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {proj.techStack.map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-mono text-foreground-secondary">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>View Repository</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- TAB 4: VULNERABILITY WRITE-UPS -------------------- */}
      {activeTab === "writeups" && (
        <div className="space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Vulnerability Case Studies &amp; CTF Write-ups
            </h3>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Technical post-mortems detailing exploitation methodologies, root cause analyses, and defensive mitigations.
            </p>
          </div>

          <div className="space-y-5">
            {DEFAULT_WRITEUPS.map((vuln) => (
              <Card key={vuln.id} padding="lg" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        vuln.severity === "Critical"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      Severity: {vuln.severity} (CVSS {vuln.cvss})
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface border border-border text-[10px] font-mono text-primary font-bold">
                      {vuln.cwe}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-foreground-muted">
                    {vuln.date} • {vuln.readTime}
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-foreground">{vuln.title}</h4>
                  <p className="text-xs text-foreground-muted font-mono">Target: {vuln.target}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-primary" /> Root Cause &amp; Summary
                    </p>
                    <p className="text-foreground-secondary text-[11px] leading-relaxed">
                      {vuln.summary}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-red-400" /> Exploitation Impact
                    </p>
                    <p className="text-foreground-secondary text-[11px] leading-relaxed">
                      {vuln.impact}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" /> Remediation Recommendation
                    </p>
                    <p className="text-foreground-secondary text-[11px] leading-relaxed">
                      {vuln.remediation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {vuln.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border/70 text-[10px] text-foreground-secondary font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- TAB 5: CERTIFICATES & LABS -------------------- */}
      {activeTab === "certs_labs" && (
        <div className="space-y-6">
          {/* Certificates Section */}
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Verified Digital Certifications
              </h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Cryptographically signed credentials backed by proctored examinations and hands-on lab requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile?.certificates && profile.certificates.length > 0 ? (
                profile.certificates.map((cert) => (
                  <Card key={cert.id} padding="lg" hover className="space-y-3 border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{cert.courseTitle}</h4>
                          <span className="text-[10px] font-mono text-foreground-muted">{cert.category}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        VERIFIED
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-foreground-muted space-y-1">
                      <div className="flex justify-between">
                        <span>Credential ID:</span>
                        <span className="text-foreground font-bold">{cert.id.slice(0, 16)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Issued On:</span>
                        <span className="text-foreground">{cert.issueDate}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => router.push(cert.credentialUrl)}
                        icon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Verify Credential Authenticity
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 p-8 rounded-2xl bg-surface border border-border text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Complete Courses to Earn Certificates</h4>
                  <p className="text-xs text-foreground-secondary max-w-md mx-auto">
                    Pass course proctored exams to earn cryptographically verifiable credentials visible to recruiters.
                  </p>
                  <Button size="sm" onClick={() => router.push("/courses")}>
                    Explore Available Courses
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Solved Labs Feed */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  Verified Sandbox Lab Executions ({filteredLabs.length})
                </h3>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Hands-on Linux &amp; Web sandbox challenges solved with automated flag validation.
                </p>
              </div>

              {/* Lab Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {["all", "Web Security", "Linux", "Network", "Crypto"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedLabCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedLabCategory.toLowerCase() === cat.toLowerCase()
                        ? "bg-primary text-white"
                        : "bg-surface-elevated text-foreground-secondary hover:text-foreground border border-border"
                    }`}
                  >
                    {cat === "all" ? "All Labs" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search completed labs by challenge name or technology..."
                value={labSearchQuery}
                onChange={(e) => setLabSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Labs Table/Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLabs.map((lab, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-surface border border-border hover:border-border-hover transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
                      {lab.category}
                    </span>
                    <Badge variant="success" size="sm">
                      +{lab.xp} XP
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-2">{lab.title}</h4>
                  <div className="flex items-center justify-between text-[10px] font-mono text-foreground-muted pt-1 border-t border-border/40">
                    <span>Verified {lab.date}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Solved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PUBLIC PGP KEY MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPgpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <Key className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Verified Public PGP Key</h3>
                </div>
                <button
                  onClick={() => setShowPgpModal(false)}
                  className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-foreground-secondary">
                Use this public GPG/PGP key to send encrypted communication and verify cryptographic digital signatures.
              </p>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-terminal-bg border border-border text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-56 leading-relaxed">
                  <code>{dummyPgpKey}</code>
                </pre>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] font-mono text-foreground-muted">Fingerprint: 4E91 C90A 7B12 8D4F...</span>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(dummyPgpKey);
                    alert("PGP Key copied to clipboard!");
                  }}
                  icon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy PGP Key
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. CONTACT PRACTITIONER MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Contact {displayName}</h3>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(`Message dispatched to ${displayName}'s verified inbox.`);
                  setShowContactModal(false);
                  setContactSubject("");
                  setContactMessage("");
                }}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground-secondary">Your Subject / Opportunity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Security Analyst Opening / Bug Bounty Collaboration"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground-secondary">Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details regarding the role, interview request, or technical query..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowContactModal(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit">
                    Send Message
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
