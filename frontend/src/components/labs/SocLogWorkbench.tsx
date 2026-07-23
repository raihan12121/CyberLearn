"use client";

import React, { useState } from "react";
import { Terminal, Search, Filter, ShieldAlert, FileText, CheckCircle2, Download, AlertTriangle } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  service: string;
  event: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  raw: string;
}

const mockLogs: LogEntry[] = [
  {
    id: "log-1",
    timestamp: "2026-07-22 18:40:12",
    sourceIp: "192.168.1.105",
    destIp: "10.10.10.15",
    service: "SSHD",
    event: "Failed password for root from 192.168.1.105 port 52140 ssh2",
    severity: "MEDIUM",
    raw: `Jul 22 18:40:12 target-server sshd[4102]: Failed password for root from 192.168.1.105 port 52140 ssh2`,
  },
  {
    id: "log-2",
    timestamp: "2026-07-22 18:40:14",
    sourceIp: "192.168.1.105",
    destIp: "10.10.10.15",
    service: "SSHD",
    event: "Failed password for admin from 192.168.1.105 port 52142 ssh2",
    severity: "HIGH",
    raw: `Jul 22 18:40:14 target-server sshd[4105]: Failed password for admin from 192.168.1.105 port 52142 ssh2`,
  },
  {
    id: "log-3",
    timestamp: "2026-07-22 18:41:00",
    sourceIp: "10.10.14.5",
    destIp: "10.10.10.15",
    service: "HTTP",
    event: "POST /login 200 - Payload: username=admin' OR '1'='1--",
    severity: "CRITICAL",
    raw: `10.10.14.5 - - [22/Jul/2026:18:41:00 +0000] "POST /login HTTP/1.1" 200 4502 "-" "Mozilla/5.0" SQLi_Detected`,
  },
  {
    id: "log-4",
    timestamp: "2026-07-22 18:42:10",
    sourceIp: "10.10.10.15",
    destIp: "10.10.20.50",
    service: "POSTGRES",
    event: "DB Query: SELECT * FROM users WHERE role='admin'",
    severity: "LOW",
    raw: `2026-07-22 18:42:10 UTC [4902]: [1-1] user=app_user,db=cyberlearn LOG: statement: SELECT * FROM users WHERE role='admin'`,
  },
];

export default function SocLogWorkbench() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      log.raw.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sourceIp.includes(searchQuery);
    const matchesSeverity = selectedSeverity === "ALL" || log.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-elevated border-b border-border font-sans">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-foreground text-sm">
            SOC Incident Response & SIEM Log Analyzer
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20">
            Live Stream Active
          </span>
        </div>
        <div className="text-foreground-secondary text-xs">
          Total Logs Analyzed: <span className="text-primary font-bold">{mockLogs.length}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-surface border-b border-border flex flex-wrap items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs by IP, service, payload, or KQL query (e.g. service:SSHD)..."
              className="w-full bg-surface-elevated border border-border rounded pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground-muted text-xs">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-surface-elevated border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-surface/60">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-surface-elevated border border-border hover:border-foreground-muted transition-all font-mono"
            >
              <div className="flex items-center justify-between font-sans mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-400"
                        : log.severity === "HIGH"
                        ? "bg-amber-500/20 text-amber-400"
                        : log.severity === "MEDIUM"
                        ? "bg-sky-500/20 text-sky-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {log.severity}
                  </span>
                  <span className="font-semibold text-primary">{log.service}</span>
                  <span className="text-foreground-muted text-[11px]">
                    {log.sourceIp} → {log.destIp}
                  </span>
                </div>
                <span className="text-foreground-muted text-[11px]">{log.timestamp}</span>
              </div>
              <div className="text-foreground bg-surface p-2 rounded border border-border/50 text-xs overflow-x-auto whitespace-pre-wrap">
                {log.raw}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-foreground-muted font-sans">
            No logs matched your filter query.
          </div>
        )}
      </div>
    </div>
  );
}
