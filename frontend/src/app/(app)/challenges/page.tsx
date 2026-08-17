"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Zap,
  Users,
  Clock,
  ChevronRight,
  Flag,
  Star,
} from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";

const categories = ["All", "Web", "Network", "Linux", "Crypto", "Forensics", "OSINT"];

const mockChallenges = [
  {
    id: "book-recon",
    title: "Book Recon",
    category: "OSINT",
    difficulty: "Easy",
    xp: 100,
    solved: 1234,
    completion: 73,
    desc: "Find the flag hidden in the vulnerable web application.",
    tags: ["recon", "osint"],
  },
  {
    id: "sql-beginner",
    title: "SQL Beginner",
    category: "Web Security",
    difficulty: "Easy",
    xp: 150,
    solved: 980,
    completion: 58,
    desc: "Exploit a basic SQL injection vulnerability to retrieve the flag.",
    tags: ["sql", "injection"],
  },
  {
    id: "ctf-101",
    title: "Capture The Flag 101",
    category: "CTF",
    difficulty: "Medium",
    xp: 250,
    solved: 567,
    completion: 42,
    desc: "Your first multi-step CTF challenge. Follow the breadcrumbs.",
    tags: ["ctf", "multi-step"],
  },
  {
    id: "linux-privesc",
    title: "Linux Privesc",
    category: "Linux",
    difficulty: "Hard",
    xp: 500,
    solved: 234,
    completion: 28,
    desc: "Escalate your privileges on a Linux machine to read the root flag.",
    tags: ["linux", "privilege-escalation"],
  },
  {
    id: "bug-hunter",
    title: "Bug Hunter",
    category: "Web Security",
    difficulty: "Expert",
    xp: 1000,
    solved: 89,
    completion: 12,
    desc: "Find and chain multiple vulnerabilities in a complex web app.",
    tags: ["bug-bounty", "chaining"],
  },
  {
    id: "root-access",
    title: "Root Access",
    category: "Privilege Escalation",
    difficulty: "Medium",
    xp: 300,
    solved: 445,
    completion: 35,
    desc: "Gain root access to the system using misconfigurations.",
    tags: ["root", "misconfig"],
  },
  {
    id: "xss-master",
    title: "XSS Master",
    category: "Web Security",
    difficulty: "Medium",
    xp: 200,
    solved: 678,
    completion: 45,
    desc: "Bypass XSS filters and execute arbitrary JavaScript.",
    tags: ["xss", "filter-bypass"],
  },
  {
    id: "network-sniffer",
    title: "Network Sniffer",
    category: "Networking",
    difficulty: "Easy",
    xp: 120,
    solved: 1100,
    completion: 65,
    desc: "Analyze network traffic to extract credentials.",
    tags: ["pcap", "wireshark"],
  },
  {
    id: "crypto-basics",
    title: "Crypto Basics",
    category: "Crypto",
    difficulty: "Easy",
    xp: 100,
    solved: 890,
    completion: 60,
    desc: "Decode encrypted messages using classic ciphers.",
    tags: ["cipher", "encoding"],
  },
];

const difficultyColor: Record<string, "success" | "primary" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
  Expert: "danger",
};

export default function ChallengesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [challenges, setChallenges] = useState(mockChallenges);
  const [userPoints, setUserPoints] = useState(0);
  const [userSolved, setUserSolved] = useState(0);

  useEffect(() => {
    // Fetch user stats
    api.getProfileDetails()
      .then((data) => {
        if (data) {
          setUserPoints(data.xp);
          setUserSolved(data.solved_labs_count);
        }
      })
      .catch((err) => console.log("Using default user stats:", err));

    // Fetch challenges list
    api.getLabs()
      .then((data) => {
        if (data && data.length > 0) {
          const merged = data.map((l: { id: string; title: string; type?: string; difficulty?: string; xp_reward?: number; description?: string }) => {
            const local = mockChallenges.find((c) => c.id === l.id);
            return {
              id: l.id,
              title: l.title,
              category: l.type || (local ? local.category : "Web Security"),
              difficulty: l.difficulty || "Easy",
              xp: l.xp_reward || (local ? local.xp : 100),
              solved: local ? local.solved : 100,
              completion: local ? local.completion : 50,
              desc: l.description || (local ? local.desc : ""),
              tags: local ? local.tags : ["ctf"],
            };
          });
          setChallenges(merged);
        }
      })
      .catch((err) => console.log("Using local fallback challenges list:", err));
  }, []);

  const filtered = challenges.filter((c) => {
    const matchCategory = activeCategory === "All" || c.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Challenges</h1>
            <p className="text-foreground-secondary mt-1">
              Test your skills and earn rewards.
            </p>
          </div>
          <Card padding="sm" className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-foreground-secondary">My Points</p>
              <p className="text-lg font-bold text-primary">{userPoints.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-xs text-foreground-secondary">Solved</p>
              <p className="text-lg font-bold text-accent">{userSolved}</p>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Filters */}
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
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-[var(--radius-lg)] pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
          />
        </div>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((challenge, i) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover padding="lg" className="h-full flex flex-col group">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="primary" size="sm">{challenge.category}</Badge>
                <Badge variant={difficultyColor[challenge.difficulty]} size="sm">
                  {challenge.difficulty}
                </Badge>
              </div>

              <h3 className="text-base font-semibold text-foreground mb-2">
                {challenge.title}
              </h3>
              <p className="text-sm text-foreground-secondary mb-4 flex-1">
                {challenge.desc}
              </p>

              <div className="flex items-center gap-4 text-xs text-foreground-muted mb-4">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  +{challenge.xp} XP
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {challenge.solved.toLocaleString()} solved
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" />
                  {challenge.completion}%
                </span>
              </div>

              <Button
                size="sm"
                fullWidth
                onClick={() => router.push(`/labs/${challenge.id}`)}
                icon={<Flag className="w-3.5 h-3.5" />}
              >
                Start Challenge
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
