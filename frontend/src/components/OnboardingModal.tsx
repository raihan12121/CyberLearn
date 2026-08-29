"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Terminal,
  Network,
  Shield,
  Fingerprint,
  Award,
  Zap,
  Check,
  Loader2,
  Lock,
  Flame,
  Binary,
  Code2,
  X,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

const FOCUS_OPTIONS = [
  {
    id: "web-security",
    name: "Web & API Security",
    icon: Shield,
    desc: "OWASP Top 10, XSS, SQLi, JWT security, and defensive web architectures.",
    color: "from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "offensive-security",
    name: "Ethical Hacking & Red Team",
    icon: Terminal,
    desc: "Penetration testing, Metasploit, binary exploitation, and privilege escalation.",
    color: "from-red-500/20 to-orange-500/20 text-orange-400 border-orange-500/30",
  },
  {
    id: "network-defense",
    name: "Network Security & Defense",
    icon: Network,
    desc: "Cisco CCNA, SPI firewalls, DAI, DHCP snooping, and packet analysis.",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "soc-analysis",
    name: "SOC Analysis & Threat Hunting",
    icon: ShieldCheck,
    desc: "SIEM log correlation, incident response, digital forensics, and malware triage.",
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "linux-cloud",
    name: "Linux Systems & Cloud Security",
    icon: Binary,
    desc: "Linux kernel hardening, SSH security, namespaces, and cloud access control.",
    color: "from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30",
  },
];

const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    title: "Novice / Absolute Beginner",
    badge: "Level 1",
    desc: "Starting fresh with zero prior cybersecurity experience. Ready to build foundational knowledge.",
  },
  {
    id: "intermediate",
    title: "Intermediate Practitioner",
    badge: "Level 2",
    desc: "IT, sysadmin, or developer background. Looking to transition into practical cybersecurity.",
  },
  {
    id: "advanced",
    title: "Advanced Operative",
    badge: "Level 3",
    desc: "Experienced security professional preparing for high-stakes certification exams.",
  },
];

