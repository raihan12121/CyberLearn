"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Terminal as TerminalIcon,
  DollarSign,
  Activity,
  Server,
  Database,
  ArrowUpRight,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Eye,
  BadgeCheck,
  Zap,
  Check,
  X,
  Layers,
  Cpu,
  HardDrive,
  Radio,
} from "lucide-react";
import { Card, Badge, ProgressBar, Button, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

const DEFAULT_STATS = [
  { label: "Total Registered Users", value: "1", change: "+100% active", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { label: "Active Sandboxes", value: "4", change: "42% CPU load", icon: TerminalIcon, color: "text-accent", bg: "bg-accent/10" },
  { label: "Completed Labs", value: "0", change: "Flag submissions active", icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
  { label: "System Health", value: "99.9%", change: "0 active alerts", icon: Activity, color: "text-success", bg: "bg-success/10" },
];

const DEFAULT_CONTAINERS = [
  { name: "linux-navigation-sandbox", users: 34, status: "Healthy", cpu: "12%", memory: "1.2 GB", port: "3001/TCP" },
  { name: "sqli-bypass-sandbox", users: 28, status: "Healthy", cpu: "24%", memory: "2.1 GB", port: "3002/TCP" },
  { name: "wireshark-sniffer-sandbox", users: 15, status: "Healthy", cpu: "8%", memory: "890 MB", port: "3003/TCP" },
  { name: "cron-privesc-sandbox", users: 7, status: "Healthy", cpu: "65%", memory: "1.8 GB", port: "3004/TCP" },
];

const DEFAULT_ERRORS = [
  { source: "Auth Service", msg: "Admin session authenticated successfully.", level: "Low", time: "Just now" },
  { source: "Container Manager", msg: "Docker container pool running active sandboxes.", level: "Low", time: "12m ago" },
  { source: "Lab DB", msg: "Database connection pool healthy.", level: "Low", time: "42m ago" },
];

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState(tabParam);
  const [authorized, setAuthorized] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [statsData, setStatsData] = useState(DEFAULT_STATS);
  const [containerStatus, setContainerStatus] = useState(DEFAULT_CONTAINERS);
  const [recentErrors, setRecentErrors] = useState(DEFAULT_ERRORS);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [resources, setResources] = useState({ cpu: 42, ram: 64, storage: 78, db_conn: 14 });
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Sync tab with URL searchParams
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const loadAdminData = () => {
    setLoading(true);
    api.getMe()
      .then((user) => {
        if (user.role !== "admin") {
          setUnauthorized(true);
          setLoading(false);
        } else {
          setAuthorized(true);

          // 1. Load Metrics
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
            })
            .catch((err) => console.warn("Backend metrics offline:", err));

          // 2. Load KYC Verifications
          api.getAdminVerifications()
            .then((vList) => {
              if (vList) setVerifications(vList);
            })
            .catch((e) => console.log("Failed to load NID verifications:", e));

          // 3. Load All Users
          api.getAdminUsers()
            .then((uList) => {
              if (uList) setUsersList(uList);
            })
            .catch((e) => console.log("Failed to load admin users:", e))
            .finally(() => setLoading(false));
        }
      })
      .catch((err) => {
        console.error("Auth error:", err);
        router.push("/login");
      });
  };

  useEffect(() => {
    loadAdminData();
  }, [router]);

  const handleReview = async (userId: string, newStatus: "verified" | "rejected") => {
    try {
      setReviewingId(userId);
      const updated = await api.reviewNidVerification(userId, { status: newStatus });
      setVerifications((prev) =>
        prev.map((v) => (v.user_id === userId ? updated : v))
      );
    } catch (e: any) {
      alert(`Review error: ${e.message}`);
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-foreground-muted tracking-wide">
          Loading Administrator Control Center...
        </p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card padding="lg" className="max-w-md text-center space-y-4 border-error/30 bg-surface">
          <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto border border-error/30">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            You do not have administrative credentials to access this management console.
          </p>
          <Button onClick={() => router.push("/dashboard")} size="sm" className="mx-auto">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingCount = verifications.filter((v) => v.verification_status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Admin Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Control Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                Live Admin Portal
              </span>
            </div>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Manage platform users, inspect server telemetry, and review student KYC verification requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAdminData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card padding="md" className="space-y-3 bg-surface border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground-secondary">{stat.label}</span>
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">{stat.value}</span>
                  <span className="text-[11px] font-medium text-foreground-muted">{stat.change}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "Overview & Infrastructure", icon: Layers },
          { id: "users", label: `User Management (${usersList.length})`, icon: Users },
          {
            id: "verifications",
            label: "KYC Verification Queue",
            icon: BadgeCheck,
            badge: pendingCount > 0 ? `${pendingCount} Pending` : undefined,
          },
          { id: "containers", label: "Active Sandboxes", icon: TerminalIcon },
          { id: "telemetry", label: "System Telemetry", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.push(`/admin?tab=${tab.id}`);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : ""}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & INFRASTRUCTURE */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Server Resources Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card padding="lg" className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Cluster Resource Telemetry</h3>
                </div>
                <span className="text-[11px] font-mono text-success flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  ONLINE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-surface-elevated/40 rounded-xl border border-border/40 space-y-2">
                  <p className="text-xs text-foreground-muted">CPU Load</p>
                  <p className="text-xl font-bold text-foreground">{resources.cpu}%</p>
                  <ProgressBar value={resources.cpu} variant="primary" size="sm" />
                </div>
                <div className="p-3 bg-surface-elevated/40 rounded-xl border border-border/40 space-y-2">
                  <p className="text-xs text-foreground-muted">Memory RAM</p>
                  <p className="text-xl font-bold text-foreground">{resources.ram}%</p>
                  <ProgressBar value={resources.ram} variant="gradient" size="sm" />
                </div>
                <div className="p-3 bg-surface-elevated/40 rounded-xl border border-border/40 space-y-2">
                  <p className="text-xs text-foreground-muted">Disk Storage</p>
                  <p className="text-xl font-bold text-foreground">{resources.storage}%</p>
                  <ProgressBar value={resources.storage} variant="warning" size="sm" />
                </div>
                <div className="p-3 bg-surface-elevated/40 rounded-xl border border-border/40 space-y-2">
                  <p className="text-xs text-foreground-muted">DB Connections</p>
                  <p className="text-xl font-bold text-foreground">{resources.db_conn} / 100</p>
                  <ProgressBar value={resources.db_conn} variant="success" size="sm" />
                </div>
              </div>

              {/* Containers Overview Mini Table */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-foreground-secondary mb-3 uppercase tracking-wider">
                  Live Container Sandboxes
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-border text-foreground-muted">
                      <tr>
                        <th className="pb-2 font-semibold">Container Name</th>
                        <th className="pb-2 font-semibold">Status</th>
                        <th className="pb-2 font-semibold">Attached Users</th>
                        <th className="pb-2 font-semibold">CPU</th>
                        <th className="pb-2 font-semibold">Memory</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {containerStatus.map((c) => (
                        <tr key={c.name} className="hover:bg-surface-elevated/40">
                          <td className="py-2.5 font-mono text-primary font-medium">{c.name}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2.5 font-semibold text-foreground">{c.users} students</td>
                          <td className="py-2.5 font-mono text-foreground-secondary">{c.cpu}</td>
                          <td className="py-2.5 font-mono text-foreground-secondary">{c.memory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Quick Actions & Pending Verifications Card */}
            <Card padding="lg" className="space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-amber-400" />
                  Verification Queue
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {pendingCount} student KYC submissions waiting for audit.
                </p>
              </div>

              <div className="space-y-3">
                {verifications.slice(0, 3).map((v) => (
                  <div
                    key={v.user_id}
                    className="p-3 rounded-xl bg-surface-elevated/40 border border-border/40 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">{v.full_name || v.email}</p>
                      <p className="text-[10px] font-mono text-foreground-muted">NID: {v.nid_number || "Pending Doc"}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab("verifications")}
                      className="text-xs"
                    >
                      Inspect
                    </Button>
                  </div>
                ))}

                {verifications.length === 0 && (
                  <div className="py-6 text-center text-xs text-foreground-muted">
                    No pending ID verification requests.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  fullWidth
                  onClick={() => setActiveTab("users")}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  Manage All Registered Users
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === "users" && (
        <Card padding="lg" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Registered User Database</h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Total {usersList.length} accounts registered on CyberLearn.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border text-foreground-muted font-semibold">
                <tr>
                  <th className="py-3 px-2">User Details</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">XP Progress</th>
                  <th className="py-3 px-2">NID Verification</th>
                  <th className="py-3 px-2">Registered Date</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-elevated/40">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name || u.email} src={u.avatar_url} size="sm" />
                        <div>
                          <p className="font-bold text-foreground">{u.full_name || "Anonymous User"}</p>
                          <p className="text-[11px] text-foreground-muted font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          u.role === "admin"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : u.role === "instructor"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-primary flex items-center gap-1 font-mono">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        {u.xp ? u.xp.toLocaleString() : 0} XP
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          u.verification_status === "verified"
                            ? "bg-success/10 text-success border-success/30"
                            : u.verification_status === "rejected"
                            ? "bg-error/10 text-error border-error/30"
                            : u.verification_status === "pending"
                            ? "bg-warning/10 text-warning border-warning/30 animate-pulse"
                            : "bg-surface-elevated text-foreground-muted border-border"
                        }`}
                      >
                        {u.verification_status || "unverified"}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-foreground-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/portfolio/${u.username || u.email.split("@")[0]}`)}
                        className="text-xs text-primary"
                        icon={<ExternalLink className="w-3 h-3" />}
                      >
                        Portfolio
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: KYC / NID VERIFICATION QUEUE */}
      {activeTab === "verifications" && (
        <Card padding="lg" className="space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Student KYC & NID Verification Queue</h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Review submitted National ID documents to mint verified credential certificates.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {pendingCount} Pending Reviews
            </span>
          </div>

          {verifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-foreground-muted">
                <CheckCircle2 className="w-6 h-6 text-success opacity-60" />
              </div>
              <p className="text-sm font-bold text-foreground">Queue is Clear</p>
              <p className="text-xs text-foreground-muted">No student KYC verification requests submitted yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifications.map((item) => (
                <div
                  key={item.user_id}
                  className="p-4 rounded-2xl bg-surface-elevated/40 border border-border space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.full_name || "Unnamed Student"}</h4>
                      <p className="text-xs font-mono text-foreground-muted">{item.email}</p>
                      <p className="text-xs font-bold text-primary mt-1">NID: {item.nid_number}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                        item.verification_status === "verified"
                          ? "bg-success/10 text-success border-success/30"
                          : item.verification_status === "rejected"
                          ? "bg-error/10 text-error border-error/30"
                          : "bg-warning/10 text-warning border-warning/30 animate-pulse"
                      }`}
                    >
                      {item.verification_status}
                    </span>
                  </div>

                  {/* Document Thumbnails */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {item.nid_front_image ? (
                      <div
                        onClick={() => setPreviewImage(item.nid_front_image)}
                        className="cursor-pointer group relative rounded-xl overflow-hidden border border-border bg-black/40 h-28 flex items-center justify-center"
                      >
                        <img
                          src={item.nid_front_image}
                          alt="Front NID"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                          <Eye className="w-3.5 h-3.5" /> Preview Front
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 bg-surface h-28 flex items-center justify-center text-[10px] text-foreground-muted">
                        No Front Image
                      </div>
                    )}

                    {item.nid_back_image ? (
                      <div
                        onClick={() => setPreviewImage(item.nid_back_image)}
                        className="cursor-pointer group relative rounded-xl overflow-hidden border border-border bg-black/40 h-28 flex items-center justify-center"
                      >
                        <img
                          src={item.nid_back_image}
                          alt="Back NID"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                          <Eye className="w-3.5 h-3.5" /> Preview Back
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 bg-surface h-28 flex items-center justify-center text-[10px] text-foreground-muted">
                        No Back Image
                      </div>
                    )}
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => handleReview(item.user_id, "verified")}
                      disabled={reviewingId === item.user_id}
                      className="bg-success hover:bg-success/90 text-white font-bold text-xs"
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve NID
                    </Button>
                    <Button
                      size="sm"
                      fullWidth
                      variant="outline"
                      onClick={() => handleReview(item.user_id, "rejected")}
                      disabled={reviewingId === item.user_id}
                      className="border-error/40 text-error hover:bg-error/10 font-bold text-xs"
                      icon={<X className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: ACTIVE SANDBOXES */}
      {activeTab === "containers" && (
        <Card padding="lg" className="space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TerminalIcon className="w-5 h-5 text-primary" />
              Active Docker & Sandbox Pool
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Live containers allocated for hands-on CTF exercises, Web Proxy Repeater, and Linux terminals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {containerStatus.map((c) => (
              <div key={c.name} className="p-4 rounded-2xl bg-surface-elevated/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{c.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">
                    {c.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-surface rounded-lg">
                    <p className="text-[10px] text-foreground-muted">Attached</p>
                    <p className="font-bold text-foreground">{c.users} learners</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg">
                    <p className="text-[10px] text-foreground-muted">CPU Load</p>
                    <p className="font-bold text-foreground">{c.cpu}</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg">
                    <p className="text-[10px] text-foreground-muted">Memory</p>
                    <p className="font-bold text-foreground">{c.memory}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: SYSTEM TELEMETRY */}
      {activeTab === "telemetry" && (
        <Card padding="lg" className="space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Security Audit & System Events
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Real-time audit log stream from authentication and sandbox proxy engines.
            </p>
          </div>

          <div className="space-y-2.5">
            {recentErrors.map((err, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-surface-elevated/40 border border-border/50 flex items-start justify-between gap-4 font-mono text-xs"
              >
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface border border-border text-foreground">
                    {err.source}
                  </span>
                  <p className="text-foreground-secondary text-[11px] pt-1">{err.msg}</p>
                </div>
                <span className="text-[10px] text-foreground-muted shrink-0">{err.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl max-h-[85vh] bg-surface rounded-2xl p-4 border border-border shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-surface-elevated text-foreground hover:text-error transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-sm font-bold text-foreground mb-3">NID Document Inspection</h4>
              <img
                src={previewImage}
                alt="Document Full View"
                className="max-h-[70vh] w-auto rounded-xl object-contain mx-auto"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
