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
  ExternalLink,
  Shield,
  RefreshCw,
  X,
  Clock,
  BookOpen,
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
    name: "",
    batch_code: "",
    description: "",
    instructor_id: "",
    course_id: "",
    start_date: "",
    end_date: "",
    max_students: 50,
    meeting_link: "",
    schedule_details: "",
    is_active: true,
  });

  // Batch Roster State
  const [activeBatchStudents, setActiveBatchStudents] = useState<{ batch: any; students: any[] } | null>(null);
  const [enrollStudentEmail, setEnrollStudentEmail] = useState("");

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
        name: "",
        batch_code: "",
        description: "",
        instructor_id: "",
        course_id: "",
        start_date: "",
        end_date: "",
        max_students: 50,
        meeting_link: "",
        schedule_details: "",
        is_active: true,
      });
      alert(`Batch "${created.name}" created with code ${created.batch_code}.`);
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

  const handleDeleteBatch = async (batchId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete batch "${name}"?`)) return;
    try {
      await api.deleteAdminBatch(batchId);
      setBatchesList((prev) => prev.filter((b) => b.id !== batchId));
      if (activeBatchStudents?.batch.id === batchId) {
        setActiveBatchStudents(null);
      }
      alert("Batch deleted.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleOpenBatchStudents = async (batch: any) => {
    try {
      const students = await api.getAdminBatchStudents(batch.id);
      setActiveBatchStudents({ batch, students: students || [] });
    } catch (e: any) {
      alert(`Failed to load students: ${e.message}`);
    }
  };

  const handleEnrollBatchStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatchStudents || !enrollStudentEmail.trim()) return;
    try {
      const res = await api.enrollAdminBatchStudent(activeBatchStudents.batch.id, { email: enrollStudentEmail.trim() });
      alert(res.message || "Student enrolled successfully.");
      const updatedStudents = await api.getAdminBatchStudents(activeBatchStudents.batch.id);
      setActiveBatchStudents((prev) => (prev ? { ...prev, students: updatedStudents } : null));
      setEnrollStudentEmail("");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleRemoveBatchStudent = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this student from the batch?")) return;
    if (!activeBatchStudents) return;
    try {
      await api.removeAdminBatchStudent(activeBatchStudents.batch.id, userId);
      setActiveBatchStudents((prev) =>
        prev ? { ...prev, students: prev.students.filter((s) => s.user_id !== userId) } : null
      );
      alert("Student removed from batch.");
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
          Administrative privileges required to access Live Cohorts management.
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/25 flex items-center justify-center shadow-sm shadow-blue-500/10">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Cohorts & Live Batches</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {batchesList.length} Active Batches
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage instructor-led cohorts, schedule live bootcamps, and govern enrolled student rosters.
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
            Create Batch
          </Button>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {batchesList.map((b) => (
          <Card
            key={b.id}
            padding="lg"
            className="border border-[#1E293B] bg-[#0F172A] flex flex-col justify-between hover:border-slate-700 transition-all duration-150 group shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                  {b.batch_code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    b.is_active
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {b.is_active ? "Active" : "Archived"}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {b.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{b.description || "No description provided."}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#1E293B] text-xs text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {b.start_date ? new Date(b.start_date).toLocaleDateString() : "TBD"} –{" "}
                    {b.end_date ? new Date(b.end_date).toLocaleDateString() : "TBD"}
                  </span>
                </p>
                {b.schedule_details && (
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> {b.schedule_details}
                  </p>
                )}
                {b.meeting_link && (
                  <a
                    href={b.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-400 hover:underline truncate"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {b.meeting_link}
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1E293B]">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenBatchStudents(b)}
                icon={<Users className="w-3.5 h-3.5" />}
              >
                Roster ({b.enrolled_count || 0}/{b.max_students || 50})
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingBatch({ ...b })}
                  icon={<Edit className="w-3.5 h-3.5 text-slate-400 hover:text-white" />}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteBatch(b.id, b.name)}
                  className="hover:bg-red-500/10 text-red-400"
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
              className="w-full max-w-lg bg-[#0F172A] rounded-2xl p-6 border border-[#1E293B] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Create New Live Cohort</h3>
                <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Cohort Batch Name *</label>
                  <input
                    required
                    type="text"
                    value={newBatchForm.name}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, name: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Advanced Ethical Hacking Fall 2026"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Batch Code (Optional)</label>
                    <input
                      type="text"
                      value={newBatchForm.batch_code}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, batch_code: e.target.value.toUpperCase() })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Associated Course Track</label>
                    <select
                      value={newBatchForm.course_id}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, course_id: e.target.value })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="">None / Standalone Cohort</option>
                      {coursesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Start Date</label>
                    <input
                      type="date"
                      value={newBatchForm.start_date}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, start_date: e.target.value })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-white">End Date</label>
                    <input
                      type="date"
                      value={newBatchForm.end_date}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, end_date: e.target.value })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Max Capacity</label>
                    <input
                      type="number"
                      value={newBatchForm.max_students}
                      onChange={(e) => setNewBatchForm({ ...newBatchForm, max_students: parseInt(e.target.value) || 50 })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Live Meeting URL (Zoom / Meet / Discord)</label>
                  <input
                    type="url"
                    value={newBatchForm.meeting_link}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, meeting_link: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Schedule Times & Cadence</label>
                  <input
                    type="text"
                    value={newBatchForm.schedule_details}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, schedule_details: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
                    placeholder="e.g. Saturdays & Wednesdays @ 8:00 PM EST"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddBatchModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Create Cohort
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
              className="w-full max-w-lg bg-[#0F172A] rounded-2xl p-6 border border-[#1E293B] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Edit Cohort: {editingBatch.name}</h3>
                <button onClick={() => setEditingBatch(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateBatch} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Cohort Name</label>
                  <input
                    type="text"
                    value={editingBatch.name}
                    onChange={(e) => setEditingBatch({ ...editingBatch, name: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Schedule Details</label>
                    <input
                      type="text"
                      value={editingBatch.schedule_details || ""}
                      onChange={(e) => setEditingBatch({ ...editingBatch, schedule_details: e.target.value })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Max Capacity</label>
                    <input
                      type="number"
                      value={editingBatch.max_students || 50}
                      onChange={(e) => setEditingBatch({ ...editingBatch, max_students: parseInt(e.target.value) || 50 })}
                      className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Meeting URL</label>
                  <input
                    type="url"
                    value={editingBatch.meeting_link || ""}
                    onChange={(e) => setEditingBatch({ ...editingBatch, meeting_link: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
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

      {/* Enrolled Roster Modal */}
      <AnimatePresence>
        {activeBatchStudents && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#0F172A] rounded-2xl p-6 border border-[#1E293B] shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Enrolled Roster: {activeBatchStudents.batch.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{activeBatchStudents.batch.batch_code}</p>
                </div>
                <button onClick={() => setActiveBatchStudents(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add Student Form */}
              <form onSubmit={handleEnrollBatchStudent} className="flex items-center gap-2">
                <input
                  required
                  type="email"
                  placeholder="Enter student email to enroll..."
                  value={enrollStudentEmail}
                  onChange={(e) => setEnrollStudentEmail(e.target.value)}
                  className="flex-1 bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <Button size="sm" type="submit" icon={<Plus className="w-3.5 h-3.5" />}>
                  Enroll Student
                </Button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {activeBatchStudents.students.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No students enrolled in this batch yet.
                  </div>
                ) : (
                  activeBatchStudents.students.map((s) => (
                    <div
                      key={s.user_id}
                      className="p-3 rounded-xl bg-[#0C1222] border border-[#1E293B] flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-white">{s.full_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{s.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-blue-400 font-bold">{s.xp} XP</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveBatchStudent(s.user_id)}
                          className="text-red-400 hover:bg-red-500/10"
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
