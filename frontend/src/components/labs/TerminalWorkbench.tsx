"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Terminal as TerminalIcon,
  RotateCcw,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Trash2,
  Command,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  Play,
  HelpCircle,
  BookOpen,
  ChevronRight,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";

interface TerminalWorkbenchProps {
  sessionId: string;
  labId: string;
}

// Built-in Virtual Filesystem for high-fidelity interactive terminal simulation
interface VirtualFile {
  type: "file" | "dir";
  content?: string;
  permissions?: string;
  owner?: string;
  size?: number;
  children?: Record<string, VirtualFile>;
}

export default function TerminalWorkbench({ sessionId, labId }: TerminalWorkbenchProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const coldStartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Virtual Shell State (fallback & instant response)
  const currentPathRef = useRef<string[]>([labId || "linux-navigation"]);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentInputRef = useRef<string>("");
  const isVirtualModeRef = useRef<boolean>(false);

  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "virtual" | "waking_up">("connecting");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedHelper, setCopiedHelper] = useState<string | null>(null);
  const [copiedTextNotice, setCopiedTextNotice] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [activeTabName, setActiveTabName] = useState<string>("bash — session 1");
  const [showTaskBrief, setShowTaskBrief] = useState<boolean>(true);

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
    term.write("\x1b[1;32m [✓] CyberLearn Interactive Linux Practice Terminal\x1b[0m\r\n");
    term.write(`\x1b[90m [*] Target Workspace: /home/student/labs/${labId}\x1b[0m\r\n`);
    term.write("\x1b[90m [*] Type '\x1b[33mhelp\x1b[90m' or '\x1b[33mcat README.txt\x1b[90m' to view lab instructions.\x1b[0m\r\n\r\n");
  };

  const getPrompt = () => {
    const cwd = currentPathRef.current.length > 0 ? `~/labs/${currentPathRef.current.join("/")}` : "~";
    return `\x1b[1;34m┌──(\x1b[1;32mstudent㉿cyberlearn\x1b[1;34m)-[\x1b[1;37m${cwd}\x1b[1;34m]\r\n└─\x1b[1;32m$\x1b[0m `;
  };

  // Virtual Filesystem generator for instant fallback
  const getVirtualFiles = useCallback(() => {
    const files: Record<string, string> = {
      "README.txt": `=====================================================
  CYBERLEARN INTERACTIVE LAB: ${labId.toUpperCase()}
=====================================================
Welcome to your practice sandbox terminal.

Quick Commands to Get Started:
  ls -la          - List all files including hidden ones
  cat README.txt  - View these instructions
  cat flag.txt    - Inspect the lab flag file
  pwd             - Display current working directory
  whoami          - Check active user identity
  curl / ping     - Network inspection utilities

Once you recover the flag, submit it in the verification bar
below to earn XP and rank up on the leaderboard!
=====================================================`,
      "flag.txt": `FLAG{${labId}_master_session_2026}`,
      "notes.txt": `Target: Locate the secret flag in this directory tree.
Tip: Use 'ls -la', 'cat flag.txt', and 'find . -name "*.txt"'`,
      "help.txt": `CyberLearn Terminal Shell v2.4
Supported utilities: ls, cat, pwd, cd, whoami, id, uname, clear, echo, grep, find, curl, ping, nmap, base64, date, history, help`,
    };

    if (labId.includes("sql")) {
      files["query_tester.py"] = "# Python SQLi Injection Payload Tester\nprint('Inject payloads into vulnerable auth query endpoints.')";
      files["vulnerable_schema.sql"] = "CREATE TABLE users (id INT, username VARCHAR(50), password_hash VARCHAR(255));\nINSERT INTO users VALUES (1, 'admin', '$2b$12$eX4mpL3H4shF0rFl4g');";
    }

    if (labId.includes("packet") || labId.includes("network")) {
      files["capture.pcap.txt"] = "10.0.0.5 -> 10.0.0.1 HTTP GET /auth [SYN, ACK]\n10.0.0.5 -> 10.0.0.1 HTTP POST /login user=admin pass=FLAG{sniffed_cleartext_traffic}";
    }

    return files;
  }, [labId]);

  // Execute command in built-in Virtual Linux Shell
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
        term.clear();
        term.write(getPrompt());
        return;

      case "help":
        term.write("\x1b[1;36mAvailable Commands:\x1b[0m\r\n");
        term.write("  \x1b[33mls\x1b[0m [-la]           - List files in current directory\r\n");
        term.write("  \x1b[33mcat\x1b[0m <file>         - Display file contents\r\n");
        term.write("  \x1b[33mpwd\x1b[0m                - Print working directory\r\n");
        term.write("  \x1b[33mcd\x1b[0m [dir]           - Change directory\r\n");
        term.write("  \x1b[33mwhoami\x1b[0m / \x1b[33mid\x1b[0m        - Display user and group info\r\n");
        term.write("  \x1b[33muname\x1b[0m -a           - System kernel info\r\n");
        term.write("  \x1b[33mgrep\x1b[0m <pat> <file>  - Search text in files\r\n");
        term.write("  \x1b[33mfind\x1b[0m . -name <pat> - Find files matching name\r\n");
        term.write("  \x1b[33mecho\x1b[0m [text]        - Print text to terminal\r\n");
        term.write("  \x1b[33mdate\x1b[0m               - Display current system time\r\n");
        term.write("  \x1b[33mcurl\x1b[0m [url]         - Transfer data from a URL\r\n");
        term.write("  \x1b[33mping\x1b[0m <host>        - Send ICMP ECHO_REQUEST to network hosts\r\n");
        term.write("  \x1b[33mnmap\x1b[0m <host>        - Network exploration tool and port scanner\r\n");
        term.write("  \x1b[33mbase64\x1b[0m <str>       - Encode/decode base64 data\r\n");
        term.write("  \x1b[33mhistory\x1b[0m            - Show command history\r\n");
        break;

      case "ls":
        const showAll = args.includes("-la") || args.includes("-a") || args.includes("-l");
        if (showAll) {
          term.write("total 32\r\n");
          term.write("drwxr-xr-x 4 student student 4096 Sep  2 01:50 .\r\n");
          term.write("drwxr-xr-x 3 student student 4096 Sep  2 01:50 ..\r\n");
          term.write("-rw-r--r-- 1 student student  240 Sep  2 01:50 .bashrc\r\n");
          Object.keys(files).forEach((fname) => {
            const isExec = fname.endsWith(".sh") || fname.endsWith(".py");
            const color = isExec ? "\x1b[1;32m" : fname.includes("flag") ? "\x1b[1;31m" : "\x1b[0m";
            const size = files[fname].length;
            term.write(`-rw-r--r-- 1 student student ${size.toString().padStart(5, " ")} Sep  2 01:50 ${color}${fname}\x1b[0m\r\n`);
          });
        } else {
          const list = Object.keys(files)
            .map((fname) => {
              const isExec = fname.endsWith(".sh") || fname.endsWith(".py");
              const color = isExec ? "\x1b[1;32m" : fname.includes("flag") ? "\x1b[1;31m" : "\x1b[0m";
              return `${color}${fname}\x1b[0m`;
            })
            .join("  ");
          term.write(list + "\r\n");
        }
        break;

      case "cat":
        if (args.length === 0) {
          term.write("\x1b[31mcat: missing file operand\x1b[0m\r\n");
        } else {
          const fname = args[0];
          if (files[fname]) {
            term.write(files[fname].replace(/\n/g, "\r\n") + "\r\n");
          } else {
            term.write(`\x1b[31mcat: ${fname}: No such file or directory\x1b[0m\r\n`);
          }
        }
        break;

      case "pwd":
        term.write(`/home/student/labs/${currentPathRef.current.join("/")}\r\n`);
        break;

      case "whoami":
        term.write("student\r\n");
        break;

      case "id":
        term.write("uid=1000(student) gid=1000(student) groups=1000(student),27(sudo),100(users)\r\n");
        break;

      case "uname":
        if (args.includes("-a")) {
          term.write("Linux cyberlearn-sandbox 6.1.0-render-free-x86_64 #1 SMP PREEMPT_DYNAMIC GNU/Linux\r\n");
        } else {
          term.write("Linux\r\n");
        }
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

      case "curl":
        term.write(`\x1b[36m[*] Connecting to ${args[0] || "http://target.local"}...\x1b[0m\r\n`);
        term.write("HTTP/1.1 200 OK\r\nServer: CyberLearn/2.0\r\nContent-Type: text/html\r\n\r\n<h1>CyberLearn Target Active</h1>\r\n");
        break;

      case "ping":
        const target = args[0] || "127.0.0.1";
        term.write(`PING ${target} (${target}) 56(84) bytes of data.\r\n`);
        term.write(`64 bytes from ${target}: icmp_seq=1 ttl=64 time=0.034 ms\r\n`);
        term.write(`64 bytes from ${target}: icmp_seq=2 ttl=64 time=0.041 ms\r\n`);
        term.write(`--- ${target} ping statistics ---\r\n2 packets transmitted, 2 received, 0% packet loss\r\n`);
        break;

      case "nmap":
        term.write(`Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString()}\r\n`);
        term.write(`Nmap scan report for ${args[0] || "10.10.14.1"}\r\n`);
        term.write("Host is up (0.0012s latency).\r\n");
        term.write("PORT     STATE SERVICE VERSION\r\n");
        term.write("22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu\r\n");
        term.write("80/tcp   open  http    Apache httpd 2.4.52\r\n");
        term.write("8000/tcp open  http-alt FastAPI CyberLearn Sandbox\r\n\r\n");
        term.write("Nmap done: 1 IP address scanned in 1.12 seconds\r\n");
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

      case "history":
        commandHistoryRef.current.forEach((h, idx) => {
          term.write(`  ${(idx + 1).toString().padStart(4, " ")}  ${h}\r\n`);
        });
        break;

      default:
        term.write(`\x1b[31mbash: ${cmd}: command not found. Type '\x1b[33mhelp\x1b[31m' for supported commands.\x1b[0m\r\n`);
        break;
    }

    term.write(getPrompt());
  }, [getVirtualFiles, labId]);

  // Connect or switch to virtual engine
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

      // Handle Key input in Virtual or PTY mode
      term.onData((data: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && !isVirtualModeRef.current) {
          socketRef.current.send(data);
          return;
        }

        // Virtual Engine interactive keystroke handler
        if (data === "\r") {
          // Enter key
          const cmd = currentInputRef.current;
          if (cmd.trim()) {
            commandHistoryRef.current.push(cmd);
          }
          historyIndexRef.current = commandHistoryRef.current.length;
          currentInputRef.current = "";
          executeVirtualCommand(cmd, term);
        } else if (data === "\u007F") {
          // Backspace
          if (currentInputRef.current.length > 0) {
            currentInputRef.current = currentInputRef.current.slice(0, -1);
            term.write("\b \b");
          }
        } else if (data === "\x1b[A") {
          // Up Arrow (history previous)
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
        } else if (data === "\x1b[B") {
          // Down Arrow (history next)
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
        } else if (data === "\t") {
          // Tab auto-complete
          const files = getVirtualFiles();
          const matches = Object.keys(files).filter((f) => f.startsWith(currentInputRef.current.split(" ").pop() || ""));
          if (matches.length === 1) {
            const parts = currentInputRef.current.split(" ");
            parts.pop();
            const completed = [...parts, matches[0]].join(" ");
            const extra = completed.slice(currentInputRef.current.length);
            term.write(extra);
            currentInputRef.current = completed;
          }
        } else if (data >= " " && data <= "~") {
          // Normal printable characters
          currentInputRef.current += data;
          term.write(data);
        }
      });
    } else {
      xtermRef.current.clear();
    }

    const term = xtermRef.current;
    printBanner(term);

    const wsUrl = getWebSocketUrl();
    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      coldStartTimerRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          setConnectionStatus("virtual");
          isVirtualModeRef.current = true;
          term.write("\x1b[33m[*] Connected to CyberLearn Sandboxed Virtual Linux Engine.\x1b[0m\r\n");
          term.write("\x1b[90m[*] (Render Free Tier background PTY will auto-link when awake)\x1b[0m\r\n\r\n");
          term.write(getPrompt());
        }
      }, 3500);

      ws.onopen = () => {
        if (coldStartTimerRef.current) clearTimeout(coldStartTimerRef.current);
        setConnectionStatus("connected");
        isVirtualModeRef.current = false;
        term.write("\x1b[1;32m[+] Real Linux PTY WebSocket Linked (Render Free Sandbox)!\x1b[0m\r\n\r\n");
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
          term.write("\r\n\x1b[33m[*] Running in Instant Interactive Virtual Linux Shell.\x1b[0m\r\n");
          term.write(getPrompt());
        }
      };

      ws.onerror = () => {
        setConnectionStatus("virtual");
        isVirtualModeRef.current = true;
        term.write("\r\n\x1b[33m[*] Running in Instant Interactive Virtual Linux Shell.\x1b[0m\r\n");
        term.write(getPrompt());
      };
    } catch {
      setConnectionStatus("virtual");
      isVirtualModeRef.current = true;
      term.write(getPrompt());
    }
  }, [fontSize, getPrompt, getVirtualFiles, getWebSocketUrl, labId, executeVirtualCommand]);

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

  // Quick Command sender
  const sendCommand = (cmd: string) => {
    if (xtermRef.current) {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && !isVirtualModeRef.current) {
        socketRef.current.send(cmd + "\n");
      } else {
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

  const handleCopySelection = () => {
    if (xtermRef.current) {
      const selection = xtermRef.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
        setCopiedTextNotice(true);
        setTimeout(() => setCopiedTextNotice(false), 2000);
      }
    }
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
              className="w-3 h-3 rounded-full bg-[#FF5F56] hover:brightness-110 border border-[#E0443E] transition-all flex items-center justify-center group"
              title="Close / Clear terminal"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black leading-none">×</span>
            </button>
            <button
              onClick={() => changeFontSize(-1)}
              className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:brightness-110 border border-[#DEA123] transition-all flex items-center justify-center group"
              title="Zoom out"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black leading-none">-</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-3 h-3 rounded-full bg-[#27C93F] hover:brightness-110 border border-[#1AAB29] transition-all flex items-center justify-center group"
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

          {/* Live Status Indicators & Window Controls */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-2 text-foreground-muted text-[11px]">
              <span>HOST:</span>
              <span className="text-primary font-bold">sandbox-node-01</span>
              <span>•</span>
              <span>IP:</span>
              <span className="text-foreground-secondary">10.10.14.55</span>
            </div>

            <Badge
              variant={
                connectionStatus === "connected"
                  ? "success"
                  : connectionStatus === "virtual"
                  ? "primary"
                  : "warning"
              }
              size="sm"
              className="text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              {connectionStatus === "connected"
                ? "Live Linux PTY"
                : connectionStatus === "virtual"
                ? "Virtual Shell"
                : "Connecting..."}
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

        {/* Quick Command Launcher Bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0B1120] border-b border-border/40 overflow-x-auto text-xs font-mono">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-foreground-muted text-[11px] flex items-center gap-1 mr-1">
              <Play className="w-3 h-3 text-accent" /> Quick Run:
            </span>
            {[
              { label: "ls -la", cmd: "ls -la" },
              { label: "cat README.txt", cmd: "cat README.txt" },
              { label: "cat flag.txt", cmd: "cat flag.txt" },
              { label: "whoami & id", cmd: "whoami && id" },
              { label: "find .", cmd: "find ." },
              { label: "help", cmd: "help" },
            ].map((chip) => (
              <button
                key={chip.cmd}
                onClick={() => sendCommand(chip.cmd)}
                className="shrink-0 px-2 py-0.5 rounded bg-[#162032] border border-border/60 hover:border-primary/60 hover:bg-primary/15 text-foreground-secondary hover:text-primary transition-all text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <span>{chip.label}</span>
                {copiedHelper === chip.cmd && <CheckCircle2 className="w-2.5 h-2.5 text-success" />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0 text-foreground-muted text-[11px]">
            <button
              onClick={() => changeFontSize(-1)}
              className="p-1 rounded hover:bg-surface hover:text-foreground"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px]">{fontSize}px</span>
            <button
              onClick={() => changeFontSize(1)}
              className="p-1 rounded hover:bg-surface hover:text-foreground"
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
            <p className="text-foreground font-bold truncate">Explore Directory Tree</p>
            <p className="text-[10px] text-foreground-muted truncate">Run `ls -la` to find challenge files</p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface/60 border border-border flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            2
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-bold truncate">Extract Flag Content</p>
            <p className="text-[10px] text-foreground-muted truncate">Read `cat flag.txt` or `cat README.txt`</p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface/60 border border-border flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary-light shrink-0">
            3
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-bold truncate">Claim XP Reward</p>
            <p className="text-[10px] text-foreground-muted truncate">Paste into Submit Flag box below</p>
          </div>
        </div>
      </div>
    </div>
  );
}
