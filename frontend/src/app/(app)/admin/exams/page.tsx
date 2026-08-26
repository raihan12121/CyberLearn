"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck,
  Plus,
  Edit,
  Trash2,
  ListOrdered,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  Shield,
  RefreshCw,
  X,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminExamsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Exams State
  const [examsList, setExamsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [newExamForm, setNewExamForm] = useState({
    id: "",
    course_id: "",
    title: "",
    description: "",
    duration_minutes: 45,
    passing_score_pct: 70,
    total_marks: 100,
    is_published: true,
  });

  // Question Bank State
  const [activeExamQuestions, setActiveExamQuestions] = useState<{ exam: any; questions: any[] } | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestionForm, setNewQuestionForm] = useState({
    question_text: "",
    question_type: "mcq",
    opt0: "",
    opt1: "",
    opt2: "",
    opt3: "",
    correct_answer: "0",
    explanation: "",
    points: 5,
    sort_order: 1,
  });

  // Submissions State
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);

  const loadExamsAndData = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [exams, courses, submissions] = await Promise.all([
        api.getAdminExams().catch(() => []),
        api.getAdminCourses().catch(() => []),
        api.getAdminExamSubmissions().catch(() => []),
      ]);

      setExamsList(exams || []);
      setCoursesList(courses || []);
      setSubmissionsList(submissions || []);
    } catch (err: any) {
      console.error("Failed to load exams:", err);
      if (err?.message?.includes("403")) {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExamsAndData();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminExam(newExamForm);
      setExamsList((prev) => [created, ...prev]);
      setShowAddExamModal(false);
      setNewExamForm({
        id: "",
        course_id: "",
        title: "",
        description: "",
        duration_minutes: 45,
        passing_score_pct: 70,
        total_marks: 100,
        is_published: true,
      });
      alert(`Exam "${created.title}" created successfully.`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    try {
      const updated = await api.updateAdminExam(editingExam.id, editingExam);
      setExamsList((prev) => prev.map((ex) => (ex.id === editingExam.id ? { ...ex, ...updated } : ex)));
      setEditingExam(null);
      alert("Exam updated successfully.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDeleteExam = async (examId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete exam "${title}"?`)) return;
    try {
      await api.deleteAdminExam(examId);
      setExamsList((prev) => prev.filter((ex) => ex.id !== examId));
      if (activeExamQuestions?.exam.id === examId) {
        setActiveExamQuestions(null);
      }
      alert("Exam deleted.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleOpenQuestions = async (exam: any) => {
    try {
      const questions = await api.getAdminExamQuestions(exam.id);
      setActiveExamQuestions({ exam, questions: questions || [] });
    } catch (e: any) {
      alert(`Failed to load questions: ${e.message}`);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExamQuestions) return;
    const options = [newQuestionForm.opt0, newQuestionForm.opt1, newQuestionForm.opt2, newQuestionForm.opt3].filter(
      (o) => o.trim().length > 0
    );
    try {
      const created = await api.createAdminExamQuestion(activeExamQuestions.exam.id, {
        question_text: newQuestionForm.question_text,
        question_type: newQuestionForm.question_type,
        options,
        correct_answer: newQuestionForm.correct_answer,
        explanation: newQuestionForm.explanation,
        points: Number(newQuestionForm.points),
        sort_order: Number(newQuestionForm.sort_order),
      });
      setActiveExamQuestions((prev) => (prev ? { ...prev, questions: [...prev.questions, created] } : null));
      setShowAddQuestionModal(false);
      setNewQuestionForm({
        question_text: "",
        question_type: "mcq",
        opt0: "",
        opt1: "",
        opt2: "",
        opt3: "",
        correct_answer: "0",
        explanation: "",
        points: 5,
        sort_order: (activeExamQuestions.questions.length || 0) + 1,
      });
      alert("Question added to exam.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.deleteAdminExamQuestion(questionId);
      setActiveExamQuestions((prev) =>
        prev ? { ...prev, questions: prev.questions.filter((q) => q.id !== questionId) } : null
      );
      alert("Question deleted.");
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
          Administrative privileges required to access Certification Exams.
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-sm shadow-purple-500/10">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Certification Exams & Question Bank</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
                {examsList.length} Tracks
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Configure practical knowledge certification exams, manage question banks, and audit student grading submissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadExamsAndData}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Exams"}
          </Button>
          <Button size="sm" onClick={() => setShowAddExamModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Create Exam
          </Button>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {examsList.map((ex) => (
          <Card
            key={ex.id}
            padding="lg"
            hover
            className="flex flex-col justify-between bg-surface border-border hover:border-purple-400/50 shadow-md group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                  {ex.course_id || "General"}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    ex.is_published
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-surface-bright text-foreground-muted border-border"
                  }`}
                >
                  {ex.is_published ? "Published" : "Draft"}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-purple-400 transition-colors">
                  {ex.title}
                </h3>
                <p className="text-xs text-foreground-muted line-clamp-2 mt-1 leading-relaxed">{ex.description}</p>
              </div>

              <div className="flex items-center gap-3 text-xs text-foreground-muted pt-2 border-t border-border">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-400" /> {ex.duration_minutes} mins
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono font-bold text-amber-400">
                  <Award className="w-3.5 h-3.5" /> Pass: {ex.passing_score_pct}%
                </span>
                <span>•</span>
                <span className="text-foreground-secondary font-mono font-bold">{ex.total_marks} Marks</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenQuestions(ex)}
                icon={<ListOrdered className="w-3.5 h-3.5" />}
              >
                Question Bank ({ex.questions?.length || 0})
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingExam({ ...ex })}
                  icon={<Edit className="w-3.5 h-3.5 text-foreground-muted hover:text-purple-400" />}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteExam(ex.id, ex.title)}
                  className="hover:bg-rose-500/10 text-rose-400"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Submissions & Evaluation Ledger */}
      <Card padding="none" className="border border-border bg-surface shadow-lg overflow-hidden space-y-0">
        <div className="p-4 border-b border-border bg-surface-elevated flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" /> Student Certification Attempts & Submissions Ledger
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Live records of all exam grading evaluations, scored percentage, and automated credential issuance triggers.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-surface border border-border text-foreground-secondary">
            {submissionsList.length} Total Submissions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border text-foreground-muted font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Certification Exam</th>
                <th className="py-3 px-4">Raw Score</th>
                <th className="py-3 px-4">Score (%)</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Submitted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {submissionsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-foreground-muted">
                    No student exam submissions recorded yet.
                  </td>
                </tr>
              ) : (
                submissionsList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{sub.user_name}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{sub.user_email}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">{sub.exam_title}</td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground-secondary">{sub.score} Marks</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">{sub.score_pct}%</td>
                    <td className="py-3 px-4">
                      {sub.passed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> PASSED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-foreground-muted text-[11px]">
                      {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Exam Modal */}
      <AnimatePresence>
        {showAddExamModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Create Certification Exam</h3>
                <button onClick={() => setShowAddExamModal(false)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Exam Slug / ID *</label>
                  <input
                    required
                    type="text"
                    value={newExamForm.id}
                    onChange={(e) => setNewExamForm({ ...newExamForm, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none focus:border-sky-400"
                    placeholder="e.g. certified-red-team-associate"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Exam Title *</label>
                  <input
                    required
                    type="text"
                    value={newExamForm.title}
                    onChange={(e) => setNewExamForm({ ...newExamForm, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-sky-400"
                    placeholder="e.g. Certified Red Team Associate (CRTA)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Associated Course Track</label>
                  <select
                    value={newExamForm.course_id}
                    onChange={(e) => setNewExamForm({ ...newExamForm, course_id: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-medium"
                  >
                    <option value="">None / Standalone Certification</option>
                    {coursesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Duration (Mins)</label>
                    <input
                      type="number"
                      value={newExamForm.duration_minutes}
                      onChange={(e) => setNewExamForm({ ...newExamForm, duration_minutes: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Passing Score (%)</label>
                    <input
                      type="number"
                      value={newExamForm.passing_score_pct}
                      onChange={(e) => setNewExamForm({ ...newExamForm, passing_score_pct: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Total Marks</label>
                    <input
                      type="number"
                      value={newExamForm.total_marks}
                      onChange={(e) => setNewExamForm({ ...newExamForm, total_marks: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Instructions & Syllabus Scope</label>
                  <textarea
                    rows={3}
                    value={newExamForm.description}
                    onChange={(e) => setNewExamForm({ ...newExamForm, description: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    placeholder="This exam tests hands-on proficiency in..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddExamModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Create Exam Track
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Exam Modal */}
      <AnimatePresence>
        {editingExam && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Edit Exam: {editingExam.title}</h3>
                <button onClick={() => setEditingExam(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateExam} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Exam Title</label>
                  <input
                    type="text"
                    value={editingExam.title}
                    onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Duration (Mins)</label>
                    <input
                      type="number"
                      value={editingExam.duration_minutes}
                      onChange={(e) => setEditingExam({ ...editingExam, duration_minutes: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Pass (%)</label>
                    <input
                      type="number"
                      value={editingExam.passing_score_pct}
                      onChange={(e) => setEditingExam({ ...editingExam, passing_score_pct: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Marks</label>
                    <input
                      type="number"
                      value={editingExam.total_marks}
                      onChange={(e) => setEditingExam({ ...editingExam, total_marks: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Description</label>
                  <textarea
                    rows={3}
                    value={editingExam.description || ""}
                    onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingExam(null)}>
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

      {/* Question Bank Modal */}
      <AnimatePresence>
        {activeExamQuestions && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Question Bank: {activeExamQuestions.exam.title}
                  </h3>
                  <p className="text-xs text-foreground-muted font-mono">{activeExamQuestions.exam.id}</p>
                </div>
                <button onClick={() => setActiveExamQuestions(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">
                  Questions ({activeExamQuestions.questions.length})
                </span>
                <Button size="sm" onClick={() => setShowAddQuestionModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Question
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {activeExamQuestions.questions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-foreground-muted">
                    No questions in this exam bank yet. Click &quot;Add Question&quot; to configure MCQ options.
                  </div>
                ) : (
                  activeExamQuestions.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2 hover:border-border-hover transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 shrink-0 border border-purple-500/30">
                            Q{idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{q.question_text}</p>
                            <span className="text-[10px] text-foreground-muted font-mono font-semibold">{q.points} Points</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="hover:bg-rose-500/10 text-rose-400 shrink-0"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>

                      {/* Options breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-border/60 text-xs">
                        {q.options?.map((opt: string, optIdx: number) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg border text-[11px] font-mono flex items-center gap-2 ${
                              String(optIdx) === String(q.correct_answer)
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold"
                                : "bg-surface border-border text-foreground-secondary"
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-surface-bright text-[10px] flex items-center justify-center shrink-0 font-bold text-foreground">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                            {String(optIdx) === String(q.correct_answer) && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-foreground-muted bg-surface p-2 rounded-lg border border-border">
                          <strong className="text-foreground">Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddQuestionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Add Exam Question</h3>
                <button onClick={() => setShowAddQuestionModal(false)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Question Prompt / Scenario *</label>
                  <textarea
                    required
                    rows={2}
                    value={newQuestionForm.question_text}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question_text: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-purple-400"
                    placeholder="Which HTTP header prevents MIME type sniffing?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-foreground">Answer Choices (MCQ)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      type="text"
                      placeholder="Choice A"
                      value={newQuestionForm.opt0}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, opt0: e.target.value })}
                      className="bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                    />
                    <input
                      required
                      type="text"
                      placeholder="Choice B"
                      value={newQuestionForm.opt1}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, opt1: e.target.value })}
                      className="bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Choice C (Optional)"
                      value={newQuestionForm.opt2}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, opt2: e.target.value })}
                      className="bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Choice D (Optional)"
                      value={newQuestionForm.opt3}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, opt3: e.target.value })}
                      className="bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Correct Answer Index</label>
                    <select
                      value={newQuestionForm.correct_answer}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correct_answer: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-bold"
                    >
                      <option value="0">Choice A (Index 0)</option>
                      <option value="1">Choice B (Index 1)</option>
                      <option value="2">Choice C (Index 2)</option>
                      <option value="3">Choice D (Index 3)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Points / Weight</label>
                    <input
                      type="number"
                      value={newQuestionForm.points}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, points: parseInt(e.target.value) || 1 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Explanation (Shown after exam)</label>
                  <input
                    type="text"
                    value={newQuestionForm.explanation}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    placeholder="X-Content-Type-Options: nosniff instructs the browser to..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddQuestionModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Question
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
