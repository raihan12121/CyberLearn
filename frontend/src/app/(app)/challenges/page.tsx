"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Zap,
  Users,
  Clock,
  Flag,
  Star,
  Swords,
  CheckCircle2,
  ShieldAlert,
  Terminal as TerminalIcon,
  Download,
  ExternalLink,
  HelpCircle,
  X,
  Sparkles,
  Trophy,
  Flame,
  Globe,
  KeyRound,
  Cpu,
  FileSearch,
  Radar,
  FileCode
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { saveLabSolveToFirestore } from "@/lib/firebase";

export interface CTFChallenge {
  id: string;
  title: string;
  category: "Web" | "Crypto" | "Pwn / Rev" | "Forensics" | "OSINT";
  difficulty: "Easy" | "Medium" | "Hard" | "Insane";
  xp: number;
  solvedCount: number;
  firstBloodBy: string;
  author: string;
  description: string;
  flagFormat: string;
  acceptedFlags: string[];
  hints: string[];
  tags: string[];
  artifactUrl?: string;
  targetHost?: string;
}

const CTF_CHALLENGES: CTFChallenge[] = [
  // Web Exploitation
  {
    id: "jwt-none-algorithm",
    title: "JWT None Algorithm Forgery",
    category: "Web",
    difficulty: "Easy",
    xp: 150,
    solvedCount: 842,
    firstBloodBy: "0xRootKiddie",
    author: "CyberLearn RedTeam",
    description: "The authentication service verifies JSON Web Tokens but improperly trusts header declarations. Forge an administrative token by setting the header algorithm to 'none' and altering the user role to 'admin'.",
    flagFormat: "FLAG{jwt_n0n3_4lg_byp4ss}",
    acceptedFlags: ["FLAG{jwt_n0n3_4lg_byp4ss}", "CYBERLEARN{jwt_n0n3_4lg_byp4ss}", "jwt_n0n3_4lg_byp4ss"],
    hints: [
      "Decode the base64url encoded header and change 'alg': 'HS256' to 'alg': 'none'.",
      "Ensure the signature segment of the token is left empty (e.g. 'eyJ...eyJ...')."
    ],
    tags: ["jwt", "authentication", "tokens"],
    targetHost: "http://10.10.14.88:8080/api/v1/auth"
  },
  {
    id: "jinja2-ssti-rce",
    title: "Jinja2 Server-Side Template Injection",
    category: "Web",
    difficulty: "Medium",
    xp: 300,
    solvedCount: 512,
    firstBloodBy: "VortexSec",
    author: "CyberLearn Research",
    description: "A Flask dynamic template renders raw user input from the 'preview_name' query parameter. Break out of the Jinja2 template context, traverse Python class MROs, and execute system commands to read `/secret/flag.txt`.",
    flagFormat: "FLAG{sst1_j1nj42_pyth0n_cl4ss_3sc4p3}",
    acceptedFlags: ["FLAG{sst1_j1nj42_pyth0n_cl4ss_3sc4p3}", "CYBERLEARN{sst1_j1nj42_pyth0n_cl4ss_3sc4p3}"],
    hints: [
      "Try injecting `{{ ''.__class__.__mro__[1].__subclasses__() }}` to locate subprocess.Popen.",
      "Look for index 390 or 400 in the loaded subclasses list."
    ],
    tags: ["ssti", "rce", "flask", "jinja2"],
    targetHost: "http://10.10.14.92:5000/render?template="
  },
  {
    id: "sqli-blind-boolean",
    title: "Blind Boolean SQL Extraction",
    category: "Web",
    difficulty: "Hard",
    xp: 450,
    solvedCount: 289,
    firstBloodBy: "NullByte99",
    author: "RedOps Lead",
    description: "The product catalog endpoint only reflects whether an item exists or not. Exploit a blind boolean-based SQL injection vulnerability to dump the confidential master secret key from `admin_secrets.secret_value`.",
    flagFormat: "FLAG{bl1nd_sql_b00l34n_3xtr4ct10n}",
    acceptedFlags: ["FLAG{bl1nd_sql_b00l34n_3xtr4ct10n}", "CYBERLEARN{bl1nd_sql_b00l34n_3xtr4ct10n}"],
    hints: [
      "Use substring comparison: `' AND SUBSTRING((SELECT secret_value FROM admin_secrets LIMIT 1), 1, 1) = 'F'--`.",
      "Write a Python script with `requests.get` to automate binary search per character."
    ],
    tags: ["sqli", "blind", "boolean", "database"],
    targetHost: "http://10.10.14.105:3000/api/items?id=1"
  },

  // Cryptography
  {
    id: "rsa-weak-private-exponent",
    title: "RSA Wiener's Short Exponent Attack",
    category: "Crypto",
    difficulty: "Medium",
    xp: 250,
    solvedCount: 420,
    firstBloodBy: "CipherMaster",
    author: "Crypto Lab Team",
    description: "An encrypted message was intercepted alongside an RSA public key (N, e). Because the private exponent d is unusually small (d < 1/3 * N^0.25), apply Wiener's continued fraction theorem to factor modulus N and decrypt the flag.",
    flagFormat: "FLAG{w13n3r_c0nt1nu3d_fr4ct10n_d3crypt}",
    acceptedFlags: ["FLAG{w13n3r_c0nt1nu3d_fr4ct10n_d3crypt}", "CYBERLEARN{w13n3r_c0nt1nu3d_fr4ct10n_d3crypt}"],
    hints: [
      "Compute the continued fraction convergents of e / N.",
      "Use `owiener` in Python: `pip install owiener` -> `owiener.attack(e, n)`."
    ],
    tags: ["rsa", "wiener", "public-key", "math"]
  },
  {
    id: "xor-repeating-key-stream",
    title: "Repeating-Key XOR Decryption",
    category: "Crypto",
    difficulty: "Easy",
    xp: 120,
    solvedCount: 975,
    firstBloodBy: "ByteWizard",
    author: "CyberLearn Cryptography",
    description: "We recovered a hex-encoded stream of cipherbytes encrypted using a repeating cyclic XOR key. Perform normalized Hamming distance calculations to deduce the key size, frequency analysis, and reveal the plaintext flag.",
    flagFormat: "FLAG{r3p34t1ng_x0r_fr3qu3ncy_4n4lys1s}",
    acceptedFlags: ["FLAG{r3p34t1ng_x0r_fr3qu3ncy_4n4lys1s}", "CYBERLEARN{r3p34t1ng_x0r_fr3qu3ncy_4n4lys1s}"],
    hints: [
      "Divide the ciphertext into blocks of size KEYSIZE and transpose columns.",
      "Score single-byte XOR against standard English letter frequencies (ETAOIN SHRDLU)."
    ],
    tags: ["xor", "stream-cipher", "crypto-analysis"]
  },

  // Reverse Engineering & Binary Exploitation (Pwn)
  {
    id: "pwn-ret2win-x64",
    title: "x86_64 Stack Buffer Overflow (ret2win)",
    category: "Pwn / Rev",
    difficulty: "Medium",
    xp: 350,
    solvedCount: 380,
    firstBloodBy: "GDB_Warrior",
    author: "Pwn Operations",
    description: "An ELF 64-bit binary reads input into a 64-byte stack buffer using `gets()` without bounds checking. Calculate the offset to the saved base pointer (`$rbp`), bypass 16-byte stack alignment, and overwrite the return address with `win_flag_printer()`.",
    flagFormat: "FLAG{st4ck_b0f_r3t2w1n_x86_64_pwn}",
    acceptedFlags: ["FLAG{st4ck_b0f_r3t2w1n_x86_64_pwn}", "CYBERLEARN{st4ck_b0f_r3t2w1n_x86_64_pwn}"],
    hints: [
      "Offset is 72 bytes (64-byte buffer + 8-byte saved RBP).",
      "Insert a `ret` gadget before `win()` if `movaps` instruction segfaults due to stack alignment."
    ],
    tags: ["bof", "pwn", "x86_64", "gdb"]
  },
  {
    id: "rev-elf-antidebug-patch",
    title: "ELF Anti-Debugging & Binary Patching",
    category: "Pwn / Rev",
    difficulty: "Hard",
    xp: 400,
    solvedCount: 215,
    firstBloodBy: "IDA_Pro_God",
    author: "Reverse Engineering Division",
    description: "A compiled Linux executable terminates if `ptrace(PTRACE_TRACEME)` detects an active debugger or if LD_PRELOAD is injected. Reverse engineer the verification routine in Ghidra/Binary Ninja, patch the conditional branch, and extract the valid serial key.",
    flagFormat: "FLAG{gh1dr4_p4tch_ptr4c3_4nt1_d3bug}",
    acceptedFlags: ["FLAG{gh1dr4_p4tch_ptr4c3_4nt1_d3bug}", "CYBERLEARN{gh1dr4_p4tch_ptr4c3_4nt1_d3bug}"],
    hints: [
      "Inspect the function checking `ptrace(0, 0, 1, 0) == -1`.",
      "Patch the `jz` / `jnz` opcode (`0x74` / `0x75`) with `0x90` NOPs."
    ],
    tags: ["ghidra", "reverse-engineering", "anti-debug", "patching"]
  },

  // Digital Forensics
  {
    id: "forensics-volatility-lsass",
    title: "Volatility 3 LSASS Memory Dump Analysis",
    category: "Forensics",
    difficulty: "Medium",
    xp: 280,
    solvedCount: 460,
    firstBloodBy: "DFIR_Hunter",
    author: "Incident Response Lead",
    description: "A workstation was compromised via a malicious macro. Analyze the provided memory image (`memdump.raw`) using Volatility 3, extract cached LSASS logon credentials, and recover the compromised Domain Admin password hash.",
    flagFormat: "FLAG{v0l4t1l1ty_ls4ss_ntlm_h4sh_dumpe}",
    acceptedFlags: ["FLAG{v0l4t1l1ty_ls4ss_ntlm_h4sh_dumpe}", "CYBERLEARN{v0l4t1l1ty_ls4ss_ntlm_h4sh_dumpe}"],
    hints: [
      "Run `python3 vol.py -f memdump.raw windows.lsass.Lsass` or `windows.hashdump.Hashdump`.",
      "Identify the NTLM hash of user 'Administrator'."
    ],
    tags: ["volatility", "memory-forensics", "lsass", "dfir"]
  },
  {
    id: "forensics-dns-tunnel-pcap",
    title: "Covert DNS Tunnel Exfiltration PCAP",
    category: "Forensics",
    difficulty: "Easy",
    xp: 180,
    solvedCount: 710,
    firstBloodBy: "WireSharkEye",
    author: "Network Defense Team",
    description: "An insider threat exfiltrated sensitive trade secrets over recursive DNS queries to `*.data.exfil-c2.org`. Analyze the network packet capture, reconstruct the base32 subdomains in sequence, and reassemble the leaked document.",
    flagFormat: "FLAG{dns_c0v3rt_tunn3l_3xf1ltr4t10n}",
    acceptedFlags: ["FLAG{dns_c0v3rt_tunn3l_3xf1ltr4t10n}", "CYBERLEARN{dns_c0v3rt_tunn3l_3xf1ltr4t10n}"],
    hints: [
      "Filter for `dns.qry.name contains 'exfil-c2'` in Wireshark.",
      "Extract query subdomains, strip non-hex characters, and base64/base32 decode the concatenated string."
    ],
    tags: ["pcap", "wireshark", "dns-tunnel", "network"]
  },

  // OSINT & Recon
  {
    id: "osint-git-commit-secrets",
    title: "Orphaned Git Commit Secret Extraction",
    category: "OSINT",
    difficulty: "Easy",
    xp: 140,
    solvedCount: 890,
    firstBloodBy: "ReconMaster",
    author: "OSINT Ops",
    description: "A developer made a commit with production API keys, followed by an immediate 'delete secrets' commit. The public repo seems clean, but the orphaned dangling commits still exist in the `.git` objects packfile. Find the leaked AWS secret key.",
    flagFormat: "FLAG{g1t_d4ngl1ng_c0mm1t_l34k3d_s3cr3t}",
    acceptedFlags: ["FLAG{g1t_d4ngl1ng_c0mm1t_l34k3d_s3cr3t}", "CYBERLEARN{g1t_d4ngl1ng_c0mm1t_l34k3d_s3cr3t}"],
    hints: [
      "Use `git log --all --full-history` or `git reflog`.",
      "Inspect unreferenced objects with `git fsck --lost-found`."
    ],
    tags: ["git", "osint", "secret-leaks", "recon"]
  },
  {
    id: "osint-c2-jarm-tracking",
    title: "Cobalt Strike C2 JARM Fingerprint Recon",
    category: "OSINT",
    difficulty: "Medium",
    xp: 220,
    solvedCount: 395,
    firstBloodBy: "ThreatIntel01",
    author: "Threat Intelligence Team",
    description: "Adversaries are orchestrating attacks via rogue Cobalt Strike team servers. Using standard JARM TLS fingerprints and SSL certificate serial metadata, correlate the adversary infrastructure on Shodan/Censys to discover their primary command server hostname.",
    flagFormat: "FLAG{j4rm_c2_c0b4lt_str1k3_tr4ck3d}",
    acceptedFlags: ["FLAG{j4rm_c2_c0b4lt_str1k3_tr4ck3d}", "CYBERLEARN{j4rm_c2_c0b4lt_str1k3_tr4ck3d}"],
    hints: [
      "Cobalt Strike default SSL JARM fingerprint is `07d14d16d21d21d07c42d41d00041d24a458a375eef0c576d23a7bab9a9fb1`.",
      "Query Shodan using `ssl.jarm:\"...\"`."
    ],
    tags: ["threat-intel", "shodan", "jarm", "osint"]
  }
];

