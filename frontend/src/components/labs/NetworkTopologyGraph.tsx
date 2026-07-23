"use client";

import React, { useState } from "react";
import { Server, Monitor, Shield, Radio, Cpu, Lock, Unlock, CheckCircle2, Search } from "lucide-react";

interface Node {
  id: string;
  name: string;
  ip: string;
  role: "attacker" | "router" | "firewall" | "target" | "database";
  status: "active" | "scanned" | "compromised" | "locked";
  ports: number[];
  os: string;
}

const mockNodes: Node[] = [
  {
    id: "node-1",
    name: "Kali Workstation (You)",
    ip: "10.10.14.5",
    role: "attacker",
    status: "active",
    ports: [],
    os: "Kali Linux 2026.1",
  },
  {
    id: "node-2",
    name: "Border Firewall / Gateway",
    ip: "10.10.10.1",
    role: "firewall",
    status: "active",
    ports: [80, 443],
    os: "pfSense 2.7",
  },
  {
    id: "node-3",
    name: "Internal Router",
    ip: "10.10.10.254",
    role: "router",
    status: "scanned",
    ports: [22, 161],
    os: "Cisco IOS",
  },
  {
    id: "node-4",
    name: "Web Application Server",
    ip: "10.10.10.15",
    role: "target",
    status: "scanned",
    ports: [22, 80, 8080, 3306],
    os: "Ubuntu 24.04 LTS",
  },
  {
    id: "node-5",
    name: "PostgreSQL Database Server",
    ip: "10.10.20.50",
    role: "database",
    status: "compromised",
    ports: [5432],
    os: "Debian 12",
  },
];

export default function NetworkTopologyGraph() {
  const [selectedNode, setSelectedNode] = useState<Node>(mockNodes[3]);
  const [scanning, setScanning] = useState(false);

  const handleScanNode = (nodeId: string) => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
    }, 800);
  };

  const getRoleIcon = (role: Node["role"]) => {
    switch (role) {
      case "attacker":
        return <Monitor className="w-5 h-5 text-sky-400" />;
      case "firewall":
        return <Shield className="w-5 h-5 text-amber-400" />;
      case "router":
        return <Radio className="w-5 h-5 text-purple-400" />;
      case "target":
        return <Server className="w-5 h-5 text-rose-400" />;
      case "database":
        return <Cpu className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-elevated border-b border-border">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">
            Visual Attack & Defense Network Graph
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/20">
            Subnet: 10.10.0.0/16
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> 5 Nodes Active
          </span>
        </div>
      </div>

      {/* Canvas & Details */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
        {/* Visual Graph View */}
        <div className="md:col-span-2 p-6 bg-surface/50 relative flex flex-col justify-between overflow-hidden">
          {/* Subnet Labels */}
          <div className="absolute top-3 left-3 text-[11px] text-foreground-muted font-mono bg-surface-elevated px-2.5 py-1 rounded border border-border">
            VLAN 10: DMZ Zone (10.10.10.0/24)
          </div>

          {/* Node Cards */}
          <div className="flex-1 flex flex-col justify-center items-center gap-6 py-6">
            {/* Top Tier: Attacker & Gateway */}
            <div className="flex items-center justify-center gap-12 w-full">
              {mockNodes.slice(0, 2).map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 cursor-pointer w-44 ${
                    selectedNode.id === node.id
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                      : "bg-surface-elevated border-border hover:border-foreground-muted"
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-surface border border-border">
                    {getRoleIcon(node.role)}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                      {node.name}
                    </div>
                    <div className="text-[10px] font-mono text-primary font-bold">
                      {node.ip}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Connecting Line Visual */}
            <div className="w-0.5 h-8 bg-primary/30 my-[-8px]"></div>

            {/* Middle Tier: Router */}
            <button
              onClick={() => setSelectedNode(mockNodes[2])}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 cursor-pointer w-44 ${
                selectedNode.id === mockNodes[2].id
                  ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                  : "bg-surface-elevated border-border hover:border-foreground-muted"
              }`}
            >
              <div className="p-2.5 rounded-lg bg-surface border border-border">
                {getRoleIcon(mockNodes[2].role)}
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                  {mockNodes[2].name}
                </div>
                <div className="text-[10px] font-mono text-primary font-bold">
                  {mockNodes[2].ip}
                </div>
              </div>
            </button>

            {/* Connecting Line Visual */}
            <div className="w-0.5 h-8 bg-primary/30 my-[-8px]"></div>

            {/* Bottom Tier: Targets */}
            <div className="flex items-center justify-center gap-12 w-full">
              {mockNodes.slice(3, 5).map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 cursor-pointer w-44 ${
                    selectedNode.id === node.id
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                      : "bg-surface-elevated border-border hover:border-foreground-muted"
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-surface border border-border">
                    {getRoleIcon(node.role)}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                      {node.name}
                    </div>
                    <div className="text-[10px] font-mono text-primary font-bold">
                      {node.ip}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div className="p-4 bg-surface flex flex-col space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Node Metadata & Ports
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                selectedNode.status === "compromised"
                  ? "bg-rose-500/20 text-rose-400"
                  : selectedNode.status === "scanned"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-sky-500/20 text-sky-400"
              }`}
            >
              {selectedNode.status}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-foreground-muted block text-[11px]">Node Identifier:</span>
              <span className="text-foreground font-semibold">{selectedNode.name}</span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[11px]">IP Address:</span>
              <span className="text-primary font-mono font-bold">{selectedNode.ip}</span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[11px]">Operating System:</span>
              <span className="text-foreground font-mono">{selectedNode.os}</span>
            </div>

            <div>
              <span className="text-foreground-muted block text-[11px] mb-1.5">Open Ports Discovered:</span>
              {selectedNode.ports.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.ports.map((port) => (
                    <span
                      key={port}
                      className="px-2 py-1 bg-surface-elevated border border-border rounded font-mono text-[11px] text-amber-400 font-bold"
                    >
                      Port {port}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-foreground-muted text-[11px] italic">No active external ports exposed</span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => handleScanNode(selectedNode.id)}
              disabled={scanning}
              className="w-full bg-primary hover:bg-primary-hover text-black py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              {scanning ? "Scanning Node Ports..." : "Run Port Scan (nmap)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
