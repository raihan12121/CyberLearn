"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { RefreshCw, Wifi, WifiOff, Terminal as TerminalIcon } from "lucide-react";

interface XTermTerminalProps {
  sessionId: string;
  labId: string;
}

export default function XTermTerminal({ sessionId, labId }: XTermTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "live" | "fallback">("connecting");
  const commandLineRef = useRef<string>("");

  const processFallbackCommand = (cmd: string, term: Terminal) => {
    if (!cmd) return;
    const parts = cmd.trim().split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (mainCmd) {
      case "help":
        term.writeln("\x1b[1;36m=================== CYBERLEARN COMMAND SUITE ===================\x1b[0m");
        term.writeln("\x1b[1;32m[Recon & Scanning]\x1b[0m      nmap, gobuster, sqlmap, nikto, ping, netstat, ip, traceroute, dig, nc");
        term.writeln("\x1b[1;32m[Crypto & Hashes]\x1b[0m       base64, md5sum, sha256sum, hashcat, john, openssl");
        term.writeln("\x1b[1;32m[File & Forensics]\x1b[0m      ls, cat, grep, find, strings, file, head, tail, chmod, chown");
        term.writeln("\x1b[1;32m[System & Auth]\x1b[0m         whoami, id, sudo -l, uname -a, ps, top, history, clear");
        term.writeln("\x1b[1;36m=================================================================\x1b[0m");
        break;

      case "clear":
        term.clear();
        break;

      case "whoami":
        term.writeln("student");
        break;

      case "id":
        term.writeln("uid=1000(student) gid=1000(student) groups=1000(student),27(sudo)");
        break;

      case "uname":
        if (args.includes("-a")) {
          term.writeln("Linux cyberlearn-sandbox 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux");
        } else {
          term.writeln("Linux");
        }
        break;

      case "ls":
        term.writeln("notes.txt  target_app.py  flag.txt  shadow_backup.bak  .bashrc");
        break;

      case "cat":
        if (args.length === 0) {
          term.writeln("cat: missing file argument");
        } else if (args[0] === "flag.txt") {
          term.writeln("FLAG{sandbox_terminal_interactive_execution_9921}");
        } else if (args[0] === "notes.txt") {
          term.writeln("TODO: Test SQL injection on target_app.py auth endpoint (admin' OR '1'='1)");
        } else if (args[0] === "shadow_backup.bak") {
          term.writeln("admin:$6$saltsalt$vJ8k... (Hashcat mode 1800)");
        } else {
          term.writeln(`cat: ${args[0]}: No such file or directory`);
        }
        break;

      case "nmap":
        term.writeln("Starting Nmap 7.94 ( https://nmap.org )");
        term.writeln("Nmap scan report for target.lab (192.168.1.100)");
        term.writeln("Host is up (0.00042s latency).");
        term.writeln("PORT     STATE SERVICE     VERSION");
        term.writeln("22/tcp   open  ssh         OpenSSH 8.9p1 Ubuntu");
        term.writeln("80/tcp   open  http        nginx 1.18.0");
        term.writeln("3306/tcp open  mysql       MySQL 8.0.35");
        term.writeln("8080/tcp open  http-proxy  Node.js Express");
        term.writeln("Nmap done: 1 IP address (1 host up) scanned in 0.42 seconds.");
        break;

      case "gobuster":
        term.writeln("===============================================================");
        term.writeln("Gobuster v3.6 - Directory & File Enumeration");
        term.writeln("===============================================================");
        term.writeln("[+] Url:                     http://target.lab:8080");
        term.writeln("[+] Threads:                 10");
        term.writeln("===============================================================");
        term.writeln("/admin                (Status: 301) [Size: 178]");
        term.writeln("/login                (Status: 200) [Size: 2450]");
        term.writeln("/api/v1/users         (Status: 200) [Size: 890]");
        term.writeln("/db_backup.sql        (Status: 200) [Size: 45210]");
        term.writeln("===============================================================");
        break;

      case "sqlmap":
        term.writeln("[*] starting at 14:02:11");
        term.writeln("[+] testing connection to target URL");
        term.writeln("[+] heuristic test shows target parameter 'username' is vulnerable");
        term.writeln("[+] SQL Injection type: Boolean-based blind / Union query");
        term.writeln("[+] Database: SQLite 3.x");
        term.writeln("[+] Dumping table 'users':");
        term.writeln("    - admin : $2b$12$e9Xq... [FLAG{sqli_master_bypassed_auth_8832}]");
        break;

      case "sudo":
        if (args.includes("-l")) {
          term.writeln("Matching Defaults entries for student on cyberlearn-sandbox:");
          term.writeln("    env_reset, mail_badpass");
          term.writeln("\r\nUser student may run the following commands on cyberlearn-sandbox:");
          term.writeln("    (root) NOPASSWD: /usr/bin/find");
        } else if (args[0] === "find" && args.includes("-exec")) {
          term.writeln("\x1b[1;31m# root@cyberlearn-sandbox:/# \x1b[0m");
          term.writeln("Root shell spawned via SUID find privilege escalation!");
          term.writeln("FLAG{linux_privesc_suid_root_obtained_7712}");
        } else {
          term.writeln("[sudo] password for student: ");
        }
        break;

      case "base64":
        if (args[0] === "-d" && args[1]) {
          try {
            term.writeln(atob(args[1]));
          } catch {
            term.writeln("base64: invalid input");
          }
        } else if (args[0]) {
          term.writeln(btoa(args[0]));
        }
        break;

      default:
        term.writeln(`bash: ${mainCmd}: command executed in virtual cybersecurity container sandbox.`);
        break;
    }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create xterm terminal instance with custom CyberLearn dark theme
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      theme: {
        background: "#090D16",
        foreground: "#E2E8F0",
        cursor: "#10B981",
        selectionBackground: "#1E293B",
        black: "#090D16",
        red: "#EF4444",
        green: "#10B981",
        yellow: "#F59E0B",
        blue: "#3B82F6",
        magenta: "#A855F7",
        cyan: "#06B6D4",
        white: "#F8FAFC",
        brightBlack: "#475569",
        brightRed: "#F87171",
        brightGreen: "#34D399",
        brightYellow: "#FBBF24",
        brightBlue: "#60A5FA",
        brightMagenta: "#C084FC",
        brightCyan: "#22D3EE",
        brightWhite: "#FFFFFF",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    termInstanceRef.current = term;

    // Auto-fit on window resize
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {
        // ignore fit call when hidden
      }
    };
    window.addEventListener("resize", handleResize);

    // Initialize WebSocket connection to FastAPI backend
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    const wsUrl = `${protocol}//${window.location.hostname}:8000/labs/ws/${sessionId}/terminal?token=${encodeURIComponent(token)}`;

    let socket: WebSocket | null = null;
    let fallbackMode = false;

    const promptFallback = (term: Terminal) => {
      term.write("\r\n\x1b[1;32muser@cyberlearn\x1b[0m:\x1b[1;34m~/sandbox\x1b[0m$ ");
    };

    const handleFallbackData = (data: string, term: Terminal) => {
      if (data === "\r") {
        const cmd = commandLineRef.current.trim();
        term.write("\r\n");
        processFallbackCommand(cmd, term);
        commandLineRef.current = "";
        promptFallback(term);
      } else if (data === "\u007F" || data === "\b") {
        if (commandLineRef.current.length > 0) {
          commandLineRef.current = commandLineRef.current.slice(0, -1);
          term.write("\b \b");
        }
      } else if (data === "\u0003") {
        term.write("^C");
        commandLineRef.current = "";
        promptFallback(term);
      } else {
        commandLineRef.current += data;
        term.write(data);
      }
    };

    const startFallbackShell = () => {
      fallbackMode = true;
      setConnectionState("fallback");
      term.writeln("\x1b[1;33m[Notice: Backend WebSocket offline — Running Interactive Local Sandbox]\x1b[0m");
      term.writeln("CyberLearn Terminal v2.4 (Ubuntu 24.04 LTS)");
      term.writeln("Type \x1b[1;36mhelp\x1b[0m to view available commands.\r\n");
      promptFallback(term);

      term.onData((data) => {
        if (!fallbackMode) return;
        handleFallbackData(data, term);
      });
    };

    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnectionState("live");
        term.focus();
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.data) {
            term.write(payload.data);
          }
        } catch {
          term.write(event.data);
        }
      };

      socket.onerror = () => {
        if (!fallbackMode) {
          startFallbackShell();
        }
      };

      socket.onclose = () => {
        if (!fallbackMode) {
          startFallbackShell();
        }
      };

      term.onData((data) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "input", data }));
        }
      });

    } catch {
      startFallbackShell();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (socket) {
        socket.close();
      }
      term.dispose();
    };
  }, [sessionId, labId]);

  const handleReconnect = () => {
    setConnectionState("connecting");
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-[420px] sm:h-[520px] bg-[#090D16] border border-zinc-800 rounded-[var(--radius-xl)] overflow-hidden">
      {/* Terminal Header status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-zinc-200 text-xs truncate">bash @ cyberlearn-sandbox</span>
        </div>

        <div className="flex items-center gap-3">
          {connectionState === "live" && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              <Wifi className="w-3.5 h-3.5 animate-pulse" /> WebSocket Live
            </span>
          )}
          {connectionState === "fallback" && (
            <span className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              <WifiOff className="w-3.5 h-3.5" /> Interactive Sandbox
            </span>
          )}
          {connectionState === "connecting" && (
            <span className="flex items-center gap-1.5 text-blue-400 text-[11px] font-semibold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting...
            </span>
          )}

          <button
            onClick={handleReconnect}
            className="hover:text-white transition-colors cursor-pointer p-1"
            title="Reload Terminal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* XTerm.js Canvas Container */}
      <div ref={terminalRef} className="flex-1 p-3 overflow-hidden text-xs" />
    </div>
  );
}
