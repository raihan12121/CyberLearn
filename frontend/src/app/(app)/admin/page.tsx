"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Terminal as TerminalIcon,
  DollarSign,
  Activity,
  Server,
  Database,
  ArrowUpRight,
  Shield,
} from "lucide-react";
import { Card, Badge, ProgressBar, Button } from "@/components/ui";
import { api } from "@/lib/api";

const DEFAULT_STATS = [
  { label: "Total Users", value: "10,245", change: "+12% this week", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { label: "Active Sandboxes", value: "84", change: "42% CPU load", icon: TerminalIcon, color: "text-accent", bg: "bg-accent/10" },
  { label: "Completed Labs", value: "189", change: "Flag submissions active", icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
  { label: "System Health", value: "99.9%", change: "0 active alerts", icon: Activity, color: "text-success", bg: "bg-success/10" },
];

const DEFAULT_CONTAINERS = [
  { name: "linux-navigation-sandbox", users: 34, status: "Healthy", cpu: "12%", memory: "1.2 GB" },
  { name: "sqli-bypass-sandbox", users: 28, status: "Healthy", cpu: "24%", memory: "2.1 GB" },
  { name: "wireshark-sniffer-sandbox", users: 15, status: "Healthy", cpu: "8%", memory: "890 MB" },
  { name: "cron-privesc-sandbox", users: 7, status: "Healthy", cpu: "65%", memory: "1.8 GB" },
];

const DEFAULT_ERRORS = [
  { source: "Auth Service", msg: "JWT Signature verification failed from IP 192.168.1.45", level: "Medium", time: "5m ago" },
  { source: "Container Manager", msg: "Docker container pool capacity reached 90%", level: "High", time: "12m ago" },
  { source: "Lab DB", msg: "Query execution timeout on locks logs", level: "Low", time: "42m ago" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [statsData, setStatsData] = useState(DEFAULT_STATS);
  const [containerStatus, setContainerStatus] = useState(DEFAULT_CONTAINERS);
  const [recentErrors, setRecentErrors] = useState(DEFAULT_ERRORS);
  const [resources, setResources] = useState({ cpu: 42, ram: 64, storage: 78, db_conn: 14 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getMe()
      .then((user) => {
        if (user.role !== "admin") {
          setUnauthorized(true);
          setLoading(false);
        } else {
          setAuthorized(true);
          api.getAdminMetrics()
            .then((data) => {
              if (data.stats) {
                const mappedStats = data.stats.map((s: { label: string; value: string; change: string }) => {
                  let icon = Activity;
                  if (s.label === "Total Users") icon = Users;
                  else if (s.label === "Active Sandboxes") icon = TerminalIcon;
                  else if (s.label === "Completed Labs") icon = DollarSign;
                  return {
                    ...s,
                    icon,
                    color: s.label === "Total Users" ? "text-primary" : s.label === "Active Sandboxes" ? "text-accent" : s.label === "Completed Labs" ? "text-warning" : "text-success",
                    bg: s.label === "Total Users" ? "bg-primary/10" : s.label === "Active Sandboxes" ? "bg-accent/10" : s.label === "Completed Labs" ? "bg-warning/10" : "bg-success/10"
                  };
                });
                setStatsData(mappedStats);
              }
              if (data.containers) setContainerStatus(data.containers);
              if (data.errors) setRecentErrors(data.errors);
              if (data.resources) setResources(data.resources);
              setLoading(false);
            })
            .catch((err) => {
              console.warn("Backend offline, loading fallback metrics:", err);
              setLoading(false);
            });
        }
      })
      .catch((err) => {
        console.error("Auth error:", err);
        router.push("/login");
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card padding="lg" className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            You do not have administrative privileges to access the Admin Portal.
          </p>
          <Button onClick={() => router.push("/dashboard")} size="sm" className="mx-auto">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
            <p className="text-foreground-secondary mt-1 text-sm">
              Monitor cloud clusters health, manage active Docker sandboxes, and inspect error logs.
            </p>
          </div>
          <Badge variant="success" size="md" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span>K8s Node Cluster: Online</span>
          </Badge>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card padding="md" className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-foreground-secondary font-bold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
                  <span className="text-[10px] text-foreground-muted block mt-1">{stat.change}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Detail grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Containers list (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg" className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Active Container Templates</h3>
              <button className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:text-primary-hover cursor-pointer">
                Manage Pools <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted border-b border-border/60">
                    <th className="py-2.5">Template</th>
                    <th className="py-2.5">Active Users</th>
                    <th className="py-2.5">CPU Usage</th>
                    <th className="py-2.5">Memory</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  {containerStatus.map((c) => (
                    <tr key={c.name} className="hover:bg-surface-elevated/20 transition-colors">
                      <td className="py-3 font-mono text-foreground font-semibold">{c.name}</td>
                      <td className="py-3 text-foreground-secondary">{c.users} active</td>
                      <td className="py-3 text-foreground-secondary">{c.cpu}</td>
                      <td className="py-3 text-foreground-secondary">{c.memory}</td>
                      <td className="py-3 text-right">
                        <Badge variant="success" size="sm">
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Node health metrics */}
          <Card padding="lg" className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">Resource Allocation</h3>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground-secondary">CPU Node Pool Cluster</span>
                  <span className="text-foreground">{resources.cpu}% (32 Cores)</span>
                </div>
                <ProgressBar value={resources.cpu} variant="gradient" size="sm" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground-secondary">RAM Node Pool Cluster</span>
                  <span className="text-foreground">{resources.ram}% ({resources.ram} GB / 128 GB)</span>
                </div>
                <ProgressBar value={resources.ram} variant="gradient" size="sm" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground-secondary">Storage (S3 + Local persistent volumes)</span>
                  <span className="text-foreground">{resources.storage}% (1.5 TB / 2.0 TB)</span>
                </div>
                <ProgressBar value={resources.storage} variant="gradient" size="sm" />
              </div>
            </div>
          </Card>
        </div>

        {/* System alerts / logs (1 col) */}
        <div className="space-y-6">
          <Card padding="lg" className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Critical Error Logs</h3>
              <Badge variant="danger" size="sm">{recentErrors.length} Active</Badge>
            </div>

            <div className="space-y-3">
              {recentErrors.map((err, i) => (
                <div key={i} className="p-3 bg-surface-elevated/40 border border-border rounded-[var(--radius-lg)] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-foreground font-mono">{err.source}</span>
                    <Badge variant={err.level === "High" ? "danger" : err.level === "Medium" ? "warning" : "primary"} size="sm">
                      {err.level}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-foreground-secondary leading-normal font-normal">{err.msg}</p>
                  <span className="text-[9px] text-foreground-muted block mt-1">{err.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg" className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Database Pool Connections</h3>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground-secondary">Active DB connections</span>
                  <span className="text-foreground">{resources.db_conn} / 100</span>
                </div>
                <ProgressBar value={resources.db_conn} variant="primary" size="sm" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
