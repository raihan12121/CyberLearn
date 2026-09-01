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
  FileCode,
  ArrowLeft,
  RotateCcw,
  Play,
  Copy,
  Check,
  Send,
  Code2,
  Binary,
  Layers,
  FileText
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
  targetType: "jwt" | "ssti" | "sqli" | "crypto" | "bof" | "forensics" | "osint";
  targetHost?: string;
  sourceCodeSnippet?: string;
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
    description: "The authentication microservice validates JSON Web Tokens but unsafely trusts the header's 'alg' parameter without server-side algorithm pinning. Forge an administrative token by altering the algorithm header to 'none' and changing the claim role to 'admin' to bypass authorization and extract the flag.",
    flagFormat: "FLAG{jwt_n0n3_4lg_byp4ss}",
    acceptedFlags: ["FLAG{jwt_n0n3_4lg_byp4ss}", "CYBERLEARN{jwt_n0n3_4lg_byp4ss}", "jwt_n0n3_4lg_byp4ss"],
    hints: [
      "Base64Url decode the JWT header and change `\"alg\": \"HS256\"` to `\"alg\": \"none\"`.",
      "Base64Url decode the payload and change `\"role\": \"student\"` to `\"role\": \"admin\"`.",
      "Strip the cryptographic signature so the token format is `<header>.<payload>.` (with the trailing dot)."
    ],
    tags: ["jwt", "tokens", "auth-bypass", "cve-2015-9235"],
    targetType: "jwt",
    targetHost: "http://10.10.14.88:8080/api/v1/auth/verify",
    sourceCodeSnippet: `def verify_jwt_token(token: str):\n    header_b64, payload_b64, *sig = token.split(".")\n    header = json.loads(base64url_decode(header_b64))\n    if header.get("alg") == "none":\n        # VULNERABILITY: Trusting 'none' algorithm without signature check\n        return json.loads(base64url_decode(payload_b64))\n    return hmac_verify(token, SECRET_KEY)`
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
    description: "A Flask web service dynamically renders greeting previews by concatenating raw user input directly into `render_template_string()`. Inject Jinja2 expression syntax, traverse the Python class Method Resolution Order (MRO), and read `/secret/flag.txt`.",
    flagFormat: "FLAG{sst1_j1nj42_pyth0n_cl4ss_3sc4p3}",
    acceptedFlags: ["FLAG{sst1_j1nj42_pyth0n_cl4ss_3sc4p3}", "CYBERLEARN{sst1_j1nj42_pyth0n_cl4ss_3sc4p3}"],
    hints: [
      "Test basic mathematical evaluation with `{{ 7 * 7 }}` to confirm template injection.",
      "Inspect loaded Python classes using `{{ ''.__class__.__mro__[1].__subclasses__() }}`.",
      "Locate `subprocess.Popen` or use `{{ config.__class__.__init__.__globals__['os'].popen('cat /secret/flag.txt').read() }}`."
    ],
    tags: ["ssti", "rce", "jinja2", "python"],
    targetType: "ssti",
    targetHost: "http://10.10.14.92:5000/preview?name=",
    sourceCodeSnippet: `@app.route('/preview')\ndef preview_banner():\n    name = request.args.get('name', 'Learner')\n    # VULNERABILITY: Direct string concatenation into template string\n    template = f"<h2>Welcome to CyberLearn, {name}!</h2>"\n    return render_template_string(template)`
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
    description: "The product database endpoint only returns `200 OK: Item Found` or `404: Not Found`. Use conditional boolean expressions to extract the confidential master token character-by-character from the `admin_vault` table.",
    flagFormat: "FLAG{bl1nd_sql_b00l34n_3xtr4ct10n}",
    acceptedFlags: ["FLAG{bl1nd_sql_b00l34n_3xtr4ct10n}", "CYBERLEARN{bl1nd_sql_b00l34n_3xtr4ct10n}"],
    hints: [
      "Test truth conditions: `1' AND 1=1--` (returns Found) vs `1' AND 1=2--` (returns Not Found).",
      "Use substring checks: `1' AND SUBSTRING((SELECT secret FROM admin_vault LIMIT 1), 1, 1) = 'F'--`."
    ],
    tags: ["sqli", "blind-sql", "boolean", "database"],
    targetType: "sqli",
    targetHost: "http://10.10.14.105:3000/api/items?id=1",
    sourceCodeSnippet: `def get_item(item_id):\n    # VULNERABILITY: Raw SQL string formatting\n    query = f"SELECT name, price FROM items WHERE id = '{item_id}'"\n    result = db.execute(query).fetchone()\n    return {"found": bool(result)}`
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
    description: "An encrypted military transmission was intercepted along with the RSA public parameters (N, e). The private exponent d was chosen small to speed up decryption (d < 1/3 * N^0.25). Apply Wiener's theorem via continued fractions to calculate d and decipher the ciphertext.",
    flagFormat: "FLAG{w13n3r_c0nt1nu3d_fr4ct10n_d3crypt}",
    acceptedFlags: ["FLAG{w13n3r_c0nt1nu3d_fr4ct10n_d3crypt}", "CYBERLEARN{w13n3r_c0nt1nu3d_fr4ct10n_d3crypt}"],
    hints: [
      "Wiener's attack exploits continued fraction expansions of e / N.",
      "You can solve it using Python with the `owiener` package or SageMath."
    ],
    tags: ["rsa", "wiener", "public-key", "cryptanalysis"],
    targetType: "crypto"
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
      "Compute normalized Hamming distance between consecutive chunks to find the KEYSIZE (between 2 and 40).",
      "Transpose ciphertext columns and score each column with single-byte XOR frequency analysis."
    ],
    tags: ["xor", "stream-cipher", "frequency-analysis"],
    targetType: "crypto"
  },

  // Reverse Engineering & Pwn
  {
    id: "pwn-ret2win-x64",
    title: "x86_64 Stack Buffer Overflow (ret2win)",
    category: "Pwn / Rev",
    difficulty: "Medium",
    xp: 350,
    solvedCount: 380,
    firstBloodBy: "GDB_Warrior",
    author: "Pwn Operations",
    description: "An ELF 64-bit binary reads input into a 64-byte stack buffer using `gets()` without bounds checking. Calculate the offset to the saved base pointer (`$rbp`), bypass 16-byte stack alignment, and overwrite the return address with `win_flag_printer()` (`0x004011f6`).",
    flagFormat: "FLAG{st4ck_b0f_r3t2w1n_x86_64_pwn}",
    acceptedFlags: ["FLAG{st4ck_b0f_r3t2w1n_x86_64_pwn}", "CYBERLEARN{st4ck_b0f_r3t2w1n_x86_64_pwn}"],
    hints: [
      "Buffer size is 64 bytes + 8 bytes saved RBP = 72 bytes to reach the return address ($rip).",
      "If you encounter a SIGSEGV inside system() / printf(), insert a single `ret` gadget (`0x0040101a`) before `win()` to fix 16-byte stack alignment."
    ],
    tags: ["bof", "pwn", "x86_64", "gdb", "ret2win"],
    targetType: "bof",
    sourceCodeSnippet: `#include <stdio.h>\n#include <stdlib.h>\n\nvoid win() {\n    system("cat /flag.txt");\n}\n\nvoid vulnerable_function() {\n    char buffer[64];\n    printf("Enter exploit payload: ");\n    gets(buffer); // VULNERABILITY: Unbounded stack write\n}`
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
    description: "A corporate workstation was compromised via a weaponized Word document. Analyze the physical memory image (`workstation_dump.raw`) using Volatility 3, extract cached LSASS logon credentials, and recover the compromised Domain Admin password hash.",
    flagFormat: "FLAG{v0l4t1l1ty_ls4ss_ntlm_h4sh_dumpe}",
    acceptedFlags: ["FLAG{v0l4t1l1ty_ls4ss_ntlm_h4sh_dumpe}", "CYBERLEARN{v0l4t1l1ty_ls4ss_ntlm_h4sh_dumpe}"],
    hints: [
      "Run `vol -f workstation_dump.raw windows.hashdump.Hashdump` to parse SAM registry hives.",
      "Run `vol -f workstation_dump.raw windows.lsass.Lsass` to dump cleartext/NTLM credentials."
    ],
    tags: ["volatility", "memory-dump", "lsass", "dfir"],
    targetType: "forensics"
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
    description: "A developer made a commit with production AWS API keys, followed by an immediate 'delete secrets' commit. The public branch seems clean, but the orphaned dangling commits still exist in the `.git` objects database. Audit the repository to discover the leaked AWS secret key.",
    flagFormat: "FLAG{g1t_d4ngl1ng_c0mm1t_l34k3d_s3cr3t}",
    acceptedFlags: ["FLAG{g1t_d4ngl1ng_c0mm1t_l34k3d_s3cr3t}", "CYBERLEARN{g1t_d4ngl1ng_c0mm1t_l34k3d_s3cr3t}"],
    hints: [
      "Check the reflog history: `git reflog` or `git log --all --full-history`.",
      "Find unreachable blob objects with `git fsck --lost-found`."
    ],
    tags: ["git", "osint", "secret-leaks", "recon"],
    targetType: "osint"
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
  const [activeChallenge, setActiveChallenge] = useState<CTFChallenge | null>(null);
  
  // Interactive Arena State
  const [arenaTab, setArenaTab] = useState<"target" | "terminal" | "decoder" | "source">("target");
  const [flagInput, setFlagInput] = useState("");
  const [submissionFeedback, setSubmissionFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetStatus, setTargetStatus] = useState<"running" | "restarting" | "stopped">("running");
  const [targetTimer, setTargetTimer] = useState<number>(3540); // 59 mins
  const [unlockedHints, setUnlockedHints] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState(false);

  // Target Simulation State
  // 1. JWT Sim
  const [jwtHeader, setJwtHeader] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [jwtPayload, setJwtPayload] = useState('{\n  "user": "guest_user",\n  "role": "student",\n  "exp": 1893456000\n}');
  const [jwtSimOutput, setJwtSimOutput] = useState<string | null>(null);
  const [jwtIsForging, setJwtIsForging] = useState(false);

  // 2. SSTI Sim
  const [sstiInput, setSstiInput] = useState("{{ 7 * 7 }}");
  const [sstiOutput, setSstiOutput] = useState<string | null>(null);
  const [sstiIsSending, setSstiIsSending] = useState(false);

  // 3. SQLi Sim
  const [sqliInput, setSqliInput] = useState("1' AND 1=1--");
  const [sqliOutput, setSqliOutput] = useState<string | null>(null);

  // 4. Terminal Console State
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "[+] CTF Battle Sandbox Initialized.",
    "[+] Connected to 10.10.14.0/24 subnet.",
    "Type 'help' or 'exploit' to start analysis."
  ]);
  const [terminalCmd, setTerminalCmd] = useState("");

  // 5. Payload Transformer State
  const [decoderInput, setDecoderInput] = useState("");
  const [decoderOutput, setDecoderOutput] = useState("");

  // Load solved challenges from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cyberlearn_solved_ctf");
      if (stored) {
        setSolvedSet(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!activeChallenge || targetStatus !== "running") return;
    const interval = setInterval(() => {
      setTargetTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeChallenge, targetStatus]);

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
    setActiveChallenge(challenge);
    setFlagInput("");
    setSubmissionFeedback(null);
    setArenaTab("target");
    setTargetStatus("running");
    setTargetTimer(3540);

    // Reset challenge-specific playground states
    if (challenge.targetType === "jwt") {
      setJwtHeader('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
      setJwtPayload('{\n  "user": "guest_user",\n  "role": "student",\n  "exp": 1893456000\n}');
      setJwtSimOutput("HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  \"status\": \"authenticated\",\n  \"role\": \"student\",\n  \"message\": \"Welcome Guest! Only users with role 'admin' can access /secret/flag.\"\n}");
    } else if (challenge.targetType === "ssti") {
      setSstiInput("{{ 7 * 7 }}");
      setSstiOutput("HTTP/1.1 200 OK\nContent-Type: text/html\n\n<h2>Welcome to CyberLearn, 49!</h2>");
    } else if (challenge.targetType === "sqli") {
      setSqliInput("1' AND 1=1--");
      setSqliOutput("HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  \"found\": true,\n  \"item\": \"Cyber Defense Manual 2026\",\n  \"in_stock\": true\n}");
    }
  };

  const handleRestartTarget = () => {
    setTargetStatus("restarting");
    setTimeout(() => {
      setTargetStatus("running");
      setTargetTimer(3600);
    }, 1200);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge || !flagInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const cleanFlag = flagInput.trim();

    const isMatch = activeChallenge.acceptedFlags.some(
      (f) => f.toLowerCase() === cleanFlag.toLowerCase()
    );

    setTimeout(() => {
      setIsSubmitting(false);
      if (isMatch) {
        setSubmissionFeedback({
          success: true,
          msg: `🎉 Correct Flag Captured! +${activeChallenge.xp} XP points awarded to your rank.`
        });
        const updated = new Set(solvedSet);
        updated.add(activeChallenge.id);
        setSolvedSet(updated);
        try {
          localStorage.setItem("cyberlearn_solved_ctf", JSON.stringify(Array.from(updated)));
        } catch {}

        if (user?.email) {
          saveLabSolveToFirestore(user.email, activeChallenge.id, cleanFlag, activeChallenge.xp).catch(() => {});
        }
      } else {
        setSubmissionFeedback({
          success: false,
          msg: "❌ Incorrect flag payload. Verify your exploit execution and syntax format!"
        });
      }
    }, 400);
  };

  // JWT Exploit Execution Simulation
  const executeJwtExploit = () => {
    setJwtIsForging(true);
    setTimeout(() => {
      setJwtIsForging(false);
      try {
        const parsedHeader = JSON.parse(jwtHeader);
        const parsedPayload = JSON.parse(jwtPayload);

        if (parsedHeader.alg?.toLowerCase() === "none" && parsedPayload.role?.toLowerCase() === "admin") {
          setJwtSimOutput("HTTP/1.1 200 OK\nContent-Type: application/json\nAuthorization: Bearer Accepted (Algorithm: none)\n\n{\n  \"status\": \"success\",\n  \"authenticated\": true,\n  \"role\": \"admin\",\n  \"privileges\": [\"FLAG_READER\", \"SYSTEM_SUPERUSER\"],\n  \"flag\": \"FLAG{jwt_n0n3_4lg_byp4ss}\",\n  \"secret_key\": \"SYS_ADMIN_TOKEN_9981247\"\n}");
          setFlagInput("FLAG{jwt_n0n3_4lg_byp4ss}");
        } else if (parsedHeader.alg?.toLowerCase() === "none" && parsedPayload.role !== "admin") {
          setJwtSimOutput(`HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  \"status\": \"authenticated\",\n  \"role\": \"${parsedPayload.role || "student"}\",\n  \"message\": \"JWT algorithm 'none' accepted, but your role is not 'admin'. Change role to 'admin' to reveal flag.\"\n}`);
        } else {
          setJwtSimOutput("HTTP/1.1 401 Unauthorized\nContent-Type: application/json\n\n{\n  \"error\": \"Signature verification failed\",\n  \"reason\": \"Header algorithm is HS256 but provided signature does not match server secret.\"\n}");
        }
      } catch (err: any) {
        setJwtSimOutput(`HTTP/1.1 400 Bad Request\nContent-Type: application/json\n\n{\n  \"error\": \"Malformed JSON input: ${err.message}\"\n}`);
      }
    }, 500);
  };

  // SSTI Exploit Execution Simulation
  const executeSstiExploit = () => {
    setSstiIsSending(true);
    setTimeout(() => {
      setSstiIsSending(false);
      const input = sstiInput.trim();

      if (input.includes("popen") || input.includes("flag.txt") || input.includes("subclasses") || input.includes("os")) {
        setSstiOutput("HTTP/1.1 200 OK\nContent-Type: text/html\n\n<div class='output'>\n  <h3>Execution Results for subprocess.Popen('cat /secret/flag.txt'):</h3>\n  <pre style='color:#00ff88; font-weight:bold;'>FLAG{sst1_j1nj42_pyth0n_cl4ss_3sc4p3}</pre>\n</div>");
        setFlagInput("FLAG{sst1_j1nj42_pyth0n_cl4ss_3sc4p3}");
      } else if (input.includes("{{") && input.includes("}}")) {
        // Evaluate simple arithmetic like 7*7
        let evaluated = "Processed Template";
        if (input.includes("7*7") || input.includes("7 * 7")) evaluated = "49";
        else if (input.includes("config")) evaluated = "<Config {'ENV': 'production', 'DEBUG': False, 'SECRET_KEY': '***REDACTED***'}>";
        setSstiOutput(`HTTP/1.1 200 OK\nContent-Type: text/html\n\n<h2>Welcome to CyberLearn, ${evaluated}!</h2>`);
      } else {
        setSstiOutput(`HTTP/1.1 200 OK\nContent-Type: text/html\n\n<h2>Welcome to CyberLearn, ${input}!</h2>`);
      }
    }, 500);
  };

  // SQLi Exploit Execution Simulation
  const executeSqliExploit = () => {
    const query = sqliInput.trim();
    if (query.includes("admin_vault") || query.includes("secret") || (query.includes("SUBSTR") && query.includes("F"))) {
      setSqliOutput("HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  \"found\": true,\n  \"match\": true,\n  \"database_response\": \"Character matched condition!\",\n  \"extracted_flag\": \"FLAG{bl1nd_sql_b00l34n_3xtr4ct10n}\"\n}");
      setFlagInput("FLAG{bl1nd_sql_b00l34n_3xtr4ct10n}");
    } else if (query.includes("1=1") || query.includes("true") || query === "1") {
      setSqliOutput("HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  \"found\": true,\n  \"item\": \"Cyber Defense Manual 2026\",\n  \"in_stock\": true\n}");
    } else {
      setSqliOutput("HTTP/1.1 404 Not Found\nContent-Type: application/json\n\n{\n  \"found\": false,\n  \"error\": \"No item matches the given filter query.\"\n}");
    }
  };

  // Terminal Command Execution
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalCmd.trim()) return;

    const cmd = terminalCmd.trim();
    const newHistory = [...terminalHistory, `$ ${cmd}`];

    if (cmd === "help") {
      newHistory.push("Available commands: curl, nmap, exploit, cat flag.txt, base64, xxd, clear, id, whoami");
    } else if (cmd === "clear") {
      setTerminalHistory([]);
      setTerminalCmd("");
      return;
    } else if (cmd.startsWith("curl") || cmd.startsWith("exploit") || cmd.includes("attack")) {
      newHistory.push("[*] Sending payload to target host...");
      newHistory.push("[+] 200 OK: Target compromised.");
      if (activeChallenge) {
        newHistory.push(`[+] Captured Flag: ${activeChallenge.flagFormat}`);
        setFlagInput(activeChallenge.flagFormat);
      }
    } else if (cmd === "whoami" || cmd === "id") {
      newHistory.push("uid=1000(hacker) gid=1000(hacker) groups=1000(hacker),27(sudo)");
    } else if (cmd.includes("cat") && cmd.includes("flag")) {
      if (activeChallenge) {
        newHistory.push(activeChallenge.flagFormat);
        setFlagInput(activeChallenge.flagFormat);
      }
    } else {
      newHistory.push(`bash: ${cmd}: command executed. Output returned.`);
    }

    setTerminalHistory(newHistory);
    setTerminalCmd("");
  };

  // CyberChef Decoder Transformers
  const handleDecode = (type: "b64_dec" | "b64_enc" | "hex_dec" | "rot13" | "url_dec") => {
    try {
      if (type === "b64_dec") {
        setDecoderOutput(atob(decoderInput));
      } else if (type === "b64_enc") {
        setDecoderOutput(btoa(decoderInput));
      } else if (type === "rot13") {
        setDecoderOutput(
          decoderInput.replace(/[a-zA-Z]/g, (c) => {
            const code = c.charCodeAt(0);
            return String.fromCharCode(
              code >= 97 ? ((code - 97 + 13) % 26) + 97 : ((code - 65 + 13) % 26) + 65
            );
          })
        );
      } else if (type === "url_dec") {
        setDecoderOutput(decodeURIComponent(decoderInput));
      } else if (type === "hex_dec") {
        const clean = decoderInput.replace(/\s+/g, "");
        let str = "";
        for (let i = 0; i < clean.length; i += 2) {
          str += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
        }
        setDecoderOutput(str);
      }
    } catch (e: any) {
      setDecoderOutput(`Transformation error: ${e.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // =========================================================================
  // VIEW 1: DEDICATED CTF BATTLE ARENA (WHEN A CHALLENGE IS OPEN)
  // =========================================================================
  if (activeChallenge) {
    const isSolved = solvedSet.has(activeChallenge.id);

    return (
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveChallenge(null)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to CTF Board
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">{activeChallenge.title}</h1>
                <Badge variant="primary" size="sm">
                  {activeChallenge.category}
                </Badge>
                <Badge variant={difficultyColor[activeChallenge.difficulty]} size="sm">
                  {activeChallenge.difficulty}
                </Badge>
                {isSolved && (
                  <Badge variant="success" size="sm" className="font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> SOLVED
                  </Badge>
                )}
              </div>
              <p className="text-xs text-foreground-muted font-mono">
                Author: <span className="text-foreground">{activeChallenge.author}</span> • First Blood:{" "}
                <span className="text-warning">🩸 {activeChallenge.firstBloodBy}</span>
              </p>
            </div>
          </div>

          {/* Target Instance Controller */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-border text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-foreground-secondary">Instance Active</span>
              <span className="text-warning font-bold">{formatTimer(targetTimer)}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRestartTarget}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Restart Target Container"
            />
          </div>
        </div>

        {/* Split Screen Workspace (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (5 Cols) - Mission Briefing, Hints, Flag Submission */}
          <div className="lg:col-span-5 space-y-4">
            {/* Mission Intel Card */}
            <Card padding="lg" className="space-y-4 border-primary/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Mission Briefing</span>
                </h3>
                <span className="font-mono text-xs text-primary font-bold">+{activeChallenge.xp} XP</span>
              </div>

              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed bg-surface-elevated p-3.5 rounded-xl border border-border">
                {activeChallenge.description}
              </p>

              {/* Target Endpoint Box */}
              {activeChallenge.targetHost && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-foreground-muted uppercase">
                    Target URL / Host Address:
                  </label>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-primary/30 font-mono text-xs text-primary flex items-center justify-between">
                    <span className="truncate">{activeChallenge.targetHost}</span>
                    <button
                      onClick={() => copyToClipboard(activeChallenge.targetHost!)}
                      className="text-foreground-muted hover:text-foreground p-1"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {activeChallenge.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-elevated border border-border text-foreground-muted"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Socratic Hints Dropdown */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground-secondary flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-accent" />
                    <span>Hints &amp; Guidance</span>
                  </span>
                  <button
                    onClick={() => setUnlockedHints((prev) => ({ ...prev, [activeChallenge.id]: !prev[activeChallenge.id] }))}
                    className="text-xs font-mono text-primary hover:underline cursor-pointer"
                  >
                    {unlockedHints[activeChallenge.id] ? "Hide Hints" : "View Hints"}
                  </button>
                </div>

                {unlockedHints[activeChallenge.id] && (
                  <div className="space-y-2 p-3 rounded-xl bg-surface-elevated border border-border">
                    {activeChallenge.hints.map((hint, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-foreground-secondary">
                        <span className="font-mono text-primary font-bold">[{idx + 1}]</span>
                        <span>{hint}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Glowing Flag Submission Terminal */}
            <Card padding="lg" className="space-y-3 bg-surface border-primary/40 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-bold text-foreground flex items-center gap-2">
                  <Flag className="w-4 h-4 text-primary animate-pulse" />
                  <span>SUBMIT CAPTURED FLAG:</span>
                </label>
                <span className="text-[11px] font-mono text-foreground-muted">
                  Format: <code className="text-foreground">FLAG&#123;...&#125;</code>
                </span>
              </div>

              <form onSubmit={handleFlagSubmit} className="space-y-2">
                <input
                  type="text"
                  placeholder="FLAG{...} or CYBERLEARN{...}"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-surface-elevated border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={isSubmitting || !flagInput.trim()}
                  className="font-bold shadow-lg text-xs font-mono"
                >
                  {isSubmitting ? "Verifying Flag..." : "Submit Flag to Server"}
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
            </Card>
          </div>

          {/* Right Column (7 Cols) - Interactive Attack Console & Tooling */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
              <button
                onClick={() => setArenaTab("target")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                  arenaTab === "target"
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Interactive Target Sandbox</span>
              </button>

              <button
                onClick={() => setArenaTab("terminal")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                  arenaTab === "terminal"
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>CTF Attack Terminal</span>
              </button>

              <button
                onClick={() => setArenaTab("decoder")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                  arenaTab === "decoder"
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                <Binary className="w-3.5 h-3.5" />
                <span>Payload Decoder</span>
              </button>

              {activeChallenge.sourceCodeSnippet && (
                <button
                  onClick={() => setArenaTab("source")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                    arenaTab === "source"
                      ? "bg-primary text-white shadow-md"
                      : "bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Vulnerable Source</span>
                </button>
              )}
            </div>

            {/* TAB 1: INTERACTIVE TARGET SANDBOX */}
            {arenaTab === "target" && (
              <Card padding="lg" className="min-h-[480px] flex flex-col justify-between space-y-4">
                {/* 1. JWT Target */}
                {activeChallenge.targetType === "jwt" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4" />
                        <span>Live JWT Token Forger &amp; Auth Tester</span>
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={executeJwtExploit}
                        disabled={jwtIsForging}
                        icon={<Send className="w-3.5 h-3.5" />}
                        className="font-mono text-xs"
                      >
                        {jwtIsForging ? "Dispatching..." : "Send Forged Request"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-foreground-muted">JWT Header (JSON)</label>
                        <textarea
                          rows={4}
                          value={jwtHeader}
                          onChange={(e) => setJwtHeader(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-surface-elevated font-mono text-xs text-primary border border-border focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-foreground-muted">JWT Payload Claims (JSON)</label>
                        <textarea
                          rows={4}
                          value={jwtPayload}
                          onChange={(e) => setJwtPayload(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-surface-elevated font-mono text-xs text-foreground border border-border focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-foreground-muted">Live Server Response</label>
                      <pre className="p-3.5 rounded-xl bg-black/60 font-mono text-xs text-success border border-border overflow-x-auto min-h-[140px] whitespace-pre-wrap">
                        {jwtSimOutput}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 2. SSTI Target */}
                {activeChallenge.targetType === "ssti" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
                        <Globe className="w-4 h-4" />
                        <span>Flask Dynamic Jinja2 Template Injection Console</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-foreground-muted">GET /preview?name=</span>
                      <input
                        type="text"
                        value={sstiInput}
                        onChange={(e) => setSstiInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs font-mono bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={executeSstiExploit}
                        disabled={sstiIsSending}
                        icon={<Play className="w-3.5 h-3.5" />}
                        className="font-mono text-xs"
                      >
                        Execute
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-foreground-muted">Rendered HTML Output</label>
                      <pre className="p-3.5 rounded-xl bg-black/60 font-mono text-xs text-success border border-border overflow-x-auto min-h-[160px] whitespace-pre-wrap">
                        {sstiOutput}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 3. SQLi Target */}
                {activeChallenge.targetType === "sqli" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
                        <Search className="w-4 h-4" />
                        <span>Blind Boolean Database Query Inspector</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-foreground-muted">GET /api/items?id=</span>
                      <input
                        type="text"
                        value={sqliInput}
                        onChange={(e) => setSqliInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs font-mono bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={executeSqliExploit}
                        icon={<Play className="w-3.5 h-3.5" />}
                        className="font-mono text-xs"
                      >
                        Query
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-foreground-muted">API Boolean State Output</label>
                      <pre className="p-3.5 rounded-xl bg-black/60 font-mono text-xs text-success border border-border overflow-x-auto min-h-[160px] whitespace-pre-wrap">
                        {sqliOutput}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 4. Crypto / General Target */}
                {(activeChallenge.targetType === "crypto" || activeChallenge.targetType === "bof" || activeChallenge.targetType === "forensics" || activeChallenge.targetType === "osint") && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-surface-elevated border border-primary/30 space-y-2">
                      <h4 className="text-xs font-mono font-bold text-primary uppercase">Interception Artifacts &amp; Parameters</h4>
                      <p className="text-xs text-foreground-secondary">
                        Target endpoint is listening on <code className="text-primary font-mono">{activeChallenge.targetHost || "10.10.14.88:1337"}</code>.
                      </p>
                      <div className="p-3 rounded-lg bg-black/50 font-mono text-xs text-foreground space-y-1">
                        <div>$ nc 10.10.14.88 1337</div>
                        <div className="text-foreground-muted">[+] Service Ready. Send your solver payload or buffer stream.</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
                      <h4 className="text-xs font-mono font-bold text-foreground uppercase">Recommended Next Steps</h4>
                      <ul className="text-xs text-foreground-secondary space-y-1 list-disc pl-4">
                        <li>Switch to the <strong>CTF Attack Terminal</strong> tab to interact directly with the listener.</li>
                        <li>Use the <strong>Payload Decoder</strong> tab to transform binary hashes, Base64 chunks, or Hex streams.</li>
                        <li>Extract the flag and enter it in the flag terminal on the left panel!</li>
                      </ul>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* TAB 2: CTF ATTACK TERMINAL */}
            {arenaTab === "terminal" && (
              <Card padding="none" className="min-h-[480px] bg-[#0c101c] border-primary/30 rounded-xl overflow-hidden flex flex-col justify-between">
                <div className="p-3 bg-surface-elevated border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-foreground">
                    <TerminalIcon className="w-3.5 h-3.5 text-primary" />
                    <span>hacker@cyberlearn-box:~</span>
                  </div>
                  <span className="text-[10px] font-mono text-foreground-muted">x86_64 Linux Shell</span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-1.5 font-mono text-xs text-success min-h-[350px]">
                  {terminalHistory.map((line, idx) => (
                    <div key={idx} className={line.startsWith("$") ? "text-primary font-bold" : "text-success/90"}>
                      {line}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleTerminalSubmit} className="p-2.5 bg-black/60 border-t border-border flex items-center gap-2">
                  <span className="text-primary font-mono font-bold text-xs pl-2">$</span>
                  <input
                    type="text"
                    value={terminalCmd}
                    onChange={(e) => setTerminalCmd(e.target.value)}
                    placeholder="curl -X POST http://10.10.14.88:8080 -d 'payload'..."
                    className="flex-1 bg-transparent text-xs font-mono text-foreground focus:outline-none"
                  />
                  <Button type="submit" variant="primary" size="sm" className="font-mono text-xs">
                    Run
                  </Button>
                </form>
              </Card>
            )}

            {/* TAB 3: CYBER PAYLOAD DECODER */}
            {arenaTab === "decoder" && (
              <Card padding="lg" className="min-h-[480px] space-y-4">
                <h3 className="text-xs font-mono font-bold text-primary uppercase flex items-center gap-1.5">
                  <Binary className="w-4 h-4" />
                  <span>CyberChef-Style Payload Transformer</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-foreground-muted">Input Data</label>
                  <textarea
                    rows={4}
                    value={decoderInput}
                    onChange={(e) => setDecoderInput(e.target.value)}
                    placeholder="Enter Base64, Hex, URL, or ciphertext string..."
                    className="w-full p-2.5 rounded-xl bg-surface-elevated font-mono text-xs text-foreground border border-border focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDecode("b64_dec")} className="font-mono text-xs">
                    Base64 Decode
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDecode("b64_enc")} className="font-mono text-xs">
                    Base64 Encode
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDecode("hex_dec")} className="font-mono text-xs">
                    Hex to ASCII
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDecode("rot13")} className="font-mono text-xs">
                    ROT13
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDecode("url_dec")} className="font-mono text-xs">
                    URL Decode
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-foreground-muted">Transformed Output</label>
                  <textarea
                    rows={4}
                    readOnly
                    value={decoderOutput}
                    placeholder="Decoded plaintext will appear here..."
                    className="w-full p-2.5 rounded-xl bg-black/50 font-mono text-xs text-success border border-border"
                  />
                </div>
              </Card>
            )}

            {/* TAB 4: VULNERABLE SOURCE CODE */}
            {arenaTab === "source" && activeChallenge.sourceCodeSnippet && (
              <Card padding="none" className="min-h-[480px] bg-[#0c101c] border-border rounded-xl overflow-hidden flex flex-col">
                <div className="p-3 bg-surface-elevated border-b border-border flex items-center justify-between">
                  <span className="text-xs font-mono text-primary font-bold">Vulnerable Implementation Code</span>
                  <span className="text-[10px] font-mono text-foreground-muted">Audit for flaws</span>
                </div>
                <pre className="p-4 flex-1 overflow-auto font-mono text-xs text-primary/90 leading-relaxed">
                  {activeChallenge.sourceCodeSnippet}
                </pre>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CTF CHALLENGES JEOPARDY BOARD (GRID SELECTION)
  // =========================================================================
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
              Competitive flag hunting arena. Exploit live targets, forge tokens, reverse ciphers, and capture flags for global leaderboard rank.
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
    </div>
  );
}
