"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Globe,
  Clock,
  Zap,
  ChevronRight,
  Filter,
  Flame,
  Lock,
  Terminal as TerminalIcon,
  Network,
  ShieldAlert,
  Server,
  Layers,
  Cpu
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore, isUserSubscribed } from "@/lib/authStore";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import SubscriptionPaywallModal from "@/components/subscription/SubscriptionPaywallModal";

const categories = ["All", "Linux", "Web Security", "Networking", "SOC & SIEM", "Cloud & Containers"];

export interface LabWorkbenchItem {
  id: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  timeLimit: string;
  xp: number;
  desc: string;
  tools: string[];
  template: string;
}

const handsOnLabs: LabWorkbenchItem[] = [
  {
    id: "linux-navigation",
    title: "Linux Command & Shell Mastery",
    category: "Linux",
    difficulty: "Easy",
    timeLimit: "30 mins",
    xp: 100,
    desc: "Hands-on Linux PTY shell. Practice directory navigation, file permissions, pipe redirection, and custom bash scripts.",
    tools: ["Linux PTY", "Bash CLI", "File Explorer"],
    template: "linux-basic",
  },
  {
    id: "sql-injection-bypass",
    title: "SQL Injection Authentication Bypass",
    category: "Web Security",
    difficulty: "Medium",
    timeLimit: "45 mins",
    xp: 250,
    desc: "Interactive Web Security workbench. Inspect HTTP requests with the Web Proxy Repeater, tamper headers, and extract database tables.",
    tools: ["Web Proxy Repeater", "Header Tamper", "SQLi Inspector"],
    template: "web-security",
  },
  {
    id: "packet-sniffer-recon",
    title: "Wireshark Packet Sniffing & ARP Topology",
    category: "Networking",
    difficulty: "Medium",
    timeLimit: "60 mins",
    xp: 300,
    desc: "Real-time Attack Network Topology Graph. Visualize subnet routers, inspect promiscuous mode PCAPs, and analyze rogue ARP frames.",
    tools: ["Network Topology Graph", "TCPDump Stream", "Subnet Map"],
    template: "networking",
  },
  {
    id: "siem-soc-investigation",
    title: "SOC SIEM Syslog & Threat Hunting",
    category: "SOC & SIEM",
    difficulty: "Medium",
    timeLimit: "45 mins",
    xp: 350,
    desc: "Full SOC Log Investigation workbench. Correlate Apache access logs, SSH brute-force attempts, and Windows Event logs for IOCs.",
    tools: ["SOC Log Analyzer", "SIEM Filter", "IOC Hunter"],
    template: "soc-analyst",
  },
  {
    id: "container-sandbox-escape",
    title: "Docker Container Sandbox Escape",
    category: "Cloud & Containers",
    difficulty: "Hard",
    timeLimit: "60 mins",
    xp: 500,
    desc: "Investigate misconfigured Docker daemon sockets (`/var/run/docker.sock`), abuse SYS_PTRACE capabilities, and break out to host root.",
    tools: ["Docker CLI", "Linux PTY", "Privesc Scanner"],
    template: "container-sandbox",
  },
  {
    id: "xss-filter-bypass",
    title: "Cross-Site Scripting (XSS) Sanitization",
    category: "Web Security",
    difficulty: "Medium",
    timeLimit: "40 mins",
    xp: 200,
    desc: "Tamper with DOM contexts, evade WAF keyword filters, and craft cookie-stealing payloads using the Web Proxy Inspector.",
    tools: ["Web Proxy Inspector", "DOM Analyzer", "Payload Tester"],
    template: "web-security",
  },
  {
    id: "cloud-iam-misconfig",
    title: "Cloud Security & IAM Least Privilege",
    category: "Cloud & Containers",
    difficulty: "Medium",
    timeLimit: "45 mins",
    xp: 320,
    desc: "Audit permissive Cloud IAM policies (`*` wildcard permissions), identify privilege escalation paths, and enforce least privilege.",
    tools: ["Cloud IAM Inspector", "Policy Auditor", "Terminal"],
    template: "cloud-security",
  },
  {
    id: "network-pivot-defense",
    title: "Subnet Pivoting & Firewall Hardening",
    category: "Networking",
    difficulty: "Hard",
    timeLimit: "60 mins",
    xp: 450,
    desc: "Map multi-tier DMZ network graphs, configure iptables firewall rules, and establish encrypted SSH dynamic SOCKS tunnels.",
    tools: ["Network Topology Graph", "SSH Tunnel", "iptables Hardening"],
    template: "networking",
  },
];