const AVATAR_PRESETS = [
  { id: "avatar-neon", name: "Cyber Ninja", icon: Terminal, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  { id: "avatar-phantom", name: "Ghost Operative", icon: Shield, color: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
  { id: "avatar-sentinel", name: "Net Sentinel", icon: Network, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" },
  { id: "avatar-valkyrie", name: "Binary Valkyrie", icon: Zap, color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  { id: "avatar-glitch", name: "Glitch Hunter", icon: Code2, color: "bg-pink-500/20 text-pink-400 border-pink-500/40" },
  { id: "avatar-cipher", name: "Quantum Cipher", icon: Lock, color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
];

export function OnboardingModal() {
  const { user, fetchUser, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [primaryFocus, setPrimaryFocus] = useState(FOCUS_OPTIONS[0].name);
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [avatarUrl, setAvatarUrl] = useState("avatar-neon");
  const [bio, setBio] = useState("");

  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form fields from user
  useEffect(() => {
    if (user) {
      if (user.username && !user.username.includes("@")) {
        setUsername(user.username);
      } else if (user.email) {
        setUsername(user.email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, ""));
      }
      if (user.full_name) {
        setFullName(user.full_name);
      }
    }
  }, [user]);

  // Live debounced username checker
  const checkUsername = useCallback(async (nameToCheck: string) => {
    const clean = nameToCheck.trim();
    if (!clean || clean.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(clean.length > 0 ? "Username must be at least 3 characters" : null);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      setUsernameAvailable(false);
      setUsernameError("Only letters, numbers, underscores, and hyphens allowed");
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError(null);
    try {
      const res = await api.checkUsernameAvailability(clean);
      setUsernameAvailable(res.available);
      if (!res.available) {
        setUsernameError(res.message);
      }
    } catch {
      // Fallback
      setUsernameAvailable(true);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  useEffect(() => {
    if (!username) return;
    const timer = setTimeout(() => {
      checkUsername(username);
    }, 400);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  // Only render if user is authenticated, is a student/learner, and not yet onboarded (Admins never onboard)
  if (!user || user.role === "admin" || user.is_onboarded) {
    return null;
  }

  const handleCompleteOnboarding = async () => {
    if (!username.trim() || username.trim().length < 3) {
      alert("Please choose a valid unique username of at least 3 characters.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const updatedUser = await api.completeOnboarding({
        username: username.trim(),
        full_name: fullName.trim() || undefined,
        primary_focus: primaryFocus,
        experience_level: experienceLevel,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl,
      });

      setUser(updatedUser);
      await fetchUser(true);
    } catch (err: any) {
      alert(err.message || "Failed to complete onboarding. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      const updatedUser = await api.updateProfile({ is_onboarded: true });
      setUser(updatedUser);
      await fetchUser(true);
    } catch {
      if (user) {
        setUser({ ...user, is_onboarded: true });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-surface border-2 border-primary/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
      >
        {/* Top Progress Bar */}
        <div className="h-1.5 w-full bg-surface-elevated">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-border bg-surface-elevated/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                  Operative Onboarding • Step {step} of 4
                </span>
                <Badge variant="primary" size="sm" className="text-[9px] font-mono">
                  +100 XP Bonus
                </Badge>
              </div>
              <h2 className="text-lg font-extrabold text-foreground">
                {step === 1 && "Choose Your Unique Hacker Handle"}
                {step === 2 && "Select Your Cybersecurity Track"}
                {step === 3 && "Define Your Experience Level"}
                {step === 4 && "Operative Identity & Mission Launch"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="px-3 py-1.5 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface border border-border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Skip setup and go to Dashboard"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: Unique Username & Full Name */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    Your unique username will be your public identity on the **Leaderboard**, in the **Community**, and on your **Public Cybersecurity Portfolio**.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase font-mono tracking-wider">
                      Unique Hacker Handle / Username *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                        <span className="font-mono text-sm">@</span>
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        placeholder="e.g. shadow_byte, cipher_01"
                        maxLength={25}
                        className={`w-full pl-9 pr-10 py-3 rounded-2xl bg-surface-elevated border text-sm font-mono text-foreground focus:outline-none transition-all ${
                          usernameAvailable === true
                            ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
                            : usernameAvailable === false
                            ? "border-red-500/60 ring-1 ring-red-500/30"
                            : "border-border focus:border-primary/50"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        {isCheckingUsername ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : usernameAvailable === true ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : usernameAvailable === false ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : null}
                      </div>
                    </div>

                    {/* Status Note */}
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      {usernameAvailable === true && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Handle is available!
                        </span>
                      )}
                      {usernameError && (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {usernameError}
                        </span>
                      )}
                      {!usernameError && usernameAvailable === null && (
                        <span className="text-foreground-muted text-[11px]">
                          3-25 alphanumeric characters, underscores, hyphens
                        </span>
                      )}
                      <span className="text-foreground-muted font-mono text-[10px]">
                        {username.length}/25
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase font-mono tracking-wider">
                      Full Name (Used for Official Verified Certificates)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        maxLength={50}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-elevated border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-foreground-muted mt-1">
                      This name will be printed on your cryptographic completion certificates and CCNA/CompTIA diplomas.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Cybersecurity Focus */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-foreground-secondary">
                  Choose your primary area of specialization. We will customize your recommended curriculum and hands-on practice labs.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {FOCUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = primaryFocus === opt.name;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrimaryFocus(opt.name)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary ring-1 ring-primary shadow-md"
                            : "bg-surface-elevated/60 border-border hover:border-primary/40 hover:bg-surface-elevated"
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border shrink-0 ${opt.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-foreground">{opt.name}</h4>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-xs text-foreground-secondary mt-1 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Experience Level */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-foreground-secondary">
                  What is your current level of experience in cybersecurity and systems administration?
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {EXPERIENCE_LEVELS.map((lvl) => {
                    const isSelected = experienceLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setExperienceLevel(lvl.id)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary ring-1 ring-primary shadow-md"
                            : "bg-surface-elevated/60 border-border hover:border-primary/40 hover:bg-surface-elevated"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground">{lvl.title}</h4>
                              <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                                {lvl.badge}
                              </Badge>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
                            {lvl.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Avatar, Bio & Launch */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase font-mono tracking-wider">
                    Select Operative Avatar
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {AVATAR_PRESETS.map((av) => {
                      const Icon = av.icon;
                      const isSelected = avatarUrl === av.id;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setAvatarUrl(av.id)}
                          className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/15 ring-2 ring-primary/40 scale-105"
                              : "border-border bg-surface-elevated hover:border-primary/40"
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl border ${av.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-foreground truncate w-full text-center">
                            {av.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase font-mono tracking-wider">
                    Operative Bio / Mission Statement (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Aspiring Penetration Tester | Breaking and securing web architectures."
                    maxLength={160}
                    className="w-full p-3 rounded-2xl bg-surface-elevated border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all resize-none"
                  />
                  <div className="text-right text-[10px] text-foreground-muted font-mono mt-0.5">
                    {bio.length}/160
                  </div>
                </div>

                {/* Summary Card with XP Initiation */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-surface-elevated to-secondary/15 border border-primary/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/20 text-primary border border-primary/30">
                      <Award className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <span>Cyber Initiate Status Granted</span>
                        <Badge variant="success" size="sm" className="font-mono text-[9px] uppercase">Unlocked</Badge>
                      </h4>
                      <p className="text-xs text-foreground-secondary mt-0.5">
                        You will receive an instant <strong className="text-primary">+100 XP Welcome Bonus</strong> and the Cyber Initiate Badge.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-border bg-surface-elevated/80 flex items-center justify-between">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((p) => p - 1)}
              disabled={submitting}
            >
              ← Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              variant="primary"
              size="sm"
              disabled={step === 1 && (username.length < 3 || usernameAvailable === false || isCheckingUsername)}
              onClick={() => setStep((p) => p + 1)}
              className="font-bold shadow-md"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              loading={submitting}
              onClick={handleCompleteOnboarding}
              className="font-extrabold shadow-lg px-6"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              <span>Launch CyberLearn &amp; Claim +100 XP →</span>
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
