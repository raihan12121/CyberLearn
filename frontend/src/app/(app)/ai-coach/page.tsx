"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Plus,
  MessageSquare,
  ChevronRight,
  Shield,
  Lightbulb,
  Settings2,
  Trash2,
  Edit3,
  Terminal,
  CheckCircle2,
  Sliders,
  Copy,
  Check,
  Search,
  Download,
  RotateCcw,
  ArrowDown,
  Cpu,
  Layers,
  Zap,
  ThumbsUp,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

interface AiSession {
  id: string;
  user_id: string;
  title: string;
  system_prompt?: string;
  model_type: string;
  created_at: string;
  updated_at?: string;
  message_count: number;
}

interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "coach";
  content: string;
  created_at?: string;
}

const PRESET_PERSONAS = [
  {
    id: "soc",
    title: "SOC Analyst & Blue Team",
    category: "Defense",
    icon: "🛡️",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    prompt:
      "You are an expert Security Operations Center (SOC) Level 3 Lead. You guide the learner on log analysis, incident triage, SIEM detection rules, Wireshark packet dissection, and defensive remediation.",
  },
  {
    id: "pentest",
    title: "Web Pentester & Red Team",
    category: "Offensive",
    icon: "⚔️",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    prompt:
      "You are a Senior Ethical Penetration Tester and Bug Bounty Hunter. Teach ethical exploitation techniques, OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, SSRF, IDOR), Burp Suite workflows, and remediation.",
  },
  {
    id: "socratic",
    title: "Socratic CTF Hint Coach",
    category: "CTF & Labs",
    icon: "🎯",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    prompt:
      "You are a Socratic CTF coach. Never give direct flags or direct exploit solutions. Instead, provide subtle hints, ask probing questions, and lead the student to uncover the security flaw themselves.",
  },
  {
    id: "exam",
    title: "Certification Exam Mentor",
    category: "Certifications",
    icon: "📜",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    prompt:
      "You are a strict cybersecurity certification instructor preparing the student for CEH, CompTIA Security+, and CyberLearn Certification Exams. Ask practice questions and explain deep technical nuances.",
  },
  {
    id: "malware",
    title: "Malware & Reverse Eng",
    category: "Binary",
    icon: "🔬",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    prompt:
      "You are a Malware Analysis & Reverse Engineering Specialist. Explain PE headers, assembly instructions (x86/x64), Ghidra/IDA workflows, sandbox detonation, and YARA rule authoring.",
  },
  {
    id: "cloud",
    title: "Cloud & IAM Security",
    category: "Infrastructure",
    icon: "☁️",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    prompt:
      "You are a Cloud Security Architect specializing in AWS, Azure, and GCP security postures, IAM least privilege, S3 bucket hardening, container security, and CI/CD pipeline auditing.",
  },
];

const SUGGESTION_CHIPS = [
  { icon: "🌐", label: "Same-Origin Policy in Depth", prompt: "Explain Same-Origin Policy and CORS with clear visual examples." },
  { icon: "💉", label: "Reflected XSS Filter Bypass", prompt: "How can I test and bypass basic WAF filters for Reflected XSS?" },
  { icon: "🔑", label: "Linux PrivEsc via SUID", prompt: "What are the most common SUID binaries for Linux privilege escalation and how do I exploit them?" },
  { icon: "📡", label: "Nmap Scanning Cheat Sheet", prompt: "Give me an essential Nmap port scanning cheat sheet for CTF reconnaissance." },
  { icon: "🛡️", label: "SQL Injection Defense", prompt: "Show me vulnerable vs parameterized SQL query implementations in Python/Node.js." },
];

/**
 * Enhanced Message Formatter with Syntax Highlighted Code Blocks & Copy Button
 */
