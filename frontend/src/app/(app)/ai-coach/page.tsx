"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

const initialHistory = [
  { id: "1", title: "Same-Origin Policy Explanation", date: "Today" },
  { id: "2", title: "SQL Injection Login Bypass", date: "Yesterday" },
  { id: "3", title: "Docker Networking Security", date: "June 10" },
];

const suggestionChips = [
  "Explain Same-Origin Policy in simple terms",
  "How can I exploit Reflected XSS filter bypass?",
  "What is the risk of prompt injection in LLM integrations?",
  "Give me tips for escalations via cron privileges",
];

export default function AICoachPage() {
  const [chats, setChats] = useState(initialHistory);
  const [messages, setMessages] = useState([
    {
      sender: "coach",
      text: "Hello, Agent John! I am your AI Cyber Coach. Ask me anything about vulnerabilities, Linux admin commands, networking, or ethical hacking. How can I help you hack ethically today? 🤖",
      time: "10:15 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load user name dynamically for the greeting
  useEffect(() => {
    api.getMe()
      .then((data) => {
        if (data && data.full_name) {
          const firstName = data.full_name.split(" ")[0];
          setMessages([
            {
              sender: "coach",
              text: `Hello, ${firstName}! I am your AI Cyber Coach. Ask me anything about vulnerabilities, Linux admin commands, networking, or ethical hacking. How can I help you hack ethically today? 🤖`,
              time: "10:15 AM",
            }
          ]);
        }
      })
      .catch((err) => console.log("AI Coach page fetching user name error:", err));
  }, []);

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = {
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Call Backend AI API
    api.chatWithCoach(textToSend, messages)
      .then((data) => {
        const coachMsg = {
          sender: "coach",
          text: data.reply || "No reply content received.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, coachMsg]);
        setLoading(false);
      })
      .catch((err) => {
        console.log("AI Backend offline, fallback to local simulator:", err);
        // Fallback simulated AI response
        setTimeout(() => {
          let reply = "";
          const query = textToSend.toLowerCase();

          if (query.includes("same-origin") || query.includes("sop")) {
            reply = "The Same-Origin Policy (SOP) is a browser security model. It prevents document scripts running on one origin (e.g. attacker.com) from accessing data/cookies on a different origin (e.g. yourbank.com). Two resources share the same origin only if their protocol, port, and host domains match exactly.";
          } else if (query.includes("xss") || query.includes("cross-site")) {
            reply = "Cross-Site Scripting (XSS) allows attackers to inject client-side scripts into web pages viewed by other users. Filter bypasses often involve changing capitalization (e.g., <sCrIpt>), using alternative tags (e.g., <img src=x onerror=alert(1)>), or payload obfuscation via encoding.";
          } else if (query.includes("injection") && query.includes("prompt")) {
            reply = "Prompt Injection occurs when a malicious actor inputs instructions to manipulate an LLM to override its system instructions, leak credentials, or trigger unintended tool invocations. Defense requires strict system boundary styling, prompt sandboxing, and output parsing validation.";
          } else {
            reply = "Interesting query! In penetration testing, we always verify the attack surface, trace input parameters, look for error responses, and ensure clean privilege separation. Let me know if you want me to write a script or walk you through a specific lab task!";
          }

          const coachMsg = {
            sender: "coach",
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setMessages((prev) => [...prev, coachMsg]);
          setLoading(false);
        }, 1000);
      });
  };

  const startNewChat = () => {
    setMessages([
      {
        sender: "coach",
        text: "Started a fresh workspace session. Ask me questions about courses, security tools, or flags!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Cyber Coach</h1>
            <p className="text-foreground-secondary mt-1">
              Your 24/7 personal tutor for learning cybersecurity, debugging code, and resolving CTF flags.
            </p>
          </div>
          <Button variant="outline" onClick={startNewChat} icon={<Plus className="w-4 h-4" />}>
            New Workspace Session
          </Button>
        </div>
      </motion.div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[600px]">
        {/* Left column: Chat History sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
          <Card padding="lg" className="flex-1 flex flex-col justify-start">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary mb-3">
              Session History
            </h3>
            <div className="space-y-1 overflow-y-auto max-h-[400px]">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full flex items-center justify-between p-2.5 rounded-[var(--radius)] text-left hover:bg-surface-elevated text-foreground-secondary hover:text-foreground text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  <span className="text-[9px] text-foreground-muted">{chat.date}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card padding="sm" className="bg-primary/5 border border-primary/15 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Cyber Guard</p>
              <p className="text-[10px] text-foreground-secondary mt-0.5 font-normal leading-normal">
                Never share real credentials or production keys. Ethical sandboxes only.
              </p>
            </div>
          </Card>
        </div>

        {/* Right column: Chat Console (9 cols) */}
        <div className="lg:col-span-9 flex flex-col justify-between">
          <Card padding="none" className="flex-1 flex flex-col justify-between overflow-hidden border border-border h-full min-h-[500px]">
            {/* Console Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Coach Jarvis</h3>
                  <Badge variant="success" size="sm" className="mt-0.5">Online</Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground-muted hover:text-foreground"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={startNewChat}
              >
                Reset Chat
              </Button>
            </div>

            {/* Messages body stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[420px]">
              {messages.map((msg, i) => {
                const isCoach = msg.sender === "coach";
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 max-w-[85%] ${
                      isCoach ? "mr-auto" : "ml-auto flex-row-reverse"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                      isCoach ? "bg-primary/10 border border-primary/20" : "bg-secondary/15 border border-secondary/20"
                    }`}>
                      {isCoach ? (
                        <Bot className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-secondary-light" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className={`p-3.5 rounded-[var(--radius-lg)] text-xs leading-relaxed font-normal whitespace-pre-line ${
                        isCoach
                          ? "bg-surface-elevated/40 border border-border text-foreground-secondary"
                          : "bg-primary text-white"
                      }`}>
                        {msg.text}
                      </div>
                      <p className={`text-[9px] text-foreground-muted ${isCoach ? "text-left" : "text-right"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-3 mr-auto max-w-[80%]">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-surface-elevated/40 border border-border p-3.5 rounded-[var(--radius-lg)] text-xs text-foreground-muted">
                    AI Coach is analyzing response...
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="px-6 py-3 border-t border-border/60 bg-surface/50">
              <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider mb-2">
                Suggested questions:
              </p>
              <div className="flex gap-2 flex-wrap max-h-[72px] overflow-y-auto">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-full border border-border bg-surface-elevated/40 text-foreground-secondary hover:text-primary hover:border-primary transition-all duration-150 cursor-pointer text-left truncate max-w-[280px]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Message input panel */}
            <div className="p-4 border-t border-border bg-surface-elevated/40 flex items-center gap-3">
              <input
                type="text"
                placeholder="Ask your coach for explanation or hints..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend(input);
                }}
                className="flex-1 bg-surface border border-border rounded-[var(--radius-lg)] px-4 py-2.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
              />
              <Button
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Send
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
