"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Terminal,
  Clock,
  Zap,
  ChevronRight,
  Filter,
  Flame,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

const categories = ["All", "Linux basics", "Web Security", "Networking", "Privilege Escalation", "AI Security"];

const labs = [
  {
    id: "linux-navigation",
    title: "Linux Command Navigation",
    category: "Linux basics",
    difficulty: "Easy",
    timeLimit: "30 mins",
    xp: 100,
    desc: "Practice filesystem navigation using commands like cd, ls, and pwd in a sandbox container environment.",
    template: "linux-basic",
  },
  {
    id: "sql-injection-bypass",
    title: "SQL Injection Bypass",
    category: "Web Security",
    difficulty: "Medium",
    timeLimit: "45 mins",
    xp: 250,
    desc: "Bypass standard authentication mechanisms by exploiting vulnerable SQL search queries.",
    template: "web-security",
  },
  {
    id: "packet-sniffer-recon",
    title: "Packet Sniffer & Wireshark",
    category: "Networking",
    difficulty: "Medium",
    timeLimit: "60 mins",
    xp: 300,
    desc: "Intercept traffic on a local area network to capture plaintext login credentials.",
    template: "networking",
  },
  {
    id: "book-recon",
    title: "Book Recon",
    category: "OSINT",
    difficulty: "Easy",
    timeLimit: "30 mins",
    xp: 100,
    desc: "Find the flag hidden in the vulnerable web application using intelligence methodologies.",
    template: "osint-basic",
  },
  {
    id: "sql-beginner",
    title: "SQL Beginner",
    category: "Web Security",
    difficulty: "Easy",
    timeLimit: "30 mins",
    xp: 150,
    desc: "Exploit a basic SQL injection vulnerability to retrieve the flag.",
    template: "web-security",
  },
  {
    id: "ctf-101",
    title: "Capture The Flag 101",
    category: "CTF",
    difficulty: "Medium",
    timeLimit: "45 mins",
    xp: 250,
    desc: "Your first multi-step CTF challenge. Follow the breadcrumbs.",
    template: "ctf-basic",
  },
  {
    id: "linux-privesc",
    title: "Linux Privesc",
    category: "Linux",
    difficulty: "Hard",
    timeLimit: "60 mins",
    xp: 500,
    desc: "Escalate your privileges on a Linux machine to read the root flag.",
    template: "linux-basic",
  },
  {
    id: "bug-hunter",
    title: "Bug Hunter",
    category: "Web Security",
    difficulty: "Expert",
    timeLimit: "90 mins",
    xp: 1000,
    desc: "Find and chain multiple vulnerabilities in a complex web app.",
    template: "web-security",
  },
  {
    id: "root-access",
    title: "Root Access",
    category: "Privilege Escalation",
    difficulty: "Medium",
    timeLimit: "45 mins",
    xp: 300,
    desc: "Gain root access to the system using misconfigurations.",
    template: "linux-basic",
  },
  {
    id: "xss-master",
    title: "XSS Master",
    category: "Web Security",
    difficulty: "Medium",
    timeLimit: "40 mins",
    xp: 200,
    desc: "Bypass XSS filters and execute arbitrary JavaScript.",
    template: "web-security",
  },
  {
    id: "network-sniffer",
    title: "Network Sniffer",
    category: "Networking",
    difficulty: "Easy",
    timeLimit: "30 mins",
    xp: 120,
    desc: "Analyze network traffic to extract credentials.",
    template: "networking",
  },
  {
    id: "crypto-basics",
    title: "Crypto Basics",
    category: "Crypto",
    difficulty: "Easy",
    timeLimit: "30 mins",
    xp: 100,
    desc: "Decode encrypted messages using classic ciphers.",
    template: "crypto-basic",
  },
];

const difficultyColor: Record<string, "success" | "primary" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
  Expert: "danger",
};

export default function LabsCatalogPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [labList, setLabList] = useState(labs);

  useEffect(() => {
    api.getLabs()
      .then((data) => {
        if (data && data.length > 0) {
          const merged = data.map((l: { id: string; xp_reward?: number; description?: string; type?: string; container_template?: string }) => {
            const local = labs.find((loc) => loc.id === l.id);
            return {
              ...l,
              timeLimit: local ? local.timeLimit : "45 mins",
              xp: l.xp_reward || (local ? local.xp : 100),
              desc: l.description || (local ? local.desc : ""),
              category: l.type || (local ? local.category : "Web Security"),
              template: l.container_template || (local ? local.template : ""),
            };
          });
          setLabList(merged);
        }
      })
      .catch((err) => console.log("Backend offline, utilizing local lab list:", err));
  }, []);

  const filtered = labList.filter((l) => {
    const matchCategory = activeCategory === "All" || l.category === activeCategory;
    const matchSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Practice Labs</h1>
            <p className="text-foreground-secondary mt-1">
              Start isolated sandbox container environments directly in your browser.
            </p>
          </div>
          <Card padding="sm" className="flex items-center gap-3 bg-surface-elevated/50">
            <Terminal className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs text-foreground-secondary">Docker Containers Running</p>
              <p className="text-sm font-semibold text-foreground">0 active</p>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full shrink-0 transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-white"
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
            placeholder="Search labs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-[var(--radius-lg)] pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
          />
        </div>
      </div>

      {/* Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((lab, i) => (
          <motion.div
            key={lab.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover padding="lg" className="h-full flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="primary" size="sm">{lab.category}</Badge>
                  <Badge variant={difficultyColor[lab.difficulty]} size="sm">
                    {lab.difficulty}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                  {lab.title}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4 leading-relaxed line-clamp-3">
                  {lab.desc}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-4 text-xs text-foreground-muted mb-4 border-t border-border pt-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {lab.timeLimit} limit
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    {lab.xp} XP Reward
                  </span>
                </div>

                <Button
                  fullWidth
                  onClick={() => router.push(`/labs/${lab.id}`)}
                  variant="outline"
                  className="group-hover:bg-primary group-hover:text-white transition-all duration-200"
                  icon={<Terminal className="w-4 h-4" />}
                >
                  Launch Lab
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