const categoryIcons: Record<string, any> = {
  All: Swords,
  Web: Globe,
  Crypto: KeyRound,
  "Pwn / Rev": Cpu,
  Forensics: FileSearch,
  OSINT: Radar,
};

const difficultyColor: Record<string, "success" | "primary" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "primary",
  Hard: "warning",
  Insane: "danger",
};

export default function ChallengesPage() {
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());
  const [selectedChallenge, setSelectedChallenge] = useState<CTFChallenge | null>(null);
  const [flagInput, setFlagInput] = useState("");
  const [submissionFeedback, setSubmissionFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlockedHints, setUnlockedHints] = useState<Record<string, boolean>>({});

  // Load solved challenges from local storage and user history
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cyberlearn_solved_ctf");
      if (stored) {
        setSolvedSet(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  const totalPoints = Array.from(solvedSet).reduce((sum, id) => {
    const ch = CTF_CHALLENGES.find((c) => c.id === id);
    return sum + (ch ? ch.xp : 0);
  }, 0);

  const filteredChallenges = CTF_CHALLENGES.filter((c) => {
    const matchCategory = activeCategory === "All" || c.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
    return matchCategory && matchSearch;
  });

  const handleOpenChallenge = (challenge: CTFChallenge) => {
    setSelectedChallenge(challenge);
    setFlagInput("");
    setSubmissionFeedback(null);
  };

  const handleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge || !flagInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const cleanFlag = flagInput.trim();

    const isMatch = selectedChallenge.acceptedFlags.some(
      (f) => f.toLowerCase() === cleanFlag.toLowerCase()
    );

    setTimeout(() => {
      setIsSubmitting(false);
      if (isMatch) {
        setSubmissionFeedback({
          success: true,
          msg: `🎉 Correct Flag Captured! +${selectedChallenge.xp} XP points awarded to your rank.`
        });
        const updated = new Set(solvedSet);
        updated.add(selectedChallenge.id);
        setSolvedSet(updated);
        try {
          localStorage.setItem("cyberlearn_solved_ctf", JSON.stringify(Array.from(updated)));
        } catch {}

        if (user?.email) {
          saveLabSolveToFirestore(user.email, selectedChallenge.id, cleanFlag, selectedChallenge.xp).catch(() => {});
        }
      } else {
        setSubmissionFeedback({
          success: false,
          msg: "❌ Incorrect flag payload. Inspect the challenge details, verify encoding, and try again!"
        });
      }
    }, 400);
  };

  const toggleHint = (challengeId: string) => {
    setUnlockedHints((prev) => ({ ...prev, [challengeId]: !prev[challengeId] }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">CTF Challenges Arena</h1>
              <Badge variant="primary" size="sm" className="font-mono uppercase text-[10px] tracking-wider">
                Jeopardy CTF
              </Badge>
            </div>
            <p className="text-foreground-secondary mt-1">
              Competitive flag hunting arena. Exploit binaries, reverse ciphers, hunt threat actors, and capture flags for global leaderboard rank.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Card padding="sm" className="flex items-center gap-4 bg-surface-elevated/60 border-primary/30 shadow-md">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-[10px] text-foreground-secondary uppercase tracking-wider font-mono">CTF Points</p>
                  <p className="text-base font-bold text-primary font-mono">{totalPoints.toLocaleString()} XP</p>
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-[10px] text-foreground-secondary uppercase tracking-wider font-mono">Solved</p>
                  <p className="text-base font-bold text-foreground font-mono">
                    {solvedSet.size} / {CTF_CHALLENGES.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["All", "Web", "Crypto", "Pwn / Rev", "Forensics", "OSINT"].map((cat) => {
            const Icon = categoryIcons[cat] || Swords;
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full shrink-0 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-surface-elevated text-foreground-secondary hover:text-foreground border border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-auto sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search CTF challenges & tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-[var(--radius-lg)] pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200 font-mono text-xs"
          />
        </div>
      </div>

      {/* CTF Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredChallenges.map((challenge, i) => {
          const isSolved = solvedSet.has(challenge.id);
          const Icon = categoryIcons[challenge.category] || Swords;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                hover
                padding="lg"
                onClick={() => handleOpenChallenge(challenge)}
                className={`h-full flex flex-col group cursor-pointer transition-all duration-200 relative overflow-hidden ${
                  isSolved ? "border-success/40 bg-success/5" : "border-border hover:border-primary/50"
                }`}
              >
                {/* Solved Status Indicator Ribbon */}
                {isSolved && (
                  <div className="absolute top-0 right-0 bg-success text-black text-[10px] font-bold font-mono px-3 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>SOLVED</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <Badge variant="primary" size="sm" className="flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    <span>{challenge.category}</span>
                  </Badge>
                  <Badge variant={difficultyColor[challenge.difficulty]} size="sm">
                    {challenge.difficulty}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors flex items-center gap-2">
                  <span>{challenge.title}</span>
                </h3>

                <p className="text-xs text-foreground-secondary mb-4 flex-1 line-clamp-3 leading-relaxed">
                  {challenge.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {challenge.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-border text-foreground-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Stats Footer */}
                <div className="flex items-center justify-between text-xs text-foreground-muted pt-3 border-t border-border/60">
                  <span className="flex items-center gap-1 font-mono font-bold text-primary">
                    <Zap className="w-3.5 h-3.5" />
                    +{challenge.xp} XP
                  </span>

                  <span className="flex items-center gap-1 text-[11px]">
                    <Users className="w-3 h-3" />
                    {challenge.solvedCount} solves
                  </span>

                  <span className="flex items-center gap-1 text-[10px] font-mono text-foreground-muted">
                    <Flame className="w-3 h-3 text-warning" />
                    {challenge.firstBloodBy}
                  </span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* In-Modal CTF Challenge Solver */}
      <AnimatePresence>
        {selectedChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-surface-elevated/50">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary" size="sm">
                      {selectedChallenge.category}
                    </Badge>
                    <Badge variant={difficultyColor[selectedChallenge.difficulty]} size="sm">
                      {selectedChallenge.difficulty}
                    </Badge>
                    {solvedSet.has(selectedChallenge.id) && (
                      <Badge variant="success" size="sm" className="flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> Solved
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{selectedChallenge.title}</h2>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Author: <span className="text-foreground font-mono">{selectedChallenge.author}</span> • First Blood:{" "}
                    <span className="text-warning font-mono">🩸 {selectedChallenge.firstBloodBy}</span>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
                <div className="space-y-2">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-primary font-bold">Challenge Briefing</h4>
                  <div className="p-4 rounded-xl bg-surface-elevated border border-border text-foreground leading-relaxed">
                    {selectedChallenge.description}
                  </div>
                </div>

                {/* Target Host or Connection string */}
                {selectedChallenge.targetHost && (
                  <div className="space-y-2">
                    <h4 className="font-mono text-xs uppercase tracking-wider text-foreground-secondary font-bold">Target URL / Endpoint</h4>
                    <div className="p-3 rounded-lg bg-black/40 border border-primary/30 font-mono text-xs text-primary flex items-center justify-between">
                      <code>{selectedChallenge.targetHost}</code>
                      <ExternalLink className="w-4 h-4 text-foreground-muted" />
                    </div>
                  </div>
                )}

                {/* Hints Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono text-xs uppercase tracking-wider text-foreground-secondary font-bold">Hints &amp; Socratic Guidance</h4>
                    <button
                      onClick={() => toggleHint(selectedChallenge.id)}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-mono cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      {unlockedHints[selectedChallenge.id] ? "Hide Hints" : "View Hints"}
                    </button>
                  </div>

                  {unlockedHints[selectedChallenge.id] && (
                    <div className="p-4 rounded-xl bg-surface-elevated/80 border border-border space-y-2">
                      {selectedChallenge.hints.map((h, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-foreground-secondary">
                          <span className="font-mono text-primary font-bold">[{index + 1}]</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interactive Flag Submission Form */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Flag className="w-4 h-4 text-primary" />
                      <span>SUBMIT CAPTURED FLAG:</span>
                    </label>
                    <span className="font-mono text-[11px] text-foreground-muted">
                      Reward: <strong className="text-primary">+{selectedChallenge.xp} XP</strong>
                    </span>
                  </div>

                  <form onSubmit={handleFlagSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      placeholder="FLAG{...} or CYBERLEARN{...}"
                      value={flagInput}
                      onChange={(e) => setFlagInput(e.target.value)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 text-xs font-mono bg-surface-elevated border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSubmitting || !flagInput.trim()}
                      className="font-bold shadow-lg shrink-0"
                    >
                      {isSubmitting ? "Validating..." : "Submit Flag"}
                    </Button>
                  </form>

                  {submissionFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                        submissionFeedback.success
                          ? "bg-success/15 text-success border border-success/30"
                          : "bg-error/15 text-error border border-error/30"
                      }`}
                    >
                      {submissionFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                      )}
                      <span>{submissionFeedback.msg}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
