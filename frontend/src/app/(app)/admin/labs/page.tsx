"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal as TerminalIcon,
  Plus,
  Edit,
  Trash2,
  Clock,
  Zap,
  Server,
  XCircle,
  Shield,
  RefreshCw,
  X,
  PlayCircle,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminLabsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Labs State
  const [labsList, setLabsList] = useState<any[]>([]);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [editingLab, setEditingLab] = useState<any | null>(null);
  const [newLabForm, setNewLabForm] = useState({
    id: "",
    title: "",
    type: "Linux",
    difficulty: "Easy",
    container_template: "linux-basic",
    xp_reward: 100,
    time_limit: 1800,
    description: "",
  });

  // Active Sandbox Sessions State
  const [labSessionsList, setLabSessionsList] = useState<any[]>([]);
  const [sessionFilter, setSessionFilter] = useState("all");

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
        api.getAdminLabSessions(sessionFilter !== "all" ? sessionFilter : undefined).catch(() => []),
      ]);

      setLabsList(labs || []);
      setLabSessionsList(sessions || []);
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
  }, [sessionFilter]);

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminLab(newLabForm);
      setLabsList((prev) => [created, ...prev]);
      setShowAddLabModal(false);
      setNewLabForm({
        id: "",
        title: "",
        type: "Linux",
        difficulty: "Easy",
        container_template: "linux-basic",
        xp_reward: 100,
        time_limit: 1800,
        description: "",
      });
      alert(`Lab "${created.title}" created successfully.`);
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
      alert("Lab updated successfully.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDeleteLab = async (labId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete lab "${title}"?`)) return;
    try {
      await api.deleteAdminLab(labId);
      setLabsList((prev) => prev.filter((l) => l.id !== labId));
      alert("Lab deleted.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to forcefully destroy this active container session?")) return;
    try {
      await api.terminateAdminLabSession(sessionId);
      setLabSessionsList((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: "terminated" } : s))
      );
      alert("Container sandbox session terminated.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-surface border border-error/30 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/25 flex items-center justify-center shadow-sm shadow-blue-500/10">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Labs & Sandbox Environments</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {labsList.length} Lab Templates
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deploy hands-on offensive & defensive cloud targets, manage container templates, and terminate running worker instances.
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
            Deploy New Lab
          </Button>
        </div>
      </div>

      {/* Lab Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {labsList.map((lab) => (
          <Card
            key={lab.id}
            padding="lg"
            className="border border-[#1E293B] bg-[#0F172A] flex flex-col justify-between hover:border-slate-700 transition-all duration-150 group shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase text-blue-400">
                  {lab.container_template}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {lab.type}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {lab.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{lab.description}</p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-[#1E293B]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> {Math.round((lab.time_limit || 1800) / 60)} mins
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono font-bold text-amber-400">
                  <Zap className="w-3.5 h-3.5" /> {lab.xp_reward} XP
                </span>
                <span>•</span>
                <span className="text-slate-300 font-semibold">{lab.difficulty}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 pt-4 mt-4 border-t border-[#1E293B]">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingLab({ ...lab })}
                icon={<Edit className="w-3.5 h-3.5 text-slate-400 hover:text-white" />}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteLab(lab.id, lab.title)}
                className="hover:bg-red-500/10 text-red-400"
                icon={<Trash2 className="w-3.5 h-3.5" />}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Active Sandbox Sessions Monitor */}
      <Card padding="none" className="border border-[#1E293B] bg-[#0F172A] shadow-lg overflow-hidden">
        <div className="p-4 border-b border-[#1E293B] bg-[#0C1222] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" /> Live Ephemeral Container Sandbox Sessions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active containerized Docker nodes allocated to platform learners in real time.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#0F172A] p-1 rounded-lg border border-[#1E293B]">
            {["all", "running", "completed", "terminated"].map((st) => (
              <button
                key={st}
                onClick={() => setSessionFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  sessionFilter === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[#1E293B] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Learner</th>
                <th className="py-3 px-4">Lab Environment</th>
                <th className="py-3 px-4">Port / Endpoint</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Started</th>
                <th className="py-3 px-4 text-right">Force Kill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {labSessionsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No active container instances found for status &quot;{sessionFilter}&quot;.
                  </td>
                </tr>
              ) : (
                labSessionsList.map((ses) => (
                  <tr key={ses.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{ses.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{ses.user_name || "Anonymous"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{ses.user_email}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">{ses.lab_id}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{ses.container_port || "3000/TCP"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          ses.status === "running"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : ses.status === "completed"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {ses.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(ses.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ses.status === "running" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTerminateSession(ses.id)}
                          className="text-red-400 hover:bg-red-500/10 font-bold text-[11px]"
                          icon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Kill Container
                        </Button>
                      )}
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
              className="w-full max-w-lg bg-[#0F172A] rounded-2xl p-6 border border-[#1E293B] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Deploy Interactive Lab Sandbox</h3>
                <button onClick={() => setShowAddLabModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLab} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Lab Slug / Identifier *</label>
                  <input
                    required
                    type="text"
                    value={newLabForm.id}
                    onChange={(e) => setNewLabForm({ ...newLabForm, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    placeholder="e.g. sqli-error-based-bypass"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Lab Title *</label>
                  <input
                    required
                    type="text"
                    value={newLabForm.title}
                    onChange={(e) => setNewLabForm({ ...newLabForm, title: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Error-Based SQL Injection Bypass"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Environment Architecture</label>
                    <select
                      value={newLabForm.type}
                      onChange={(e) => setNewLabForm({ ...newLabForm, type: e.target.value })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="Linux">Linux Target (Terminal)</option>
                      <option value="Web">Web Application (HTTP Proxy)</option>
                      <option value="Network">Network Packet Sniffing</option>
                      <option value="SOC">SOC Log Analyzer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Difficulty Level</label>
                    <select
                      value={newLabForm.difficulty}
                      onChange={(e) => setNewLabForm({ ...newLabForm, difficulty: e.target.value })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Insane">Insane</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Docker Template</label>
                    <input
                      type="text"
                      value={newLabForm.container_template}
                      onChange={(e) => setNewLabForm({ ...newLabForm, container_template: e.target.value })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                      placeholder="linux-basic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-white">XP Reward</label>
                    <input
                      type="number"
                      value={newLabForm.xp_reward}
                      onChange={(e) => setNewLabForm({ ...newLabForm, xp_reward: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Time Limit (Sec)</label>
                    <input
                      type="number"
                      value={newLabForm.time_limit}
                      onChange={(e) => setNewLabForm({ ...newLabForm, time_limit: parseInt(e.target.value) || 1800 })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Brief Objective & Scenario</label>
                  <textarea
                    rows={3}
                    value={newLabForm.description}
                    onChange={(e) => setNewLabForm({ ...newLabForm, description: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
                    placeholder="Explore the vulnerable SQL endpoint..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddLabModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Deploy Lab
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
              className="w-full max-w-lg bg-[#0F172A] rounded-2xl p-6 border border-[#1E293B] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Edit Lab: {editingLab.title}</h3>
                <button onClick={() => setEditingLab(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateLab} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Lab Title</label>
                  <input
                    type="text"
                    value={editingLab.title}
                    onChange={(e) => setEditingLab({ ...editingLab, title: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Type</label>
                    <select
                      value={editingLab.type}
                      onChange={(e) => setEditingLab({ ...editingLab, type: e.target.value })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-bold"
                    >
                      <option value="Linux">Linux</option>
                      <option value="Web">Web</option>
                      <option value="Network">Network</option>
                      <option value="SOC">SOC</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Difficulty</label>
                    <select
                      value={editingLab.difficulty}
                      onChange={(e) => setEditingLab({ ...editingLab, difficulty: e.target.value })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-bold"
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
                    <label className="font-semibold text-white">XP Reward</label>
                    <input
                      type="number"
                      value={editingLab.xp_reward}
                      onChange={(e) => setEditingLab({ ...editingLab, xp_reward: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Time Limit (Sec)</label>
                    <input
                      type="number"
                      value={editingLab.time_limit}
                      onChange={(e) => setEditingLab({ ...editingLab, time_limit: parseInt(e.target.value) || 1800 })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Description</label>
                  <textarea
                    rows={3}
                    value={editingLab.description || ""}
                    onChange={(e) => setEditingLab({ ...editingLab, description: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
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