function FormattedMessage({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse code blocks with ```lang ... ```
  const parts = useMemo(() => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const elements: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        elements.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }
      elements.push({
        type: "code",
        lang: match[1] || "bash",
        content: match[2].trimEnd(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      elements.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    return elements;
  }, [content]);

  return (
    <div className="space-y-3 text-xs leading-relaxed text-foreground/90">
      {parts.map((part, idx) => {
        if (part.type === "code") {
          return (
            <div
              key={idx}
              className="my-2 rounded-xl overflow-hidden border border-border/80 bg-[#0B0D13] shadow-md"
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-secondary/20 border-b border-border/60 text-[11px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5 font-semibold text-primary">
                  <Terminal className="h-3 w-3" />
                  {part.lang || "terminal"}
                </span>
                <button
                  onClick={() => copyCode(part.content, idx)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors px-2 py-0.5 rounded bg-background/40 hover:bg-background/80"
                  title="Copy code"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 font-sans">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span className="font-sans">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-[11.5px] font-mono leading-normal text-emerald-300 selection:bg-emerald-900/50">
                <code>{part.content}</code>
              </pre>
            </div>
          );
        }

        // Standard text formatting (headings, lists, bold, inline code)
        const lines = part.content.split("\n");
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              if (!line.trim()) return <div key={lineIdx} className="h-1.5" />;

              // Headings
              if (line.startsWith("### ")) {
                return (
                  <h4 key={lineIdx} className="font-bold text-sm text-foreground pt-1.5 pb-0.5 text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {line.replace("### ", "")}
                  </h4>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h3 key={lineIdx} className="font-extrabold text-sm text-foreground pt-2 pb-1 border-b border-border/40">
                    {line.replace("## ", "")}
                  </h3>
                );
              }

              // Bullet points
              const isBullet = line.trim().startsWith("• ") || line.trim().startsWith("- ") || line.trim().startsWith("* ");
              const isNumbered = /^\d+\.\s/.test(line.trim());

              // Inline bold/code parser
              const formatInline = (text: string) => {
                // Split by bold (**...**) and inline code (`...`)
                const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
                return tokens.map((token, tIdx) => {
                  if (token.startsWith("**") && token.endsWith("**")) {
                    return (
                      <strong key={tIdx} className="font-bold text-foreground">
                        {token.slice(2, -2)}
                      </strong>
                    );
                  }
                  if (token.startsWith("`") && token.endsWith("`")) {
                    return (
                      <code
                        key={tIdx}
                        className="px-1.5 py-0.5 rounded bg-surface-bright/70 font-mono text-[11px] text-emerald-400 border border-border/60"
                      >
                        {token.slice(1, -1)}
                      </code>
                    );
                  }
                  return token;
                });
              };

              if (isBullet) {
                const cleanText = line.trim().replace(/^[-*•]\s+/, "");
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1.5">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <div className="flex-1">{formatInline(cleanText)}</div>
                  </div>
                );
              }

              if (isNumbered) {
                const numberMatch = line.trim().match(/^(\d+\.)\s+(.*)/);
                if (numberMatch) {
                  return (
                    <div key={lineIdx} className="flex items-start gap-2 pl-1.5">
                      <span className="text-primary font-bold text-[11px] mt-0.5">{numberMatch[1]}</span>
                      <div className="flex-1">{formatInline(numberMatch[2])}</div>
                    </div>
                  );
                }
              }

              return <p key={lineIdx}>{formatInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function AICoachPage() {
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [activeSession, setActiveSession] = useState<AiSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Modal States
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditPromptModal, setShowEditPromptModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalPrompt, setModalPrompt] = useState("");
  const [savingSession, setSavingSession] = useState(false);

  // Quick Persona Active Filter
  const [selectedPersonaTab, setSelectedPersonaTab] = useState<string>("all");

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Select and load specific session
  const selectSession = async (session: AiSession) => {
    setActiveSession(session);
    try {
      setLoading(true);
      const res = await api.getAiSessionDetails(session.id);
      if (res && res.messages && res.messages.length > 0) {
        setMessages(
          res.messages.map((m: any) => ({
            id: m.id,
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
            created_at: m.created_at,
          }))
        );
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Load Sessions on Mount
  const loadSessions = async () => {
    const defaultFallback: AiSession = {
      id: "guest-session",
      user_id: "guest",
      title: "General Cybersecurity Tutoring",
      system_prompt: "You are Coach Jarvis, an expert and patient cybersecurity mentor specializing in practical hands-on labs and exam preparation.",
      model_type: "gemini-3.5-flash-lite",
      created_at: new Date().toISOString(),
      message_count: 0,
    };

    try {
      setSessionsLoading(true);
      const res = await api.getAiSessions();
      if (res && res.length > 0) {
        setSessions(res);
        selectSession(res[0]);
      } else {
        setSessions([defaultFallback]);
        setActiveSession(defaultFallback);
      }
    } catch (err) {
      console.error("Error fetching AI sessions:", err);
      setSessions([defaultFallback]);
      setActiveSession(defaultFallback);
    } finally {
      setSessionsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Handle scroll detection for "Scroll to bottom" button
  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 120);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll on message updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle Send Chat
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessageContent = textToSend.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Ensure an active session is always assigned
    let currentSession = activeSession;
    if (!currentSession) {
      currentSession = {
        id: "guest-session",
        user_id: "guest",
        title: "General Cybersecurity Tutoring",
        system_prompt: "You are Coach Jarvis, an expert and patient cybersecurity mentor specializing in practical hands-on labs and exam preparation.",
        model_type: "gemini-3.5-flash-lite",
        created_at: new Date().toISOString(),
        message_count: 0,
      };
      setSessions([currentSession]);
      setActiveSession(currentSession);
    }

    // Optimistically append user message
    const newMsg: ChatMessage = {
      role: "user",
      content: userMessageContent,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      let replyText = "";
      try {
        const res = await api.chatInAiSession(currentSession.id, userMessageContent);
        replyText = res?.reply;
      } catch (sessionErr) {
        console.warn("Session chat failed, attempting legacy chat fallback:", sessionErr);
        const fallbackRes = await api.chatWithCoach(userMessageContent);
        replyText = fallbackRes?.reply;
      }

      const botMsg: ChatMessage = {
        role: "assistant",
        content: replyText || "Hello! How can I assist you with your cybersecurity training today?",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("All AI endpoints failed:", err);
      const errMsg: ChatMessage = {
        role: "assistant",
        content: `Error: ${err.message || "Failed to communicate with AI Coach. Please try again."}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Create New Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    try {
      setSavingSession(true);
      const res = await api.createAiSession({
        title: modalTitle.trim(),
        system_prompt: modalPrompt.trim() || undefined,
      });

      setShowNewModal(false);
      setModalTitle("");
      setModalPrompt("");
      setSessions((prev) => [res, ...prev]);
      selectSession(res);
    } catch (err) {
      console.error("Error creating AI session:", err);
    } finally {
      setSavingSession(false);
    }
  };

  // Quick Switch Persona directly into active session
  const handleApplyPersona = async (persona: typeof PRESET_PERSONAS[0]) => {
    if (!activeSession) return;
    try {
      setLoading(true);
      const res = await api.updateAiSession(activeSession.id, {
        title: `${persona.title.split("&")[0].trim()}`,
        system_prompt: persona.prompt,
      });
      setActiveSession(res);
      setSessions((prev) =>
        prev.map((s) => (s.id === res.id ? { ...s, title: res.title, system_prompt: res.system_prompt } : s))
      );
      // Add subtle confirmation message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `🔄 **Persona Switched**: Coach Jarvis has re-calibrated as **${persona.title}**.\n\n*Instructions loaded:* "${persona.prompt}"\n\nHow can I guide you in this domain?`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Error updating persona:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update System Prompt
  const handleUpdatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    try {
      setSavingSession(true);
      const res = await api.updateAiSession(activeSession.id, {
        title: activeSession.title,
        system_prompt: modalPrompt.trim() || undefined,
      });
      setActiveSession(res);
      setSessions((prev) =>
        prev.map((s) => (s.id === res.id ? { ...s, system_prompt: res.system_prompt } : s))
      );
      setShowEditPromptModal(false);
    } catch (err) {
      console.error("Error updating system prompt:", err);
    } finally {
      setSavingSession(false);
    }
  };

  // Delete Session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this AI session?")) return;

    try {
      await api.deleteAiSession(sessionId);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      if (activeSession?.id === sessionId) {
        if (updated.length > 0) {
          selectSession(updated[0]);
        } else {
          setActiveSession(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Clear current session messages
  const handleClearMessages = () => {
    if (confirm("Clear messages in this conversation?")) {
      setMessages([]);
    }
  };

  // Export Transcript
  const handleExportTranscript = () => {
    if (messages.length === 0) return;
    const lines = messages.map(
      (m) => `[${m.role === "user" ? "USER" : "COACH JARVIS"}] (${m.created_at || ""}):\n${m.content}\n`
    );
    const transcript = `# CyberLearn AI Coach Transcript\nSession: ${activeSession?.title || "AI Session"}\nDate: ${new Date().toLocaleString()}\n\n---\n\n${lines.join("\n")}`;
    const blob = new Blob([transcript], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyberlearn-session-${activeSession?.id || "chat"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyFullMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const openEditPrompt = () => {
    if (!activeSession) return;
    setModalPrompt(activeSession.system_prompt || "");
    setShowEditPromptModal(true);
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        (s.title || "").toLowerCase().includes(q) ||
        (s.system_prompt && s.system_prompt.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8 animate-fade-in">
      {/* Top Banner Header */}
      <div className="rounded-2xl bg-surface-elevated/70 border border-border/80 p-5 sm:p-6 backdrop-blur-md shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                <Bot className="h-3.5 w-3.5 text-primary" />
                AI Cyber Coach v3.5
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 3.5 Flash Active
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-bright text-muted-foreground text-[11px]">
                <Cpu className="h-3 w-3" />
                Isolated Context Memory
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Cybersecurity AI Mentor &amp; Drills
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Get personalized step-by-step guidance on web exploitation, Linux privilege escalation, network triage, and certification exams with zero flag spoilers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={() => {
                setModalTitle("");
                setModalPrompt("");
                setShowNewModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-md hover:bg-primary-hover transition-all duration-150 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Quick Persona Switches */}
        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Quick Persona Switcher:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPersona(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeSession?.system_prompt === p.prompt
                    ? "bg-primary/20 border-primary text-foreground shadow-sm"
                    : "bg-surface-bright/60 hover:bg-surface-bright text-muted-foreground hover:text-foreground border-border/80"
                }`}
                title={`Switch to ${p.title}`}
              >
                <span>{p.icon}</span>
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar (Sessions) + Chat Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[660px]">
        {/* Left Column: Sessions List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-2xl bg-surface-elevated/70 border border-border/80 p-4 sm:p-5 flex-1 flex flex-col justify-between shadow-lg backdrop-blur-sm">
            <div className="space-y-3.5">
              {/* Header & Session Counter */}
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Sessions ({sessions.length})
                  </span>
                </div>
                <button
                  onClick={() => {
                    setModalTitle("");
                    setModalPrompt("");
                    setShowNewModal(true);
                  }}
                  className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Create
                </button>
              </div>

              {/* Search Sessions Bar */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface-bright/80 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>

              {/* Sessions List */}
              <div className="space-y-1.5 overflow-y-auto max-h-[420px] pr-1">
                {sessionsLoading ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading saved sessions...</span>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    {searchQuery ? "No matching sessions found." : "No sessions yet."}
                  </div>
                ) : (
                  filteredSessions.map((sess) => {
                    const isActive = activeSession?.id === sess.id;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => selectSession(sess)}
                        className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 border ${
                          isActive
                            ? "bg-primary/10 border-primary/40 text-foreground shadow-sm"
                            : "hover:bg-surface-bright/70 text-muted-foreground hover:text-foreground border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isActive
                                ? "bg-primary text-primary-foreground font-bold"
                                : "bg-surface-bright text-muted-foreground group-hover:text-primary"
                            }`}
                          >
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                          <div className="overflow-hidden flex-1">
                            <div className="text-xs font-semibold truncate text-foreground">
                              {sess.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {sess.system_prompt ? sess.system_prompt : "Default Cyber Mentor"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 p-1 rounded-lg hover:bg-surface-bright transition-all"
                            title="Delete Session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Model & Security Info Card */}
            <div className="pt-3 border-t border-border/60 space-y-2">
              <div className="p-3 rounded-xl bg-surface-bright/50 border border-border/60 flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-foreground block">Session-Isolated Context</span>
                  <span className="text-muted-foreground">
                    Prompts and conversation history stay strictly contained within this session.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Console (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="rounded-2xl bg-surface-elevated/70 border border-border/80 flex-1 flex flex-col justify-between overflow-hidden shadow-xl backdrop-blur-sm h-full min-h-[600px] relative">
            {/* Console Header with Actions */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-surface-elevated/90 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>{activeSession?.title || "Coach Jarvis"}</span>
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online • Ready
                    </span>
                    {activeSession?.system_prompt && (
                      <span className="truncate max-w-[220px] text-primary/80 font-mono hidden sm:inline">
                        • {activeSession.system_prompt}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportTranscript}
                  disabled={messages.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-bright hover:bg-surface-bright/80 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                  title="Export Transcript (.md)"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={handleClearMessages}
                  disabled={messages.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-bright hover:bg-surface-bright/80 text-xs font-semibold text-muted-foreground hover:text-red-400 disabled:opacity-40 transition-all"
                  title="Clear Chat"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <button
                  onClick={openEditPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary border border-primary/20 transition-all"
                  title="Configure System Prompt"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Prompt Settings</span>
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[460px] scroll-smooth"
            >
              {messages.length === 0 ? (
                <div className="py-10 text-center space-y-4 animate-fade-in max-w-lg mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-md">
                    <Bot className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-base text-foreground">
                      {activeSession?.title || "Coach Jarvis Active"}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {activeSession?.system_prompt
                        ? `Configured persona: "${activeSession.system_prompt}"`
                        : "Ask any cybersecurity question, explore lab hints, or practice for certification exams."}
                    </p>
                  </div>

                  {/* Starter Quick Actions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                    {SUGGESTION_CHIPS.slice(0, 4).map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(chip.prompt)}
                        className="p-3 rounded-xl bg-surface-bright/70 hover:bg-surface-bright border border-border/80 hover:border-primary/40 text-xs text-foreground transition-all duration-150 flex items-start gap-2.5 shadow-sm group text-left"
                      >
                        <span className="text-base shrink-0">{chip.icon}</span>
                        <div className="space-y-0.5 overflow-hidden">
                          <div className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {chip.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {chip.prompt}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isAssistant = msg.role === "assistant" || msg.role === "coach";
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 max-w-[92%] sm:max-w-[85%] animate-fade-in group ${
                        isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                          isAssistant
                            ? "bg-primary/15 border border-primary/30 text-primary"
                            : "bg-surface-bright border border-border text-foreground font-bold"
                        }`}
                      >
                        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>

                      <div className="space-y-1 overflow-hidden flex-1">
                        <div
                          className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isAssistant
                              ? "bg-surface-bright/80 border border-border/90 text-foreground"
                              : "bg-primary text-primary-foreground font-medium rounded-tr-sm"
                          }`}
                        >
                          {isAssistant ? (
                            <FormattedMessage content={msg.content} />
                          ) : (
                            <p className="whitespace-pre-line text-xs">{msg.content}</p>
                          )}
                        </div>

                        {/* Assistant Message Actions Toolbar */}
                        {isAssistant && (
                          <div className="flex items-center gap-2 pt-1 pl-1 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted-foreground">
                            <button
                              onClick={() => copyFullMessage(msg.content, i)}
                              className="flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded hover:bg-surface-bright"
                              title="Copy response"
                            >
                              {copiedMessageIndex === i ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <span className="text-border">•</span>
                            <span className="text-[10px] text-muted-foreground">Jarvis</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Thinking State Indicator */}
              {loading && (
                <div className="flex items-center gap-3 mr-auto max-w-[85%] animate-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  </div>
                  <div className="bg-surface-bright/80 border border-border/90 px-4 py-3 rounded-2xl text-xs text-muted-foreground flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span>Coach Jarvis is analyzing cybersecurity vectors &amp; formulating advice...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Floating Scroll to Bottom Button */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-28 right-6 p-2 rounded-full bg-surface-bright border border-border text-foreground shadow-lg hover:border-primary transition-all active:scale-95 z-20"
                title="Scroll to latest message"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            )}

            {/* Horizontal Suggestion Chips */}
            <div className="px-5 py-2 border-t border-border/60 bg-surface-elevated/40 backdrop-blur-sm">
              <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                {SUGGESTION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip.prompt)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-border/80 bg-surface-bright/60 hover:bg-surface-bright hover:border-primary hover:text-primary transition-all text-muted-foreground whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-border bg-surface-elevated/90 backdrop-blur-md flex items-end gap-2.5">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={`Ask Coach Jarvis (${activeSession?.title || "AI Session"})... (Enter to send, Shift+Enter for new line)`}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  className="w-full bg-surface-bright/90 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 resize-none max-h-32 transition-all"
                />
              </div>

              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary-hover disabled:opacity-40 disabled:hover:bg-primary flex items-center gap-1.5 transition-all duration-150 active:scale-95 shrink-0 h-[38px]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Session Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-surface-elevated border border-border p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Create Custom AI Session
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Configure specialized tutoring persona and instructions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-surface-bright text-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Web Pentesting Drills, CEH Exam Prep..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-bright border border-border text-xs text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>

              {/* Preset Personas Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Choose a Persona Preset:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {PRESET_PERSONAS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        if (!modalTitle) setModalTitle(preset.title);
                        setModalPrompt(preset.prompt);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all space-y-1 ${
                        modalPrompt === preset.prompt
                          ? "bg-primary/15 border-primary text-foreground"
                          : "bg-surface-bright/70 hover:bg-surface-bright border-border/80 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <span>{preset.icon}</span>
                        <span className="truncate">{preset.title}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                        {preset.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom System Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Custom System Instructions</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Guides AI behavior &amp; style
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={modalPrompt}
                  onChange={(e) => setModalPrompt(e.target.value)}
                  placeholder="e.g. You are a strict Red Team instructor. Focus on web exploitation and Linux privesc..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-bright border border-border text-xs text-foreground focus:outline-none focus:border-primary/60 font-mono transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-bright text-foreground text-xs font-semibold hover:bg-surface-bright/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary-hover disabled:opacity-50 transition-all"
                >
                  {savingSession ? "Creating..." : "Start Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit System Prompt Modal */}
      {showEditPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-surface-elevated border border-border p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Configure System Persona
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Customize system instructions for &ldquo;{activeSession?.title}&rdquo;
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditPromptModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-surface-bright text-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePrompt} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  System Instructions (Prompt)
                </label>
                <textarea
                  rows={6}
                  value={modalPrompt}
                  onChange={(e) => setModalPrompt(e.target.value)}
                  placeholder="Set custom persona and instructions for this session..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-bright border border-border text-xs text-foreground focus:outline-none focus:border-primary/60 font-mono transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditPromptModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-bright text-foreground text-xs font-semibold hover:bg-surface-bright/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary-hover disabled:opacity-50 transition-all"
                >
                  {savingSession ? "Saving..." : "Save Prompt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
