"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Terminal as TerminalIcon,
  RotateCcw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Play,
  Shield,
  ZoomIn,
  ZoomOut,
  Flame,
  Globe,
  Radio,
  Lock,
  Skull,
  Crosshair,
  Zap,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";

interface TerminalWorkbenchProps {
  sessionId: string;
  labId: string;
}

export default function TerminalWorkbench({ sessionId, labId }: TerminalWorkbenchProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const coldStartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Virtual Shell State (Always active with instant 0ms keystroke response)
  const currentPathRef = useRef<string[]>([labId || "linux-navigation"]);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentInputRef = useRef<string>("");
  const isVirtualModeRef = useRef<boolean>(true);
  const virtualFilesRef = useRef<Record<string, string>>({});

  const [connectionStatus, setConnectionStatus] = useState<"connected" | "virtual" | "connecting">("virtual");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedHelper, setCopiedHelper] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(14);

  // Compute WebSocket URL from environment
  const getWebSocketUrl = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let wsBase = apiUrl.trim();
    if (wsBase.endsWith("/")) {
      wsBase = wsBase.slice(0, -1);
    }
    if (wsBase.startsWith("https://")) {
      wsBase = wsBase.replace("https://", "wss://");
    } else if (wsBase.startsWith("http://")) {
      wsBase = wsBase.replace("http://", "ws://");
    } else if (!wsBase.startsWith("ws://") && !wsBase.startsWith("wss://")) {
      wsBase = `ws://${wsBase}`;
    }

    const sid = encodeURIComponent(sessionId || `session-${labId}`);
    const lid = encodeURIComponent(labId);
    return `${wsBase}/labs/${sid}/terminal/ws?lab_id=${lid}`;
  }, [sessionId, labId]);

  // Initial banner with authentic Kali ASCII art
  const printBanner = (term: any) => {
    term.write("\x1b[38;5;39m");
    term.write("  ██████╗██╗   ██╗██████╗ ███████╗██████╗ ██╗     ███████╗ █████╗ ██████╗ ███╗   ██╗\r\n");
    term.write(" ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██║     ██╔════╝██╔══██╗██╔══██╗████╗  ██║\r\n");
    term.write(" ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     █████╗  ███████║██████╔╝██╔██╗ ██║\r\n");
    term.write(" ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══╝  ██╔══██║██╔══██╗██║╚██╗██║\r\n");
    term.write(" ╚██████╗   ██║   ██████╔╝███████╗██║  ██║███████╗███████╗██║  ██║██║  ██║██║ ╚████║\r\n");
    term.write("  ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝\r\n");
    term.write("\x1b[0m\r\n");
    term.write("\x1b[1;32m [✓] CyberLearn Interactive Linux Practice Terminal & Attack Station\x1b[0m\r\n");
    term.write(`\x1b[90m [*] Target Workspace: /home/student/labs/${labId}\x1b[0m\r\n`);
    term.write("\x1b[90m [*] Type '\x1b[33mattack\x1b[90m', '\x1b[33mnmap\x1b[90m', '\x1b[33msqlmap\x1b[90m', '\x1b[33mcat flag.txt\x1b[90m', or '\x1b[33mhelp\x1b[90m'.\x1b[0m\r\n\r\n");
  };

  const getPrompt = useCallback(() => {
    const cwd = currentPathRef.current.length > 0 ? `~/labs/${currentPathRef.current.join("/")}` : "~";
    return `\x1b[1;34m┌──(\x1b[1;32mstudent㉿cyberlearn\x1b[1;34m)-[\x1b[1;37m${cwd}\x1b[1;34m]\r\n└─\x1b[1;32m$\x1b[0m `;
  }, []);

  // Initialize or get Virtual Filesystem
  const getVirtualFiles = useCallback(() => {
    if (Object.keys(virtualFilesRef.current).length > 0) {
      return virtualFilesRef.current;
    }

    const files: Record<string, string> = {
      "README.txt": `=====================================================
  CYBERLEARN INTERACTIVE LAB: ${labId.toUpperCase()}
=====================================================
Welcome to your practice sandbox terminal & offensive station.

Recommended Attack & Exploration Workflow:
  1. Explore filesystem:    ls -la, pwd, whoami, id
  2. Run automatic attack:  attack (or exploit)
  3. Inspect targets:       nmap -sV 10.10.14.55
  4. Web scanning:          nikto -h http://10.10.14.55
  5. SQL injection exploit: sqlmap -u "http://10.10.14.55/login" --dump
  6. SSH brute-force:       hydra -l admin -P rockyou.txt 10.10.14.55 ssh
  7. Read secret flag:      cat flag.txt

Submit the extracted flag in the verification bar below to claim XP!
=====================================================`,
      "flag.txt": `FLAG{${labId.replace(/-/g, "_")}_expert_flag_2026}`,
      "notes.txt": `[CONFIDENTIAL SECURITY REPORT]
Host: 10.10.14.55 (Vulnerable Target Server)
Open Ports: 22 (SSH), 80 (HTTP), 3306 (MySQL)
Vulnerabilities: Authentication Bypass (SQLi), Weak SSH Passwords`,
      "exploit.py": `#!/usr/bin/env python3
# Automated Exploit Payload Runner
import sys

print("[+] Initializing exploit sequence against target 10.10.14.55...")
print("[*] Sending malicious SQL injection payload: admin' OR '1'='1...")
print("[✓] SUCCESS! Authentication bypassed.")
print("[!] Extracted Flag: FLAG{sql_injection_bypass_pwned_2026}")
`,
      "rockyou.txt": "admin\npassword\n123456\nroot\ntoortoor\ncyberlearn\nsecret123\nPassword123!\n",
      "target_schema.sql": "-- Leaked database dump\nCREATE TABLE users (id INT, username VARCHAR(50), password_hash VARCHAR(255));\nINSERT INTO users VALUES (1, 'admin', '$2b$12$FLAG{hash_cracked_admin_secret}');\n",
    };

    if (labId.includes("packet") || labId.includes("network")) {
      files["capture.pcap"] = "10.10.14.5 -> 10.10.14.55 TCP SYN 80\n10.10.14.5 -> 10.10.14.55 POST /login user=admin pass=FLAG{packet_sniffed_credentials_2026}";
    }

    virtualFilesRef.current = files;
    return files;
  }, [labId]);

  // Execute offensive & defensive commands in built-in Virtual Linux Shell
  const executeVirtualCommand = useCallback((cmdStr: string, term: any) => {
    const trimmed = cmdStr.trim();
    const parts = trimmed.split(" ").filter(Boolean);
    const cmd = parts[0] || "";
    const args = parts.slice(1);
    const files = getVirtualFiles();

    if (!cmd) {
      term.write("\r\n" + getPrompt());
      return;
    }

    term.write("\r\n");

    switch (cmd.toLowerCase()) {
      case "clear":
      case "cls":
        term.clear();
        term.write(getPrompt());
        return;

      case "attack":
      case "pwn":
      case "exploit":
      case "hack":
      case "autoattack":
        term.write("\x1b[1;31m[*] ==========================================================\x1b[0m\r\n");
        term.write("\x1b[1;31m[*]       CYBERLEARN AUTOMATED EXPLOITATION FRAMEWORK         \x1b[0m\r\n");
        term.write("\x1b[1;31m[*] ==========================================================\x1b[0m\r\n");
        term.write("\x1b[36m[+] Target Host: 10.10.14.55 (Target Server)\x1b[0m\r\n");
        term.write("\x1b[33m[*] Phase 1: Port Discovery...\x1b[0m\r\n");
        term.write("    - 22/tcp  (OpenSSH 8.9p1)\r\n");
        term.write("    - 80/tcp  (Apache HTTP Server 2.4.52)\r\n");
        term.write("    - 3306/tcp (MySQL Database Engine)\r\n");
        term.write("\x1b[33m[*] Phase 2: Injecting Exploits...\x1b[0m\r\n");
        term.write("    [✓] SQL Injection: admin' OR '1'='1 (Bypassed auth on /login)\r\n");
        term.write("    [✓] Privilege Escalation: Sudo misconfiguration exploited (UID 0 root)\r\n");
        term.write("    [✓] Memory Dump: Extracted system flags from memory\r\n\r\n");
        term.write(`\x1b[1;32m[🏆 SUCCESS] Target Compromised! Flag Recovered:\x1b[0m\r\n`);
        term.write(`\x1b[1;33m    >>> \x1b[1;31mFLAG{${labId.replace(/-/g, "_")}_expert_flag_2026}\x1b[1;33m <<<\x1b[0m\r\n\r\n`);
        term.write("\x1b[90m[*] Copy the flag above and paste it into the 'Submit Lab Flag' bar below!\x1b[0m\r\n");
        break;

      case "help":
      case "man":
        term.write("\x1b[1;36m┌── Available Linux & Offensive Cyber Commands ─────────────────────────────┐\x1b[0m\r\n");
        term.write("│ \x1b[1;31mattack\x1b[0m / \x1b[1;31mexploit\x1b[0m    - Run automated multi-stage penetration test against target │\r\n");
        term.write("│ \x1b[1;33mnmap\x1b[0m [target]       - Network port scan & service detection (e.g. nmap 10.10.14) │\r\n");
        term.write("│ \x1b[1;33msqlmap\x1b[0m -u <url>     - Automatic SQL injection and database dump           │\r\n");
        term.write("│ \x1b[1;33mhydra\x1b[0m -l <usr> -P <w> - Multi-protocol network login brute-forcer           │\r\n");
        term.write("│ \x1b[1;33mnikto\x1b[0m -h <host>     - Web server vulnerability scanner                    │\r\n");
        term.write("│ \x1b[1;33mgobuster\x1b[0m / \x1b[1;33mdirb\x1b[0m     - Web directory and file brute-forcer                 │\r\n");
        term.write("│ \x1b[1;33mls\x1b[0m [-la]            - List files and directories in current workspace     │\r\n");
        term.write("│ \x1b[1;33mcat\x1b[0m <file>          - Display contents of files (e.g. cat flag.txt)       │\r\n");
        term.write("│ \x1b[1;33mpython3\x1b[0m <script>    - Execute Python security scripts (e.g. exploit.py)   │\r\n");
        term.write("│ \x1b[1;33mcurl\x1b[0m [url]          - HTTP request inspector and payload repeater         │\r\n");
        term.write("│ \x1b[1;33mping\x1b[0m <host>         - Send ICMP network echo probes                       │\r\n");
        term.write("│ \x1b[1;33mnc\x1b[0m / \x1b[1;33mnetcat\x1b[0m         - TCP port listener & arbitrary connection client     │\r\n");
        term.write("│ \x1b[1;33mwhoami\x1b[0m / \x1b[1;33mid\x1b[0m         - Print active user identity and privilege groups     │\r\n");
        term.write("│ \x1b[1;33mpwd\x1b[0m / \x1b[1;33mcd\x1b[0m            - Display and change directory paths                  │\r\n");
        term.write("│ \x1b[1;33mgrep\x1b[0m / \x1b[1;33mfind\x1b[0m          - Search strings and locate files in filesystem       │\r\n");
        term.write("│ \x1b[1;33mbase64\x1b[0m <string>     - Encode or decode base64 hashes                      │\r\n");
        term.write("│ \x1b[1;33mclear\x1b[0m / \x1b[1;33mhistory\x1b[0m     - Clear terminal buffer or view command history       │\r\n");
        term.write("\x1b[1;36m└───────────────────────────────────────────────────────────────────────────┘\x1b[0m\r\n");
        break;

      case "ls":
      case "dir":
      case "ll":
        const showAll = args.includes("-la") || args.includes("-a") || args.includes("-l") || cmd.toLowerCase() === "dir" || cmd.toLowerCase() === "ll";
        if (showAll) {
          term.write("total 48\r\n");
          term.write("drwxr-xr-x 4 student student 4096 Sep  2 01:50 .\r\n");
          term.write("drwxr-xr-x 3 student student 4096 Sep  2 01:50 ..\r\n");
          term.write("-rw-r--r-- 1 student student  240 Sep  2 01:50 .bashrc\r\n");
          term.write("-rw------- 1 student student  890 Sep  2 01:50 .history\r\n");
          Object.keys(files).forEach((fname) => {
            const isExec = fname.endsWith(".sh") || fname.endsWith(".py");
            const isFlag = fname.includes("flag");
            const color = isExec ? "\x1b[1;32m" : isFlag ? "\x1b[1;31m" : "\x1b[0m";
            const perms = isExec ? "-rwxr-xr-x" : "-rw-r--r--";
            const size = files[fname].length;
            term.write(`${perms} 1 student student ${size.toString().padStart(5, " ")} Sep  2 01:50 ${color}${fname}\x1b[0m\r\n`);
          });
        } else {
          const list = Object.keys(files)
            .map((fname) => {
              const isExec = fname.endsWith(".sh") || fname.endsWith(".py");
              const isFlag = fname.includes("flag");
              const color = isExec ? "\x1b[1;32m" : isFlag ? "\x1b[1;31m" : "\x1b[0m";
              return `${color}${fname}\x1b[0m`;
            })
            .join("  ");
          term.write(list + "\r\n");
        }
        break;

      case "cat":
      case "more":
      case "less":
      case "head":
      case "tail":
        if (args.length === 0) {
          term.write("Available files in this directory:\r\n");
          Object.keys(files).forEach((f) => term.write(`  - ${f}\r\n`));
          term.write("\x1b[90mUsage: cat <filename> (e.g. cat flag.txt)\x1b[0m\r\n");
        } else {
          const fname = args[0];
          if (files[fname]) {
            term.write(files[fname].replace(/\n/g, "\r\n") + "\r\n");
          } else {
            term.write(`\x1b[31mcat: ${fname}: No such file or directory\x1b[0m\r\n`);
            term.write("Available files: " + Object.keys(files).join(", ") + "\r\n");
          }
        }
        break;

      case "nmap":
        const targetHost = args.find((a) => !a.startsWith("-")) || "10.10.14.55";
        term.write(`\x1b[36mStarting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString()}\x1b[0m\r\n`);
        term.write(`Initiating SYN Stealth Scan against ${targetHost}...\r\n`);
        term.write(`Scanning ${targetHost} [1000 ports]\r\n`);
        term.write("Discovered open port 22/tcp on 10.10.14.55\r\n");
        term.write("Discovered open port 80/tcp on 10.10.14.55\r\n");
        term.write("Discovered open port 3306/tcp on 10.10.14.55\r\n");
        term.write("Completed SYN Stealth Scan in 0.85s (1000 total ports)\r\n\r\n");
        term.write("PORT     STATE SERVICE VERSION\r\n");
        term.write("\x1b[1;32m22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu (password auth enabled)\x1b[0m\r\n");
        term.write("\x1b[1;32m80/tcp   open  http    Apache/2.4.52 (Ubuntu) CyberLearn Target Portal\x1b[0m\r\n");
        term.write("\x1b[1;32m3306/tcp open  mysql   MySQL 8.0.36 (Vulnerable auth plugin)\x1b[0m\r\n\r\n");
        term.write("Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel\r\n");
        term.write("\x1b[1;33m[!] Vulnerability Note: Port 80 /login is vulnerable to SQL injection bypass.\x1b[0m\r\n");
        term.write("Nmap done: 1 IP address (1 host up) scanned in 1.42 seconds\r\n");
        break;

      case "sqlmap":
        term.write("\x1b[31m        ___     \r\n");
        term.write("       __H__    \r\n");
        term.write(" ___ ___[\"]_____ ___ ___  {1.7.11#stable}\r\n");
        term.write("|_ -| . [,]     | .'| . |\r\n");
        term.write("|___|_  [\"]_|_|_|__,|  _|\r\n");
        term.write("      |_|[*]        |_|   https://sqlmap.org\x1b[0m\r\n\r\n");
        term.write("[*] starting @ 02:10:00 /2026-09-02/\r\n");
        term.write("[*] testing connection to the target URL: http://10.10.14.55/login\r\n");
        term.write("[+] target URL is active and responding (200 OK)\r\n");
        term.write("[*] testing parameter 'username' for boolean-based blind SQL injection...\r\n");
        term.write("[*] GET parameter 'username' is vulnerable!\r\n");
        term.write("\x1b[1;32m[+] Parameter: username (GET / POST)\r\n");
        term.write("    Type: boolean-based blind / stacked queries\r\n");
        term.write("    Title: MySQL >= 5.0.12 stacked queries\r\n");
        term.write("    Payload: username=admin' OR 1=1--\x1b[0m\r\n\r\n");
        term.write("[*] fetching database table contents: 'cyberlearn_db.users'...\r\n");
        term.write("+----+----------+------------------------------------------------+\r\n");
        term.write("| id | username | password_hash                                  |\r\n");
        term.write("+----+----------+------------------------------------------------+\r\n");
        term.write(`| 1  | admin    | \x1b[1;31mFLAG{sqlmap_automated_database_dump_2026}\x1b[0m     |\r\n`);
        term.write("+----+----------+------------------------------------------------+\r\n");
        term.write("[+] Database dumped successfully (1 entry recovered).\r\n");
        break;

      case "hydra":
        term.write("\x1b[36mHydra v9.5 (c) 2026 by van Hauser / THC - Please do not use in military or secret service orgs!\x1b[0m\r\n");
        term.write("[DATA] max 16 tasks per target, 1 target, 8 passwords in dictionary, ~8 total attempts\r\n");
        term.write("[STATUS] attack started for SSH on 10.10.14.55:22\r\n");
        term.write("[ATTEMPT] 10.10.14.55:22 - login: admin - pass: password (failed)\r\n");
        term.write("[ATTEMPT] 10.10.14.55:22 - login: admin - pass: 123456 (failed)\r\n");
        term.write("[ATTEMPT] 10.10.14.55:22 - login: admin - pass: root (failed)\r\n");
        term.write(`\x1b[1;32m[22][ssh] host: 10.10.14.55   login: admin   password: Password123!   \x1b[1;31m[FLAG{hydra_ssh_bruteforce_pwnd_2026}]\x1b[0m\r\n`);
        term.write("[STATUS] 1 valid password found in 0.44 seconds.\r\n");
        break;

      case "nikto":
        term.write("\x1b[36m- Nikto v2.5.0\x1b[0m\r\n");
        term.write("+ Target IP:          10.10.14.55\r\n");
        term.write("+ Target Hostname:    target.cyberlearn.local\r\n");
        term.write("+ Target Port:        80\r\n");
        term.write("+ Start Time:         2026-09-02 02:10:15 (GMT)\r\n");
        term.write("---------------------------------------------------------------------------\r\n");
        term.write("+ Server: Apache/2.4.52 (Ubuntu)\r\n");
        term.write("+ /: The anti-clickjacking X-Frame-Options header is not present.\r\n");
        term.write("+ /: The X-Content-Type-Options header is not set.\r\n");
        term.write("\x1b[1;32m+ /admin/: Admin login portal discovered with default credentials.\x1b[0m\r\n");
        term.write("\x1b[1;32m+ /flag.txt: Sensitive file exposed in web root directory!\x1b[0m\r\n");
        term.write("+ 7915 requests: 0 error(s) and 4 item(s) reported on remote host\r\n");
        break;

      case "gobuster":
      case "dirb":
      case "dirbuster":
        term.write("\x1b[36m===============================================================\r\n");
        term.write("Gobuster v3.6 - Directory & File Brute-Forcing\r\n");
        term.write("===============================================================\r\n");
        term.write("[+] Url:                     http://10.10.14.55\r\n");
        term.write("[+] Threads:                 10\r\n");
        term.write("[+] Wordlist:                /usr/share/wordlists/dirb/common.txt\r\n");
        term.write("===============================================================\x1b[0m\r\n");
        term.write("/index.html          (Status: 200) [Size: 1042]\r\n");
        term.write("/login               (Status: 200) [Size: 3410]\r\n");
        term.write("/admin               (Status: 301) [Size: 178] --> /admin/\r\n");
        term.write("/assets              (Status: 301) [Size: 178] --> /assets/\r\n");
        term.write("\x1b[1;32m/flag.txt            (Status: 200) [Size: 48]\x1b[0m\r\n");
        term.write("/secret_backup.zip   (Status: 200) [Size: 84201]\r\n");
        term.write("===============================================================\r\n");
        term.write("Progress: 4614 / 4614 (100.00%)\r\n");
        break;

      case "python":
      case "python3":
        if (args.length > 0) {
          const fname = args[0];
          if (files[fname]) {
            term.write(`\x1b[36m[Python 3.11.0] Running ${fname}...\x1b[0m\r\n`);
            term.write("[+] Initializing exploit sequence against target 10.10.14.55...\r\n");
            term.write("[*] Sending malicious SQL injection payload: admin' OR '1'='1...\r\n");
            term.write("[✓] SUCCESS! Authentication bypassed.\r\n");
            term.write(`\x1b[1;31m[!] Extracted Flag: FLAG{${labId}_exploit_executed_2026}\x1b[0m\r\n`);
          } else {
            term.write(`python3: can't open file '${fname}': [Errno 2] No such file or directory\r\n`);
          }
        } else {
          term.write("Python 3.11.0 (main, Sep  2 2026, 01:50:00) [GCC 11.2.0] on linux\r\nType \"help\", \"copyright\", \"credits\" or \"license\" for more information.\r\n>>> print('CyberLearn Python Sandbox Active')\r\nCyberLearn Python Sandbox Active\r\n");
        }
        break;

      case "curl":
      case "wget":
        const url = args[0] || "http://10.10.14.55/login";
        term.write(`\x1b[36m[*] Connecting to ${url}...\x1b[0m\r\n`);
        term.write("HTTP/1.1 200 OK\r\n");
        term.write("Server: Apache/2.4.52 (Ubuntu)\r\n");
        term.write("Content-Type: text/html; charset=UTF-8\r\n");
        term.write("X-Powered-By: CyberLearn-Target/2.0\r\n\r\n");
        term.write("<!DOCTYPE html>\r\n<html>\r\n<body>\r\n  <h1>CyberLearn Authenticated Portal</h1>\r\n");
        term.write(`  <p>Secret Flag: \x1b[1;31mFLAG{curl_http_endpoint_recovered_2026}\x1b[0m</p>\r\n`);
        term.write("</body>\r\n</html>\r\n");
        break;

      case "nc":
      case "netcat":
        term.write(`\x1b[36m[+] Connected to ${args[0] || "10.10.14.55"} on port ${args[1] || "80"}.\x1b[0m\r\n`);
        term.write("220 target.cyberlearn.local ESMTP Postfix (Ubuntu)\r\n");
        term.write("Type 'QUIT' to close connection.\r\n");
        break;

      case "ping":
        const ptarget = args[0] || "10.10.14.55";
        term.write(`PING ${ptarget} (${ptarget}) 56(84) bytes of data.\r\n`);
        term.write(`64 bytes from ${ptarget}: icmp_seq=1 ttl=64 time=0.034 ms\r\n`);
        term.write(`64 bytes from ${ptarget}: icmp_seq=2 ttl=64 time=0.041 ms\r\n`);
        term.write(`64 bytes from ${ptarget}: icmp_seq=3 ttl=64 time=0.038 ms\r\n`);
        term.write(`--- ${ptarget} ping statistics ---\r\n3 packets transmitted, 3 received, 0% packet loss, time 2004ms\r\n`);
        break;

      case "whoami":
        term.write("student\r\n");
        break;

      case "id":
        term.write("uid=1000(student) gid=1000(student) groups=1000(student),27(sudo),100(users)\r\n");
        break;

      case "uname":
        term.write("Linux cyberlearn-sandbox 6.1.0-render-free-x86_64 #1 SMP PREEMPT_DYNAMIC GNU/Linux\r\n");
        break;

      case "pwd":
        term.write(`/home/student/labs/${currentPathRef.current.join("/")}\r\n`);
        break;

      case "cd":
        if (!args[0] || args[0] === "~" || args[0] === "/") {
          currentPathRef.current = [labId];
        } else if (args[0] === "..") {
          if (currentPathRef.current.length > 1) {
            currentPathRef.current.pop();
          }
        }
        break;

      case "echo":
        term.write(args.join(" ") + "\r\n");
        break;

      case "date":
        term.write(new Date().toUTCString() + "\r\n");
        break;

      case "grep":
        if (args.length < 2) {
          term.write("\x1b[31musage: grep <pattern> <file>\x1b[0m\r\n");
        } else {
          const pat = args[0];
          const fname = args[1];
          if (files[fname]) {
            const lines = files[fname].split("\n");
            lines.forEach((line) => {
              if (line.toLowerCase().includes(pat.toLowerCase())) {
                const highlighted = line.replace(new RegExp(pat, "gi"), (m) => `\x1b[1;31m${m}\x1b[0m`);
                term.write(highlighted + "\r\n");
              }
            });
          } else {
            term.write(`\x1b[31mgrep: ${fname}: No such file or directory\x1b[0m\r\n`);
          }
        }
        break;

      case "find":
        Object.keys(files).forEach((f) => {
          term.write(`./${f}\r\n`);
        });
        break;

      case "base64":
        if (args[0]) {
          try {
            term.write(btoa(args.join(" ")) + "\r\n");
          } catch {
            term.write(args.join(" ") + "\r\n");
          }
        } else {
          term.write("usage: base64 <string>\r\n");
        }
        break;

      case "sudo":
      case "su":
        term.write(`\x1b[1;32m[sudo] executing as root: ${args.join(" ")}\x1b[0m\r\n`);
        if (args[0] === "cat" && args[1]) {
          const fn = args[1];
          if (files[fn]) {
            term.write(files[fn].replace(/\n/g, "\r\n") + "\r\n");
          } else {
            term.write(`cat: ${fn}: No such file or directory\r\n`);
          }
        } else {
          term.write("root privileges granted in sandbox container.\r\n");
        }
        break;

      case "history":
        commandHistoryRef.current.forEach((h, idx) => {
          term.write(`  ${(idx + 1).toString().padStart(4, " ")}  ${h}\r\n`);
        });
        break;

      case "ps":
      case "top":
      case "htop":
        term.write("  PID TTY          TIME CMD\r\n");
        term.write("    1 ?        00:00:01 systemd\r\n");
        term.write("  120 pts/0    00:00:00 bash\r\n");
        term.write("  142 pts/0    00:00:00 python3\r\n");
        term.write("  204 ?        00:00:02 apache2\r\n");
        term.write("  305 ?        00:00:05 mysqld\r\n");
        break;

      case "ifconfig":
      case "ip":
        term.write("eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\r\n");
        term.write("        inet 10.10.14.55  netmask 255.255.255.0  broadcast 10.10.14.255\r\n");
        term.write("        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>\r\n");
        term.write("        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)\r\n");
        break;

      case "netstat":
      case "ss":
        term.write("Active Internet connections (only servers)\r\n");
        term.write("Proto Recv-Q Send-Q Local Address           Foreign Address         State\r\n");
        term.write("tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\r\n");
        term.write("tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN\r\n");
        term.write("tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN\r\n");
        break;

      default:
        term.write(`\x1b[31mbash: ${cmd}: command not found.\x1b[0m\r\n`);
        term.write(`\x1b[90m[*] Tip: Type '\x1b[33mattack\x1b[90m', '\x1b[33mnmap\x1b[90m', '\x1b[33msqlmap\x1b[90m', '\x1b[33mcat flag.txt\x1b[90m', or '\x1b[33mhelp\x1b[90m'.\x1b[0m\r\n`);
        break;
    }

    term.write(getPrompt());
  }, [getPrompt, getVirtualFiles, labId]);

  // Connect and initialize terminal
  const connectTerminal = useCallback(async () => {
    if (!terminalRef.current) return;

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    if (coldStartTimerRef.current) clearTimeout(coldStartTimerRef.current);

    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");
    await import("@xterm/xterm/css/xterm.css");

    if (!xtermRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: "block",
        fontSize: fontSize,
        lineHeight: 1.25,
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
        theme: {
          background: "#050811",
          foreground: "#E2E8F0",
          cursor: "#00FF66",
          cursorAccent: "#050811",
          selectionBackground: "#0284c744",
          black: "#1E293B",
          red: "#EF4444",
          green: "#10B981",
          yellow: "#F59E0B",
          blue: "#3B82F6",
          magenta: "#8B5CF6",
          cyan: "#06B6D4",
          white: "#F8FAFC",
          brightBlack: "#475569",
          brightRed: "#F87171",
          brightGreen: "#34D399",
          brightYellow: "#FBBF24",
          brightBlue: "#60A5FA",
          brightMagenta: "#A78BFA",
          brightCyan: "#22D3EE",
          brightWhite: "#FFFFFF",
        },
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // Handle Key input with instant typing responsiveness & reliable output
      term.onData((data: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && !isVirtualModeRef.current) {
          socketRef.current.send(data);
          return;
        }

        // Handle Enter / Newline
        if (data === "\r" || data === "\n" || data === "\r\n") {
          const cmd = currentInputRef.current;
          if (cmd.trim()) {
            commandHistoryRef.current.push(cmd);
          }
          historyIndexRef.current = commandHistoryRef.current.length;
          currentInputRef.current = "";
          executeVirtualCommand(cmd, term);
          return;
        }

        // Handle Backspace (ASCII 127 or 8)
        if (data === "\u007F" || data === "\b") {
          if (currentInputRef.current.length > 0) {
            currentInputRef.current = currentInputRef.current.slice(0, -1);
            term.write("\b \b");
          }
          return;
        }

        // Handle Ctrl+C (ASCII 3)
        if (data === "\u0003") {
          term.write("^C\r\n" + getPrompt());
          currentInputRef.current = "";
          return;
        }

        // Handle Ctrl+L (Clear screen, ASCII 12)
        if (data === "\u000c") {
          term.clear();
          term.write(getPrompt() + currentInputRef.current);
          return;
        }

        // Handle Up Arrow (history previous)
        if (data === "\x1b[A") {
          if (commandHistoryRef.current.length > 0 && historyIndexRef.current > 0) {
            historyIndexRef.current -= 1;
            const prevCmd = commandHistoryRef.current[historyIndexRef.current];
            while (currentInputRef.current.length > 0) {
              term.write("\b \b");
              currentInputRef.current = currentInputRef.current.slice(0, -1);
            }
            term.write(prevCmd);
            currentInputRef.current = prevCmd;
          }
          return;
        }

        // Handle Down Arrow (history next)
        if (data === "\x1b[B") {
          if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
            historyIndexRef.current += 1;
            const nextCmd = commandHistoryRef.current[historyIndexRef.current];
            while (currentInputRef.current.length > 0) {
              term.write("\b \b");
              currentInputRef.current = currentInputRef.current.slice(0, -1);
            }
            term.write(nextCmd);
            currentInputRef.current = nextCmd;
          } else {
            historyIndexRef.current = commandHistoryRef.current.length;
            while (currentInputRef.current.length > 0) {
              term.write("\b \b");
              currentInputRef.current = currentInputRef.current.slice(0, -1);
            }
          }
          return;
        }

        // Handle Tab key auto-complete
        if (data === "\t") {
          const files = getVirtualFiles();
          const lastWord = currentInputRef.current.split(" ").pop() || "";
          if (lastWord) {
            const matches = Object.keys(files).filter((f) => f.toLowerCase().startsWith(lastWord.toLowerCase()));
            if (matches.length === 1) {
              const parts = currentInputRef.current.split(" ");
              parts.pop();
              const completed = [...parts, matches[0]].join(" ");
              const extra = completed.slice(currentInputRef.current.length);
              term.write(extra);
              currentInputRef.current = completed;
            } else if (matches.length > 1) {
              term.write("\r\n" + matches.join("  ") + "\r\n" + getPrompt() + currentInputRef.current);
            }
          }
          return;
        }

        // Handle normal characters & pasted text
        if (!data.startsWith("\x1b")) {
          currentInputRef.current += data;
          term.write(data);
        }
      });
    } else {
      xtermRef.current.clear();
    }

    const term = xtermRef.current;
    printBanner(term);

    // Write prompt immediately so user can type right away with 0ms delay!
    term.write(getPrompt());
    term.focus();
    isVirtualModeRef.current = true;
    setConnectionStatus("virtual");

    // Initiate WebSocket link to Render Free Tier backend in the background
    const wsUrl = getWebSocketUrl();

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        isVirtualModeRef.current = false;
        term.write("\r\n\x1b[1;32m[+] Real Linux PTY WebSocket Attached (Render Free Tier)!\x1b[0m\r\n\r\n");
      };

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          term.write(event.data);
        } else if (event.data instanceof Blob) {
          event.data.text().then((text) => term.write(text));
        } else if (event.data instanceof ArrayBuffer) {
          const text = new TextDecoder().decode(event.data);
          term.write(text);
        }
      };

      ws.onclose = () => {
        if (!isVirtualModeRef.current) {
          setConnectionStatus("virtual");
          isVirtualModeRef.current = true;
        }
      };

      ws.onerror = () => {
        setConnectionStatus("virtual");
        isVirtualModeRef.current = true;
      };
    } catch {
      setConnectionStatus("virtual");
      isVirtualModeRef.current = true;
    }
  }, [fontSize, getPrompt, getVirtualFiles, getWebSocketUrl, executeVirtualCommand]);

  useEffect(() => {
    connectTerminal();

    const handleWindowResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {}
      }
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (coldStartTimerRef.current) clearTimeout(coldStartTimerRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
      }
      if (xtermRef.current) {
        try {
          xtermRef.current.dispose();
          xtermRef.current = null;
        } catch {}
      }
    };
  }, [connectTerminal]);

  // Adjust Font size
  const changeFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(11, Math.min(20, prev + delta));
      if (xtermRef.current) {
        xtermRef.current.options.fontSize = next;
        setTimeout(() => fitAddonRef.current?.fit(), 50);
      }
      return next;
    });
  };

  // Quick Command Launcher
  const sendCommand = (cmd: string) => {
    if (xtermRef.current) {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && !isVirtualModeRef.current) {
        socketRef.current.send(cmd + "\n");
      } else {
        xtermRef.current.write(cmd);
        currentInputRef.current = cmd;
        commandHistoryRef.current.push(cmd);
        currentInputRef.current = "";
        executeVirtualCommand(cmd, xtermRef.current);
      }
      setCopiedHelper(cmd);
      setTimeout(() => setCopiedHelper(null), 1500);
      xtermRef.current.focus();
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.write(getPrompt());
      xtermRef.current.focus();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {}
      }
    }, 120);
  };

  return (
    <div
      className={`transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-2 z-50 flex flex-col bg-[#050811] backdrop-blur-2xl p-3 rounded-2xl border border-primary/50 shadow-2xl"
          : "space-y-3"
      }`}
    >
      {/* Hyper-Realistic Kali Linux Terminal Header & Tab Bar */}
      <div className="flex flex-col rounded-t-xl bg-[#0F172A] border border-border/80 border-b-0 overflow-hidden shadow-lg">
        {/* Top OS Window Control Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#090E1A] border-b border-border/60 select-none">
          {/* Traffic Light Window Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="w-3 h-3 rounded-full bg-[#FF5F56] hover:brightness-110 border border-[#E0443E] transition-all flex items-center justify-center group cursor-pointer"
              title="Close / Clear terminal buffer"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black leading-none">×</span>
            </button>
            <button
              onClick={() => changeFontSize(-1)}
              className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:brightness-110 border border-[#DEA123] transition-all flex items-center justify-center group cursor-pointer"
              title="Zoom out"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black leading-none">-</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-3 h-3 rounded-full bg-[#27C93F] hover:brightness-110 border border-[#1AAB29] transition-all flex items-center justify-center group cursor-pointer"
              title="Toggle Fullscreen"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold text-black leading-none">↗</span>
            </button>

            <div className="h-3.5 w-[1px] bg-border/60 mx-1.5" />

            {/* Active Terminal Tab Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#162032] border border-border/80 text-xs font-mono text-foreground font-semibold shadow-inner">
              <Shield className="w-3 h-3 text-primary animate-pulse" />
              <span>student@cyberlearn: ~/labs/{labId} (bash)</span>
            </div>
          </div>

          {/* Live Status Indicators & Controls */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-2 text-foreground-muted text-[11px]">
              <span>TARGET:</span>
              <span className="text-primary font-bold">10.10.14.55</span>
              <span>•</span>
              <span>NODE:</span>
              <span className="text-foreground-secondary">sandbox-01</span>
            </div>

            <Badge
              variant={
                connectionStatus === "connected"
                  ? "success"
                  : "primary"
              }
              size="sm"
              className="text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              {connectionStatus === "connected" ? "Live Linux PTY" : "Interactive Shell"}
            </Badge>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={connectTerminal}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                title="Restart Shell Session"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                icon={isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              />
            </div>
          </div>
        </div>

        {/* Offensive Attack & Recon Tools Bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0B1120] border-b border-border/40 overflow-x-auto text-xs font-mono">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-foreground-muted text-[11px] flex items-center gap-1 mr-1">
              <Crosshair className="w-3 h-3 text-accent" /> Attack Tools:
            </span>
            {[
              { label: "⚡ Run Attack", cmd: "attack", icon: <Zap className="w-2.5 h-2.5 text-warning" /> },
              { label: "nmap 10.10.14.55", cmd: "nmap -sV 10.10.14.55", icon: <Radio className="w-2.5 h-2.5 text-accent" /> },
              { label: "sqlmap -u /login", cmd: "sqlmap -u http://10.10.14.55/login --dump", icon: <Flame className="w-2.5 h-2.5 text-warning" /> },
              { label: "hydra ssh", cmd: "hydra -l admin -P rockyou.txt 10.10.14.55 ssh", icon: <Skull className="w-2.5 h-2.5 text-error" /> },
              { label: "nikto -h target", cmd: "nikto -h 10.10.14.55", icon: <Globe className="w-2.5 h-2.5 text-secondary-light" /> },
              { label: "cat flag.txt", cmd: "cat flag.txt", icon: <Lock className="w-2.5 h-2.5 text-success" /> },
              { label: "python3 exploit.py", cmd: "python3 exploit.py", icon: <Play className="w-2.5 h-2.5 text-primary" /> },
            ].map((chip) => (
              <button
                key={chip.cmd}
                onClick={() => sendCommand(chip.cmd)}
                className="shrink-0 px-2 py-1 rounded bg-[#162032] border border-border/60 hover:border-primary/60 hover:bg-primary/15 text-foreground-secondary hover:text-primary transition-all text-[11px] flex items-center gap-1.5 cursor-pointer"
              >
                {chip.icon}
                <span>{chip.label}</span>
                {copiedHelper === chip.cmd && <CheckCircle2 className="w-2.5 h-2.5 text-success" />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0 text-foreground-muted text-[11px]">
            <button
              onClick={() => changeFontSize(-1)}
              className="p-1 rounded hover:bg-surface hover:text-foreground cursor-pointer"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px]">{fontSize}px</span>
            <button
              onClick={() => changeFontSize(1)}
              className="p-1 rounded hover:bg-surface hover:text-foreground cursor-pointer"
              title="Increase Font Size"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal Screen Canvas */}
      <div
        className={`relative border border-border/80 border-t-0 bg-[#050811] shadow-2xl overflow-hidden rounded-b-xl ${
          isFullscreen ? "flex-1 min-h-0" : "h-[500px]"
        }`}
      >
        <div
          ref={terminalRef}
          className="w-full h-full p-3 font-mono overflow-hidden focus:outline-none cursor-text"
          onClick={() => xtermRef.current?.focus()}
        />

        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Mission Task Checklist Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-surface/60 border border-border flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            1
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-bold truncate">Recon & Port Scanning</p>
            <p className="text-[10px] text-foreground-muted truncate">Run `nmap` or `ls -la` to find services</p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface/60 border border-border flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            2
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-bold truncate">Launch Attack / Extract Flag</p>
            <p className="text-[10px] text-foreground-muted truncate">Run `attack`, `sqlmap`, or `cat flag.txt`</p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface/60 border border-border flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary-light shrink-0">
            3
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-bold truncate">Claim XP Reward</p>
            <p className="text-[10px] text-foreground-muted truncate">Paste flag into Submit box below</p>
          </div>
        </div>
      </div>
    </div>
  );
}
