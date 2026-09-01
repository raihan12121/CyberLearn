"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { Card, Badge, Button } from "@/components/ui";
import {
  Terminal as TerminalIcon,
  RotateCcw,
  Trash2,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  HelpCircle,
  Sparkles,
  Command,
  CheckCircle2,
  Copy,
} from "lucide-react";

interface TerminalWorkbenchProps {
  sessionId: string;
  labId: string;
  onFlagFound?: (flag: string) => void;
}

export default function TerminalWorkbench({
  sessionId,
  labId,
  onFlagFound,
}: TerminalWorkbenchProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedHelper, setCopiedHelper] = useState<string | null>(null);

  // Derive WebSocket URL from API host
  const getWebSocketUrl = useCallback(() => {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let isSecure = false;
    let host = "localhost:8000";

    if (rawApiUrl.startsWith("https://")) {
      isSecure = true;
      host = rawApiUrl.replace("https://", "").replace(/\/+$/, "");
    } else if (rawApiUrl.startsWith("http://")) {
      isSecure = false;
      host = rawApiUrl.replace("http://", "").replace(/\/+$/, "");
    } else if (typeof window !== "undefined") {
      isSecure = window.location.protocol === "https:";
      host = window.location.host;
    }

    const wsProto = isSecure ? "wss" : "ws";
    return `${wsProto}://${host}/labs/${encodeURIComponent(sessionId)}/terminal/ws?lab_id=${encodeURIComponent(labId)}`;
  }, [sessionId, labId]);

  // Connect to WebSocket & Initialize XTerm
  const connectTerminal = useCallback(() => {
    if (!terminalRef.current) return;

    // Clean up old socket if existing
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Clean up previous terminal instance if existing
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }

    setConnectionStatus("connecting");

    // Initialize Xterm.js instance with CyberLearn cyberpunk palette
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
      fontSize: 13.5,
      lineHeight: 1.25,
      theme: {
        background: "#070D1A",
        foreground: "#00BCEB",
        cursor: "#00E599",
        cursorAccent: "#070D1A",
        selectionBackground: "rgba(0, 188, 235, 0.35)",
        black: "#070D1A",
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
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Small delay to ensure container dimension layout is ready
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch {
        // ignore layout race
      }
    }, 50);

    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setConnectionStatus("connected");
      term.write("\r\n\x1b[1;32m[+] CyberLearn Interactive Terminal Connected.\x1b[0m\r\n");
      term.write("\x1b[90m[*] Initializing sandboxed environment session...\x1b[0m\r\n\r\n");

      // Send initial resize frame
      if (fitAddon.proposeDimensions()) {
        const { cols, rows } = fitAddon.proposeDimensions()!;
        try {
          ws.send(JSON.stringify({ cols, rows }));
        } catch {
          // ignore
        }
      }
    };

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        term.write(event.data);
      } else {
        const text = new TextDecoder().decode(event.data);
        term.write(text);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      term.write("\r\n\x1b[1;31m[-] Session disconnected from host.\x1b[0m\r\n");
      term.write("\x1b[90m[*] Click 'Restart Shell' in the top right to launch a new session.\x1b[0m\r\n");
    };

    ws.onerror = (err) => {
      setConnectionStatus("disconnected");
      console.warn("Terminal WebSocket error:", err);
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ cols, rows }));
        } catch {
          // ignore
        }
      }
    });
  }, [getWebSocketUrl]);

  // Setup initial mount & resize listener
  useEffect(() => {
    connectTerminal();

    const handleWindowResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("resize", handleWindowResize);

    if (terminalRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (fitAddonRef.current) {
          try {
            fitAddonRef.current.fit();
          } catch {
            // ignore
          }
        }
      });
      resizeObserverRef.current.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [connectTerminal]);

  // Send quick helper command
  const sendCommand = (cmd: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(cmd + "\n");
      setCopiedHelper(cmd);
      setTimeout(() => setCopiedHelper(null), 1500);
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.focus();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {
          // ignore
        }
      }
    }, 100);
  };

  return (
    <div className={`transition-all duration-200 ${isFullscreen ? "fixed inset-4 z-50 flex flex-col bg-background/95 backdrop-blur-xl p-4 rounded-2xl border border-primary/40 shadow-2xl" : "space-y-3"}`}>
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-surface-elevated rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <TerminalIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs sm:text-sm text-foreground">
                bash - student@cyberlearn: ~
              </span>
              <Badge
                variant={connectionStatus === "connected" ? "success" : connectionStatus === "connecting" ? "warning" : "danger"}
                size="sm"
                className="text-[10px] font-mono px-2 py-0.5 capitalize flex items-center gap-1"
              >
                {connectionStatus === "connected" ? (
                  <>
                    <Wifi className="w-2.5 h-2.5" />
                    <span>Live</span>
                  </>
                ) : connectionStatus === "connecting" ? (
                  <>
                    <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                    <span>Connecting</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>Offline</span>
                  </>
                )}
              </Badge>
            </div>
            <p className="text-[11px] text-foreground-muted font-mono">
              Session: <span className="text-foreground-secondary">{sessionId || labId}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            title="Clear terminal buffer"
          >
            Clear
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={connectTerminal}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            title="Restart terminal shell session"
          >
            Restart
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            icon={isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? "Exit" : "Expand"}
          </Button>
        </div>
      </div>

      {/* Interactive Quick-Action Command Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-foreground-muted text-[11px] flex items-center gap-1 shrink-0">
          <Command className="w-3 h-3 text-accent" /> Quick Exec:
        </span>
        {[
          { label: "ls -la", cmd: "ls -la" },
          { label: "cat README.txt", cmd: "cat README.txt" },
          { label: "cat flag.txt", cmd: "cat flag.txt" },
          { label: "whoami & pwd", cmd: "whoami && pwd" },
          { label: "find . -name '*.txt'", cmd: "find . -name '*.txt'" },
        ].map((chip) => (
          <button
            key={chip.cmd}
            onClick={() => sendCommand(chip.cmd)}
            disabled={connectionStatus !== "connected"}
            className="shrink-0 px-2.5 py-1 rounded-md bg-surface border border-border hover:border-primary/50 hover:bg-primary/10 text-foreground-secondary hover:text-primary transition-all text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span>{chip.label}</span>
            {copiedHelper === chip.cmd && <CheckCircle2 className="w-3 h-3 text-success animate-pulse" />}
          </button>
        ))}
      </div>

      {/* Main Terminal Window Frame */}
      <div className={`relative rounded-xl border border-border bg-[#070D1A] overflow-hidden shadow-2xl ${isFullscreen ? "flex-1 min-h-0" : "h-[460px]"}`}>
        {/* Terminal Screen Canvas */}
        <div
          ref={terminalRef}
          className="w-full h-full p-3 font-mono overflow-hidden focus:outline-none"
          onClick={() => xtermRef.current?.focus()}
        />

        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none" />
      </div>

      {/* Helpful Hint Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface/50 border border-border text-[11px] text-foreground-muted">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>
            Explore files with standard bash commands. Once you extract the secret flag string, paste it into the flag submission box below.
          </span>
        </div>
        <span className="font-mono text-primary/80 shrink-0">Linux PTY Sandbox</span>
      </div>
    </div>
  );
}
