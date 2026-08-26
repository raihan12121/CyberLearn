"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal as TerminalIcon,
  Plus,
  Edit,
  Trash2,
  Cpu,
  Clock,
  Award,
  Activity,
  PowerOff,
  Shield,
  RefreshCw,
  X,
  Server,
  KeyRound,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminLabsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Labs Catalog State
  const [labsList, setLabsList] = useState<any[]>([]);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [editingLab, setEditingLab] = useState<any | null>(null);
  const [newLabForm, setNewLabForm] = useState({
    id: "",
    title: "",
    category: "web",
    difficulty: "Medium",
    points: 100,
    time_limit_minutes: 60,
    docker_image: "cyberlearn/sqli-challenge:latest",
    flag: "CYBER{sqli_injection_success}",
    description: "",
    is_active: true,
  });

  // Active Sandbox Sessions State
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  const loadLabsAndSessions = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [labs, sessions] = await Promise.all([
        api.getAdminLabs().catch(() => []),
        api.getAdminLabSessions().catch(() => []),
      ]);

      setLabsList(labs || []);
      setSessionsList(sessions || []);
    } catch (err: any) {
      console.error("Failed to load labs:", err);
      if (err?.message?.includes("403")) {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLabsAndSessions();
  }, []);

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminLab(newLabForm);
      setLabsList((prev) => [created, ...prev]);
      setShowAddLabModal(false);
      setNewLabForm({
        id: "",
        title: "",
        category: "web",
        difficulty: "Medium",
        points: 100,
        time_limit_minutes: 60,
        docker_image: "cyberlearn/sqli-challenge:latest",
        flag: "CYBER{sqli_injection_success}",
        description: "",
        is_active: true,
      });
      alert(`Lab "${created.title}" deployed.`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleUpdateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLab) return;
    try {
      const updated = await api.updateAdminLab(editingLab.id, editingLab);
      setLabsList((prev) => prev.map((l) => (l.id === editingLab.id ? { ...l, ...updated } : l)));
      setEditingLab(null);
      alert("Lab configuration updated.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDeleteLab = async (labId: string, title: string) => {
    if (!confirm(`Are you sure you want to decommission lab "${title}"?`)) return;
    try {
      await api.deleteAdminLab(labId);
      setLabsList((prev) => prev.filter((l) => l.id !== labId));
      alert("Lab decommissioned.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm("Terminate this running Docker container instance immediately?")) return;
    try {
      await api.terminateAdminLabSession(sessionId);
      setSessionsList((prev) => prev.filter((s) => s.id !== sessionId));
      alert("Container sandbox session terminated.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

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
          Administrative privileges required to access Sandbox Pools.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-sm shadow-emerald-500/10">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Labs & Ephemeral Sandboxes</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {labsList.length} Lab Templates
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Deploy isolated Docker CTF environments, manage dynamic capture flags, and monitor live container instances.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLabsAndSessions}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Sandboxes"}
          </Button>
          <Button size="sm" onClick={() => setShowAddLabModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Deploy Lab
          </Button>
        </div>
      </div>

      {/* Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {labsList.map((lab) => (
          <Card
            key={lab.id}
            padding="lg"
            hover
            className="flex flex-col justify-between bg-surface border-border hover:border-emerald-400/50 shadow-md group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {lab.category}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    lab.is_active
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-surface-bright text-foreground-muted border-border"
                  }`}
                >
                  {lab.is_active ? "Active Pool" : "Disabled"}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                  {lab.title}
                </h3>
                <p className="text-xs text-foreground-muted line-clamp-2 mt-1 leading-relaxed">{lab.description}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border text-xs text-foreground-muted">
                <p className="flex items-center gap-2 truncate font-mono text-[11px]">
                  <Server className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate text-foreground-secondary">{lab.docker_image}</span>
                </p>
                {lab.flag && (
                  <p className="flex items-center gap-2 font-mono text-[11px] text-amber-400 truncate">
                    <KeyRound className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lab.flag}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-foreground-muted pt-2 border-t border-border">
                <span className="flex items-center gap-1 font-mono font-bold text-amber-400">
                  <Award className="w-3.5 h-3.5" /> {lab.points} XP
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-400" /> {lab.time_limit_minutes} mins
                </span>
                <span>•</span>
                <span className="text-foreground-secondary font-semibold">{lab.difficulty}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-4 mt-4 border-t border-border">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingLab({ ...lab })}
                icon={<Edit className="w-3.5 h-3.5 text-foreground-muted hover:text-emerald-400" />}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteLab(lab.id, lab.title)}
                className="hover:bg-rose-500/10 text-rose-400"
                icon={<Trash2 className="w-3.5 h-3.5" />}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Active Sandbox Sessions Monitor */}
      <Card padding="none" className="border border-border bg-surface shadow-lg overflow-hidden space-y-0">
        <div className="p-4 border-b border-border bg-surface-elevated flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Live Ephemeral Container Sandboxes
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Real-time monitor of active user lab sessions, mapped ports, and immediate force termination controls.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-surface border border-border text-foreground-secondary">
            {sessionsList.length} Active Sessions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border text-foreground-muted font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Learner Account</th>
                <th className="py-3 px-4">Lab Environment</th>
                <th className="py-3 px-4">Mapped Port</th>
                <th className="py-3 px-4">Container ID</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4 text-right">Force Kill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sessionsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-foreground-muted">
                    No active student container sandboxes currently provisioned.
                  </td>
                </tr>
              ) : (
                sessionsList.map((ses) => (
                  <tr key={ses.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{ses.user_name || "Student"}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{ses.user_email || ses.user_id}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground font-mono">{ses.lab_title || ses.lab_id}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">:{ses.port || "3000"}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-foreground-muted">{ses.container_id?.slice(0, 12) || "mock-c-98a2"}</td>
                    <td className="py-3 px-4 font-mono text-foreground-muted text-[11px]">
                      {ses.created_at ? new Date(ses.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Running"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTerminateSession(ses.id)}
                        className="hover:bg-rose-500/15 text-rose-400 font-bold"
                        icon={<PowerOff className="w-3.5 h-3.5" />}
                      >
                        Kill
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Lab Modal */}
      <AnimatePresence>
        {showAddLabModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Deploy Ephemeral Lab Sandbox</h3>
                <button onClick={() => setShowAddLabModal(false)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLab} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lab Slug ID *</label>
                  <input
                    required
                    type="text"
                    value={newLabForm.id}
                    onChange={(e) => setNewLabForm({ ...newLabForm, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. sqli-union-attack"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lab Title *</label>
                  <input
                    required
                    type="text"
                    value={newLabForm.title}
                    onChange={(e) => setNewLabForm({ ...newLabForm, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. SQL Injection: UNION-Based Data Extraction"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Category</label>
                    <select
                      value={newLabForm.category}
                      onChange={(e) => setNewLabForm({ ...newLabForm, category: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-medium"
                    >
                      <option value="web">Web Security</option>
                      <option value="network">Network Penetration</option>
                      <option value="linux">Linux Privilege Escalation</option>
                      <option value="forensics">Digital Forensics</option>
                      <option value="crypto">Cryptography</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Difficulty</label>
                    <select
                      value={newLabForm.difficulty}
                      onChange={(e) => setNewLabForm({ ...newLabForm, difficulty: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-medium"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Insane">Insane</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Points (XP)</label>
                    <input
                      type="number"
                      value={newLabForm.points}
                      onChange={(e) => setNewLabForm({ ...newLabForm, points: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Time Limit (Minutes)</label>
                    <input
                      type="number"
                      value={newLabForm.time_limit_minutes}
                      onChange={(e) => setNewLabForm({ ...newLabForm, time_limit_minutes: parseInt(e.target.value) || 60 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Docker Image Registry URL *</label>
                  <input
                    required
                    type="text"
                    value={newLabForm.docker_image}
                    onChange={(e) => setNewLabForm({ ...newLabForm, docker_image: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none"
                    placeholder="cyberlearn/sqli-union:latest"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Target Flag Token *</label>
                  <input
                    required
                    type="text"
                    value={newLabForm.flag}
                    onChange={(e) => setNewLabForm({ ...newLabForm, flag: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-amber-400 font-mono focus:outline-none"
                    placeholder="CYBER{...}"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lab Mission Briefing</label>
                  <textarea
                    rows={3}
                    value={newLabForm.description}
                    onChange={(e) => setNewLabForm({ ...newLabForm, description: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    placeholder="The target endpoint contains an unparameterized SQL query..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddLabModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Deploy Lab Template
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Lab Modal */}
      <AnimatePresence>
        {editingLab && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Edit Lab: {editingLab.title}</h3>
                <button onClick={() => setEditingLab(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateLab} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lab Title</label>
                  <input
                    type="text"
                    value={editingLab.title}
                    onChange={(e) => setEditingLab({ ...editingLab, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Docker Image</label>
                    <input
                      type="text"
                      value={editingLab.docker_image}
                      onChange={(e) => setEditingLab({ ...editingLab, docker_image: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Target Flag</label>
                    <input
                      type="text"
                      value={editingLab.flag || ""}
                      onChange={(e) => setEditingLab({ ...editingLab, flag: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-amber-400 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Points (XP)</label>
                    <input
                      type="number"
                      value={editingLab.points}
                      onChange={(e) => setEditingLab({ ...editingLab, points: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Time Limit (Mins)</label>
                    <input
                      type="number"
                      value={editingLab.time_limit_minutes}
                      onChange={(e) => setEditingLab({ ...editingLab, time_limit_minutes: parseInt(e.target.value) || 60 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Mission Briefing</label>
                  <textarea
                    rows={3}
                    value={editingLab.description || ""}
                    onChange={(e) => setEditingLab({ ...editingLab, description: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingLab(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
