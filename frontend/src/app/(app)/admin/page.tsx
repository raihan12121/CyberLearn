"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  FlaskConical,
  DollarSign,
  Activity,
  Server,
  Database,
  ArrowUpRight,
  Shield,
  Clock,
  RefreshCw,
  Zap,
  Cpu,
  HardDrive,
  Radio,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Award,
  BadgeCheck,
  FileCheck,
} from "lucide-react";
import { Card, Badge, ProgressBar, Button } from "@/components/ui";
import { api } from "@/lib/api";

const DEFAULT_STATS = [
  { label: "Total Users", value: "10,245", change: "+12% this month", icon: Users, color: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/30" },
  { label: "Total Revenue", value: "$4,850.00", change: "42 active subs", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  { label: "Active Lab Sessions", value: "84", change: "42% CPU load", icon: FlaskConical, color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/30" },
  { label: "Issued Credentials", value: "189", change: "5 active tracks", icon: Award, color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
];

const DEFAULT_CONTAINERS = [
  { name: "web-security-proxy", users: 34, status: "Healthy", cpu: "12%", memory: "1.2 GB", port: "3001/TCP" },
  { name: "sqli-injection-inspector", users: 28, status: "Healthy", cpu: "24%", memory: "2.1 GB", port: "3002/TCP" },
  { name: "wireshark-log-workbench", users: 15, status: "Healthy", cpu: "8%", memory: "890 MB", port: "3003/TCP" },
  { name: "network-topology-analyzer", users: 7, status: "Healthy", cpu: "15%", memory: "1.8 GB", port: "3004/TCP" },
];

const SYSTEM_SERVICES = [
  { name: "FastAPI Core Engine", status: "Online", latency: "14ms", icon: Activity, color: "text-sky-400" },
  { name: "Security Tooling Engine", status: "Online", latency: "28ms", icon: FlaskConical, color: "text-indigo-400" },
  { name: "PostgreSQL Database", status: "Online", latency: "4ms", icon: Database, color: "text-emerald-400" },
  { name: "AI Tutor LLM Gateway", status: "Online", latency: "120ms", icon: Zap, color: "text-amber-400" },
];

const ADMIN_QUICK_LINKS = [
  { label: "User Governance", href: "/admin/users", icon: Users, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", desc: "Manage accounts, roles & subscriptions" },
  { label: "Course Curriculum", href: "/admin/courses", icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", desc: "Edit courses, modules & lessons" },
  { label: "Exams & Banks", href: "/admin/exams", icon: FileCheck, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", desc: "Question bank & pass/fail grades" },
  { label: "Live Cohorts", href: "/admin/batches", icon: GraduationCap, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", desc: "Batch schedules & rosters" },
  { label: "Security Labs", href: "/admin/labs", icon: FlaskConical, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", desc: "Lab environments & challenge sessions" },
  { label: "KYC Verification", href: "/admin/verifications", icon: BadgeCheck, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", desc: "NID identity review queue" },
  { label: "Issued Credentials", href: "/admin/certificates", icon: Award, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", desc: "Credential registry & minting" },
  { label: "Financials & Billing", href: "/admin/billing", icon: DollarSign, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20", desc: "Settled invoices & promo codes" },
];

export default function AdminOverviewPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statsData, setStatsData] = useState(DEFAULT_STATS);
  const [metricsSummary, setMetricsSummary] = useState<any>({});
  const [containerStatus, setContainerStatus] = useState(DEFAULT_CONTAINERS);
  const [resources, setResources] = useState({ cpu: 42, ram: 64, storage: 78, db_conn: 14 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const loadAdminMetrics = async () => {
    setRefreshing(true);
    try {
      const user = await api.getMe();
      if (user.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setAuthorized(true);

      const data = await api.getAdminMetrics();
      if (data.stats) {
        const mappedStats = data.stats.map((s: { label: string; value: string; change: string }) => {
          let icon = Activity;
          let color = "text-sky-400";
          let bg = "bg-sky-500/15 border-sky-500/30";
          if (s.label === "Total Users") {
            icon = Users;
            color = "text-sky-400";
            bg = "bg-sky-500/15 border-sky-500/30";
          } else if (s.label === "Total Revenue") {
            icon = DollarSign;
            color = "text-emerald-400";
            bg = "bg-emerald-500/15 border-emerald-500/30";
          } else if (s.label === "Active Lab Sessions" || s.label === "Active Sandboxes") {
            icon = FlaskConical;
            color = "text-indigo-400";
            bg = "bg-indigo-500/15 border-indigo-500/30";
          } else if (s.label === "Issued Credentials") {
            icon = Award;
            color = "text-amber-400";
            bg = "bg-amber-500/15 border-amber-500/30";
          }
          return {
            ...s,
            icon,
            color,
            bg,
          };
        });
        setStatsData(mappedStats);
      }
      if (data.summary) setMetricsSummary(data.summary);
      if (data.containers) setContainerStatus(data.containers);
      if (data.resources) setResources(data.resources);
      if (data.errors) setRecentLogs(data.errors);
    } catch (err) {
      console.error("Auth error:", err);
      router.push("/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-surface border border-rose-500/30 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground-muted">
          Administrative privileges required. Your account does not have permission to view the Admin Command Center.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-sm shadow-sky-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Overview & Cluster Health</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Live System Telemetry
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Real-time cybersecurity platform telemetry, container pool infrastructure, and platform-wide metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAdminMetrics}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Telemetry"}
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card padding="md" hover className="flex flex-col justify-between h-32 bg-surface border-border/80 hover:border-sky-400/40 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-foreground-muted text-[11px] font-bold uppercase tracking-wider mb-1">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                      {stat.value}
                    </h3>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${stat.bg} ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {stat.change}
                  </span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ADMIN_QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="p-3.5 rounded-xl bg-surface border border-border hover:border-sky-400/50 hover:bg-surface-elevated transition-all group flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${link.bg} ${link.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-foreground-muted group-hover:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-sky-400 transition-colors">
                  {link.label}
                </h4>
                <p className="text-[10px] text-foreground-muted line-clamp-1 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Health & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Container Pool & System Services */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Lab Sessions */}
          <Card padding="lg" className="border border-border bg-surface space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Interactive Practice Lab Tooling</h3>
                  <p className="text-xs text-foreground-muted">Live security challenge runners &amp; microservice metrics</p>
                </div>
              </div>
              <Badge variant="success" size="sm" dot>
                Operational
              </Badge>
            </div>

            <div className="space-y-3">
              {containerStatus.map((c, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-surface-elevated border border-border flex items-center justify-between hover:border-border-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <div>
                      <p className="text-xs font-bold text-foreground font-mono">{c.name}</p>
                      <p className="text-[11px] text-foreground-muted flex items-center gap-2">
                        <span>Port: {c.port || "3000/TCP"}</span>
                        <span>•</span>
                        <span className="text-sky-400 font-semibold">{c.users} active learners</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-xs font-bold text-foreground font-mono">{c.cpu}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{c.memory}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Core System Infrastructure Services */}
          <Card padding="lg" className="border border-border bg-surface space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400" /> Core Microservices & Heartbeats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SYSTEM_SERVICES.map((srv, idx) => {
                const Icon = srv.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-elevated border border-border flex items-center justify-between hover:border-border-hover transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg bg-surface-bright ${srv.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{srv.name}</p>
                        <p className="text-[10px] text-foreground-muted font-mono">Ping: {srv.latency}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {srv.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Platform Resources & Activity Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cluster Resource Telemetry */}
          <Card padding="lg" className="border border-border bg-surface space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" /> Compute & Memory Capacity
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" /> CPU Load Utilization
                  </span>
                  <span className="font-mono font-bold text-foreground">{resources.cpu}%</span>
                </div>
                <ProgressBar value={resources.cpu} max={100} variant={resources.cpu > 80 ? "warning" : "primary"} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" /> Memory (RAM) Allocation
                  </span>
                  <span className="font-mono font-bold text-foreground">{resources.ram}%</span>
                </div>
                <ProgressBar value={resources.ram} max={100} variant={resources.ram > 80 ? "warning" : "gradient"} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Persistent Storage
                  </span>
                  <span className="font-mono font-bold text-foreground">{resources.storage}%</span>
                </div>
                <ProgressBar value={resources.storage} max={100} variant="success" />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-foreground-muted flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-sky-400" /> Active DB Connections Pool:
                </span>
                <span className="font-mono font-bold text-foreground">{resources.db_conn} / 50</span>
              </div>
            </div>
          </Card>

          {/* Recent System Activity Logs */}
          <Card padding="lg" className="border border-border bg-surface space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Operational Event Stream
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">● Active Stream</span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {recentLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-foreground-muted">
                  No system anomalies detected. All services operating normally.
                </div>
              ) : (
                recentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-elevated border border-border space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400 font-mono text-[11px]">{log.source}</span>
                      <span className="text-[10px] text-foreground-muted">{log.time}</span>
                    </div>
                    <p className="text-foreground-secondary">{log.msg}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
