"use client";

import React, { useState, useEffect, useRef } from "react";
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
    title: "SOC Analyst & Blue Team Defender",
    icon: "🛡️",
    prompt:
      "You are an expert Security Operations Center (SOC) Level 3 Lead. You guide the learner on log analysis, incident triage, SIEM detection rules, Wireshark packet dissection, and defensive remediation.",
  },
  {
    id: "pentest",
    title: "Offensive Web Pentester & Bug Hunter",
    icon: "⚔️",
    prompt:
      "You are a Senior Ethical Penetration Tester and Bug Bounty Hunter. Teach ethical exploitation techniques, OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, SSRF), Burp Suite workflows, and remediation.",
  },
  {
    id: "socratic",
    title: "Socratic CTF Hint & Logic Coach",
    icon: "🎯",
    prompt:
      "You are a Socratic CTF coach. Never give direct flags or direct exploit solutions. Instead, provide subtle hints, ask probing questions, and lead the student to uncover the security flaw themselves.",
  },
  {
    id: "exam",
    title: "Certification Exam Prep Mentor",
    icon: "📜",
    prompt:
      "You are a strict cybersecurity certification instructor preparing the student for CEH, CompTIA Security+, and CyberLearn Certification Exams. Ask practice questions and explain deep technical nuances.",
  },
];

const suggestionChips = [
  "Explain Same-Origin Policy in simple terms",
  "How can I exploit Reflected XSS filter bypass?",
  "What is the risk of prompt injection in LLM integrations?",
  "Give me tips for escalations via cron privileges",
];