const difficultyColor: Record<string, "success" | "primary" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "primary",
  Hard: "warning",
  Expert: "danger",
};

export default function PracticeLabsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [labList, setLabList] = useState<LabWorkbenchItem[]>(handsOnLabs);
  const [paywallModalOpen, setPaywallModalOpen] = useState(false);
  const [selectedLabForPaywall, setSelectedLabForPaywall] = useState<string | undefined>(undefined);

  const subscribed = isUserSubscribed(user);

  const filtered = labList.filter((l) => {
    let matchCategory = activeCategory === "All";
    if (!matchCategory) {
      const cat = (l.category || "").toLowerCase();
      const act = activeCategory.toLowerCase();
      matchCategory = cat === act || cat.includes(act) || act.includes(cat);
    }

    const labTitle = (l.title || "").toLowerCase();
    const labDesc = (l.desc || "").toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || labTitle.includes(q) || labDesc.includes(q);
    return matchCategory && matchSearch;
  });

  const handleLaunchLab = (labId: string, labTitle: string) => {
    if (!subscribed) {
      setSelectedLabForPaywall(labTitle);
      setPaywallModalOpen(true);
      return;
    }
    router.push(`/labs/${labId}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Interactive Hands-On Labs</h1>
              <Badge variant="primary" size="sm" className="font-mono uppercase text-[10px] tracking-wider">
                Live Workbenches
              </Badge>
            </div>
            <p className="text-foreground-secondary mt-1">
              Sandboxed Linux terminals, HTTP web proxy repeaters, attack network topology graphs, and SOC SIEM log analyzers.
            </p>
          </div>
          <Card padding="sm" className="flex items-center gap-3 bg-surface-elevated/50">
            <Globe className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs text-foreground-secondary">Security Tooling</p>
              <p className="text-sm font-semibold text-foreground">
                {subscribed ? "Live Workbenches Ready" : "Pro Subscription Required"}
              </p>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Subscription Banner for Free users */}
      {!subscribed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <SubscriptionBanner type="labs" />
        </motion.div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full shrink-0 transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-surface-elevated text-foreground-secondary hover:text-foreground border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search hands-on labs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-[var(--radius-lg)] pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
          />
        </div>
      </div>

      {/* Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((lab, i) => (
          <motion.div
            key={lab.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover padding="lg" className="h-full flex flex-col group relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="primary" size="sm">{lab.category}</Badge>
                <Badge variant={difficultyColor[lab.difficulty]} size="sm">
                  {lab.difficulty}
                </Badge>
              </div>

              <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {lab.title}
              </h3>
              
              <p className="text-xs sm:text-sm text-foreground-secondary mb-4 flex-1 leading-relaxed">
                {lab.desc}
              </p>

              {/* Toolset Chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {lab.tools.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-primary/20 text-primary"
                  >
                    ⚡ {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-foreground-muted mb-4 pt-2 border-t border-border/50">
                <span className="flex items-center gap-1 font-mono font-bold text-primary">
                  <Zap className="w-3.5 h-3.5" />
                  +{lab.xp} XP
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lab.timeLimit}
                </span>
              </div>

              <Button
                variant={subscribed ? "primary" : "outline"}
                size="sm"
                fullWidth
                onClick={() => handleLaunchLab(lab.id, lab.title)}
                icon={subscribed ? <TerminalIcon className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                className="font-semibold shadow-md"
              >
                {subscribed ? "Launch Lab Workbench" : "Unlock with Pro"}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Paywall Modal */}
      <SubscriptionPaywallModal
        isOpen={paywallModalOpen}
        onClose={() => setPaywallModalOpen(false)}
        title="Unlock Interactive Labs"
        resourceName={selectedLabForPaywall}
      />
    </div>
  );
}
