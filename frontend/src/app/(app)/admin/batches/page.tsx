"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  Video,
  Shield,
  RefreshCw,
  X,
  Mail,
  UserPlus,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminBatchesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Batches State
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [newBatchForm, setNewBatchForm] = useState({
    id: "",
    title: "",
    course_id: "",
    instructor_name: "Lead Security Researcher",
    max_seats: 30,
    enrolled_count: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
    schedule_text: "Mon & Wed • 7:00 PM EST",
    live_meeting_url: "https://meet.cyberlearn.io/live",
    is_active: true,
  });

  // Batch Roster State
  const [activeRoster, setActiveRoster] = useState<{ batch: any; students: any[] } | null>(null);
  const [enrollEmail, setEnrollEmail] = useState("");

  const loadBatchesAndCourses = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [batches, courses] = await Promise.all([
        api.getAdminBatches().catch(() => []),
        api.getAdminCourses().catch(() => []),
      ]);

      setBatchesList(batches || []);
      setCoursesList(courses || []);
    } catch (err: any) {
      console.error("Failed to load batches:", err);
      if (err?.message?.includes("403")) {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBatchesAndCourses();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminBatch(newBatchForm);
      setBatchesList((prev) => [created, ...prev]);
      setShowAddBatchModal(false);
      setNewBatchForm({
        id: "",
        title: "",
        course_id: "",
        instructor_name: "Lead Security Researcher",
        max_seats: 30,
        enrolled_count: 0,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
        schedule_text: "Mon & Wed • 7:00 PM EST",
        live_meeting_url: "https://meet.cyberlearn.io/live",
        is_active: true,
      });
      alert(`Batch "${created.title}" created successfully.`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    try {
      const updated = await api.updateAdminBatch(editingBatch.id, editingBatch);
      setBatchesList((prev) => prev.map((b) => (b.id === editingBatch.id ? { ...b, ...updated } : b)));
      setEditingBatch(null);
      alert("Batch updated successfully.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDeleteBatch = async (batchId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete cohort "${title}"?`)) return;
    try {
      await api.deleteAdminBatch(batchId);
      setBatchesList((prev) => prev.filter((b) => b.id !== batchId));
      if (activeRoster?.batch.id === batchId) {
        setActiveRoster(null);
      }
      alert("Cohort batch deleted.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleOpenRoster = async (batch: any) => {
    try {
      const students = await api.getAdminBatchStudents(batch.id);
      setActiveRoster({ batch, students: students || [] });
    } catch (e: any) {
      alert(`Failed to load roster: ${e.message}`);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoster || !enrollEmail.trim()) return;
    try {
      const res = await api.enrollAdminBatchStudent(activeRoster.batch.id, { email: enrollEmail.trim() });
      setActiveRoster((prev) => (prev ? { ...prev, students: [res.student, ...prev.students] } : null));
      setBatchesList((prev) =>
        prev.map((b) =>
          b.id === activeRoster.batch.id ? { ...b, enrolled_count: (b.enrolled_count || 0) + 1 } : b
        )
      );
      setEnrollEmail("");
      alert(`Student enrolled successfully.`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleRemoveStudent = async (userId: string) => {
    if (!activeRoster) return;
    if (!confirm("Are you sure you want to unenroll this student?")) return;
    try {
      await api.removeAdminBatchStudent(activeRoster.batch.id, userId);
      setActiveRoster((prev) =>
        prev ? { ...prev, students: prev.students.filter((s) => s.id !== userId) } : null
      );
      setBatchesList((prev) =>
        prev.map((b) =>
          b.id === activeRoster.batch.id ? { ...b, enrolled_count: Math.max(0, (b.enrolled_count || 1) - 1) } : b
        )
      );
      alert("Student unenrolled.");
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
          Administrative privileges required to access Cohort & Batch schedules.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-sky-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-sm shadow-cyan-500/10">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Cohorts & Live Batches</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {batchesList.length} Cohorts
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Manage instructor-led cohorts, live video sync schedules, seat capacities, and student rosters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBatchesAndCourses}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Batches"}
          </Button>
          <Button size="sm" onClick={() => setShowAddBatchModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Create Cohort
          </Button>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {batchesList.map((b) => (
          <Card
            key={b.id}
            padding="lg"
            hover
            className="flex flex-col justify-between bg-surface border-border hover:border-cyan-400/50 shadow-md group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {b.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    b.is_active
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-surface-bright text-foreground-muted border-border"
                  }`}
                >
                  {b.is_active ? "Enrolling" : "Closed"}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-cyan-400 transition-colors">
                  {b.title}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5 font-medium">Instructor: {b.instructor_name}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border text-xs text-foreground-muted">
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>{b.start_date} → {b.end_date}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-foreground-secondary">{b.schedule_text}</span>
                </p>
                {b.live_meeting_url && (
                  <p className="flex items-center gap-2 truncate">
                    <Video className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-sky-400 font-mono text-[11px] truncate">{b.live_meeting_url}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-foreground-muted flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-cyan-400" /> Roster Capacity:
                </span>
                <span className="font-mono font-bold text-foreground">
                  {b.enrolled_count || 0} / {b.max_seats} Seats
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenRoster(b)}
                icon={<Users className="w-3.5 h-3.5" />}
              >
                Roster ({b.enrolled_count || 0})
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingBatch({ ...b })}
                  icon={<Edit className="w-3.5 h-3.5 text-foreground-muted hover:text-cyan-400" />}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteBatch(b.id, b.title)}
                  className="hover:bg-rose-500/10 text-rose-400"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Batch Modal */}
      <AnimatePresence>
        {showAddBatchModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Schedule Live Cohort Batch</h3>
                <button onClick={() => setShowAddBatchModal(false)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Cohort Code / Slug *</label>
                  <input
                    required
                    type="text"
                    value={newBatchForm.id}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, id: e.target.value.toUpperCase().replace(/\s+/g, "-") })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. BATCH-2026-FALL"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Cohort Title *</label>
                  <input
                    required
                    type="text"
                    value={newBatchForm.title}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Offensive Security Elite Cohort #4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Track Course</label>
                    <select
                      value={newBatchForm.course_id}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, course_id: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-medium"
                    >
                      <option value="">Standalone Bootcamp</option>
                      {coursesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Instructor Name</label>
                    <input
                      type="text"
                      value={newBatchForm.instructor_name}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, instructor_name: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Start Date</label>
                    <input
                      type="date"
                      value={newBatchForm.start_date}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, start_date: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">End Date</label>
                    <input
                      type="date"
                      value={newBatchForm.end_date}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, end_date: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Live Meeting Schedule</label>
                    <input
                      type="text"
                      value={newBatchForm.schedule_text}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, schedule_text: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                      placeholder="Tues & Thurs • 8 PM EST"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Max Seats</label>
                    <input
                      type="number"
                      value={newBatchForm.max_seats}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, max_seats: parseInt(e.target.value) || 20 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Live Meeting URL (Zoom/Meet/Discord)</label>
                  <input
                    type="url"
                    value={newBatchForm.live_meeting_url}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, live_meeting_url: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none"
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddBatchModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Schedule Batch
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Batch Modal */}
      <AnimatePresence>
        {editingBatch && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Edit Cohort: {editingBatch.title}</h3>
                <button onClick={() => setEditingBatch(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateBatch} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Cohort Title</label>
                  <input
                    type="text"
                    value={editingBatch.title}
                    onChange={(e) => setEditingBatch({ ...editingBatch, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Instructor</label>
                    <input
                      type="text"
                      value={editingBatch.instructor_name}
                      onChange={(e) => setEditingBatch({ ...editingBatch, instructor_name: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Max Seats</label>
                    <input
                      type="number"
                      value={editingBatch.max_seats}
                      onChange={(e) => setEditingBatch({ ...editingBatch, max_seats: parseInt(e.target.value) || 20 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Schedule Details</label>
                  <input
                    type="text"
                    value={editingBatch.schedule_text}
                    onChange={(e) => setEditingBatch({ ...editingBatch, schedule_text: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Meeting URL</label>
                  <input
                    type="url"
                    value={editingBatch.live_meeting_url || ""}
                    onChange={(e) => setEditingBatch({ ...editingBatch, live_meeting_url: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingBatch(null)}>
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

      {/* Batch Roster Drawer / Modal */}
      <AnimatePresence>
        {activeRoster && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Enrolled Roster: {activeRoster.batch.title}
                  </h3>
                  <p className="text-xs text-foreground-muted font-mono">{activeRoster.batch.id}</p>
                </div>
                <button onClick={() => setActiveRoster(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Direct Student Enrollment Form */}
              <form onSubmit={handleEnrollStudent} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                  <input
                    required
                    type="email"
                    placeholder="Enter student email to enroll..."
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <Button type="submit" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />}>
                  Enroll Student
                </Button>
              </form>

              {/* Enrolled Students Table */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {activeRoster.students.length === 0 ? (
                  <div className="py-12 text-center text-xs text-foreground-muted">
                    No students enrolled in this cohort yet. Enter an email above to grant instant access.
                  </div>
                ) : (
                  activeRoster.students.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 rounded-xl bg-surface-elevated border border-border flex items-center justify-between hover:border-border-hover transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{student.full_name || student.username}</p>
                        <p className="text-[11px] text-foreground-muted font-mono">{student.email}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {student.xp || 0} XP
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveStudent(student.id)}
                          className="hover:bg-rose-500/10 text-rose-400"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