export default function AICoachPage() {
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [activeSession, setActiveSession] = useState<AiSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Modal States
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditPromptModal, setShowEditPromptModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalPrompt, setModalPrompt] = useState("");
  const [savingSession, setSavingSession] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Select and load specific session
  const selectSession = async (session: AiSession) => {
    setActiveSession(session);
    try {
      setLoading(true);
      const res = await api.getAiSessionDetails(session.id);
      if (res && res.messages) {
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
    } finally {
      setLoading(false);
    }
  };

  // Load Sessions on Mount
  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const res = await api.getAiSessions();
      setSessions(res || []);
      if (res && res.length > 0) {
        // Select first session if none active
        selectSession(res[0]);
      }
    } catch (err) {
      console.error("Error fetching AI sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Scroll on message updates
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle Send Chat
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !activeSession) return;

    const userMessageContent = textToSend.trim();
    setInput("");

    // Optimistically append user message
    const newMsg: ChatMessage = {
      role: "user",
      content: userMessageContent,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const res = await api.chatInAiSession(activeSession.id, userMessageContent);
      const botMsg: ChatMessage = {
        role: "assistant",
        content: res.reply || "No response received.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: `Error: ${err.message || "Failed to communicate with AI Coach."}`,
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

  const openEditPrompt = () => {
    if (!activeSession) return;
    setModalPrompt(activeSession.system_prompt || "");
    setShowEditPromptModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-2">
            <Bot className="h-3.5 w-3.5" />
            AI Cyber Coach &amp; Custom Personas
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Multi-Session AI Coach
          </h1>
          <p className="text-sm text-muted-foreground">
            Create custom cybersecurity tutoring sessions with specialized system prompts, personas, and isolated context memories.
          </p>
        </div>

        <button
          onClick={() => {
            setModalTitle("");
            setModalPrompt("");
            setShowNewModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md hover:opacity-90 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New AI Session
        </button>
      </div>

      {/* Main Grid: Sidebar (Sessions) + Chat Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[640px]">
        {/* Left Column: Sessions List (4 cols) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  Your Sessions ({sessions.length})
                </span>
                <button
                  onClick={() => {
                    setModalTitle("");
                    setModalPrompt("");
                    setShowNewModal(true);
                  }}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  + Create
                </button>
              </div>

              {/* Sessions List */}
              <div className="space-y-1.5 overflow-y-auto max-h-[460px] pr-1">
                {sessionsLoading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Loading sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No sessions yet. Click &ldquo;New AI Session&rdquo; to create your first customized tutor.
                  </div>
                ) : (
                  sessions.map((sess) => {
                    const isActive = activeSession?.id === sess.id;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => selectSession(sess)}
                        className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                          isActive
                            ? "bg-primary/10 border border-primary/30 text-foreground"
                            : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                          <Bot
                            className={`h-4 w-4 flex-shrink-0 ${
                              isActive ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                          <div className="overflow-hidden">
                            <div className="text-xs font-semibold truncate">
                              {sess.title}
                            </div>
                            {sess.system_prompt && (
                              <div className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                                {sess.system_prompt}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 p-1 transition-opacity"
                          title="Delete Session"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Security Guard Notice */}
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-foreground block">Session Isolated Prompts</span>
                <span className="text-muted-foreground">
                  Each session remembers its custom system persona and maintains independent conversational memory.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Console (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="rounded-2xl bg-card border border-border flex-1 flex flex-col justify-between overflow-hidden shadow-lg h-full min-h-[580px]">
            {/* Console Header with Prompt Settings */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {activeSession?.title || "Coach Jarvis"}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                    {activeSession?.system_prompt && (
                      <span className="truncate max-w-[240px] text-primary/80 font-mono">
                        • Custom Prompt Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openEditPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-xs font-semibold text-foreground transition-all"
                  title="Configure System Prompt"
                >
                  <Sliders className="h-3.5 w-3.5 text-primary" />
                  Prompt Settings
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[440px]">
              {messages.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">
                    Session Ready: {activeSession?.title}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {activeSession?.system_prompt
                      ? `AI Tutor configured with custom persona: "${activeSession.system_prompt}"`
                      : "Ask any cybersecurity question, explore lab hints, or practice for exams."}
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isAssistant = msg.role === "assistant" || msg.role === "coach";
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 max-w-[90%] sm:max-w-[85%] ${
                        isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                          isAssistant
                            ? "bg-primary/10 border border-primary/20 text-primary"
                            : "bg-accent/20 border border-accent/30 text-accent"
                        }`}
                      >
                        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>

                      <div className="space-y-1">
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                            isAssistant
                              ? "bg-secondary/40 border border-border/80 text-foreground"
                              : "bg-primary text-primary-foreground font-medium"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {loading && (
                <div className="flex items-center gap-3 mr-auto max-w-[80%]">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="bg-secondary/40 border border-border/80 p-3.5 rounded-2xl text-xs text-muted-foreground">
                    Coach Jarvis is thinking &amp; generating advice...
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="px-5 py-2.5 border-t border-border/60 bg-background/50">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-border/80 bg-card hover:border-primary hover:text-primary transition-all text-muted-foreground whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-border bg-card/60 flex items-center gap-3">
              <input
                type="text"
                placeholder={`Ask Coach Jarvis (${activeSession?.title || "AI Session"})...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Create AI Session &amp; Set Prompt
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Web Pentesting Drills, CEH Exam Prep..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Preset Personas Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Quick Persona Presets:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_PERSONAS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        if (!modalTitle) setModalTitle(preset.title);
                        setModalPrompt(preset.prompt);
                      }}
                      className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-left text-xs transition-all space-y-1"
                    >
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>{preset.icon}</span>
                        <span className="truncate">{preset.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom System Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Custom System Instructions (Prompt)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Guides AI behavior &amp; style
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={modalPrompt}
                  onChange={(e) => setModalPrompt(e.target.value)}
                  placeholder="e.g. You are a strict Red Team instructor. Focus on web exploitation and Linux privesc..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:opacity-90 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sliders className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Configure System Prompt
                </h3>
              </div>
              <button
                onClick={() => setShowEditPromptModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePrompt} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  System Prompt for &ldquo;{activeSession?.title}&rdquo;
                </label>
                <textarea
                  rows={5}
                  value={modalPrompt}
                  onChange={(e) => setModalPrompt(e.target.value)}
                  placeholder="Set custom persona and instructions for this session..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditPromptModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:opacity-90 disabled:opacity-50"
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
