"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  ListOrdered,
  Clock,
  DollarSign,
  Shield,
  RefreshCw,
  X,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminCoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Courses state
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [newCourseForm, setNewCourseForm] = useState({
    id: "",
    title: "",
    category: "Web Security",
    difficulty: "Beginner",
    price: 49.0,
    estimated_duration: 300,
    description: "",
    thumbnail_url: "",
    is_published: true,
  });

  // Lessons state
  const [activeCourseLessons, setActiveCourseLessons] = useState<{ course: any; lessons: any[] } | null>(null);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [newLessonForm, setNewLessonForm] = useState({
    id: "",
    title: "",
    content_type: "video",
    video_url: "",
    duration: 10,
    sort_order: 1,
    content: "",
  });

  const loadCourses = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const courses = await api.getAdminCourses();
      setCoursesList(courses || []);
    } catch (err: any) {
      console.error("Failed to load courses:", err);
      if (err?.message?.includes("403")) {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminCourse(newCourseForm);
      setCoursesList((prev) => [created, ...prev]);
      setShowAddCourseModal(false);
      setNewCourseForm({
        id: "",
        title: "",
        category: "Web Security",
        difficulty: "Beginner",
        price: 49.0,
        estimated_duration: 300,
        description: "",
        thumbnail_url: "",
        is_published: true,
      });
      alert(`Course "${created.title}" created successfully.`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      const updated = await api.updateAdminCourse(editingCourse.id, editingCourse);
      setCoursesList((prev) => prev.map((c) => (c.id === editingCourse.id ? { ...c, ...updated } : c)));
      setEditingCourse(null);
      alert("Course updated successfully.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete course "${title}"?`)) return;
    try {
      await api.deleteAdminCourse(courseId);
      setCoursesList((prev) => prev.filter((c) => c.id !== courseId));
      if (activeCourseLessons?.course.id === courseId) {
        setActiveCourseLessons(null);
      }
      alert("Course deleted.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleOpenLessons = async (course: any) => {
    try {
      const lessons = await api.getAdminCourseLessons(course.id);
      setActiveCourseLessons({ course, lessons: lessons || [] });
    } catch (e: any) {
      alert(`Failed to load lessons: ${e.message}`);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseLessons) return;
    try {
      const created = await api.createAdminLesson(activeCourseLessons.course.id, newLessonForm);
      setActiveCourseLessons((prev) => (prev ? { ...prev, lessons: [...prev.lessons, created] } : null));
      setShowAddLessonModal(false);
      setNewLessonForm({
        id: "",
        title: "",
        content_type: "video",
        video_url: "",
        duration: 10,
        sort_order: (activeCourseLessons.lessons.length || 0) + 1,
        content: "",
      });
      alert(`Lesson "${created.title}" added.`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !activeCourseLessons) return;
    try {
      const updated = await api.updateAdminLesson(editingLesson.id, editingLesson);
      setActiveCourseLessons((prev) =>
        prev ? { ...prev, lessons: prev.lessons.map((l) => (l.id === editingLesson.id ? updated : l)) } : null
      );
      setEditingLesson(null);
      alert("Lesson updated.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await api.deleteAdminLesson(lessonId);
      setActiveCourseLessons((prev) =>
        prev ? { ...prev, lessons: prev.lessons.filter((l) => l.id !== lessonId) } : null
      );
      alert("Lesson deleted.");
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
          Administrative privileges required to access Course Curriculum management.
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-sky-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-sm shadow-indigo-500/10">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Courses & Curriculum</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {coursesList.length} Tracks
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Author offensive and defensive cybersecurity training courses, structured syllabus modules, and video lessons.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCourses}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Courses"}
          </Button>
          <Button size="sm" onClick={() => setShowAddCourseModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Create Course
          </Button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coursesList.map((c) => (
          <Card
            key={c.id}
            padding="lg"
            hover
            className="flex flex-col justify-between bg-surface border-border hover:border-indigo-400/50 shadow-md group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {c.category}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    c.is_published
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-surface-bright text-foreground-muted border-border"
                  }`}
                >
                  {c.is_published ? "Published" : "Draft"}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-400 transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-foreground-muted line-clamp-2 mt-1 leading-relaxed">{c.description}</p>
              </div>

              <div className="flex items-center gap-3 text-xs text-foreground-muted pt-2 border-t border-border">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-400" /> {c.estimated_duration} mins
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono font-bold text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" /> {c.price > 0 ? `$${c.price}` : "Free"}
                </span>
                <span>•</span>
                <span className="text-foreground-secondary font-semibold">{c.difficulty}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenLessons(c)}
                icon={<ListOrdered className="w-3.5 h-3.5" />}
              >
                Manage Syllabus ({c.lessons?.length || 0})
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingCourse({ ...c })}
                  icon={<Edit className="w-3.5 h-3.5 text-foreground-muted hover:text-indigo-400" />}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteCourse(c.id, c.title)}
                  className="hover:bg-rose-500/10 text-rose-400"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Course Modal */}
      <AnimatePresence>
        {showAddCourseModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Create New Course Track</h3>
                <button onClick={() => setShowAddCourseModal(false)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Course Identifier Slug *</label>
                  <input
                    required
                    type="text"
                    value={newCourseForm.id}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none focus:border-sky-400"
                    placeholder="e.g. advanced-network-pentest"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Course Title *</label>
                  <input
                    required
                    type="text"
                    value={newCourseForm.title}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-sky-400"
                    placeholder="e.g. Advanced Network Penetration Testing"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Category</label>
                    <input
                      type="text"
                      value={newCourseForm.category}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, category: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Difficulty</label>
                    <select
                      value={newCourseForm.difficulty}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, difficulty: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-medium"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Price ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newCourseForm.price}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={newCourseForm.estimated_duration}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, estimated_duration: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Course Summary Description</label>
                  <textarea
                    rows={3}
                    value={newCourseForm.description}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    placeholder="Comprehensive practical curriculum on..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCourseModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Publish Course
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Course Modal */}
      <AnimatePresence>
        {editingCourse && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Edit Course: {editingCourse.title}</h3>
                <button onClick={() => setEditingCourse(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCourse} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Course Title</label>
                  <input
                    type="text"
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Category</label>
                    <input
                      type="text"
                      value={editingCourse.category}
                      onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Difficulty</label>
                    <select
                      value={editingCourse.difficulty}
                      onChange={(e) => setEditingCourse({ ...editingCourse, difficulty: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-medium"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Price ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingCourse.price}
                      onChange={(e) => setEditingCourse({ ...editingCourse, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Duration (Mins)</label>
                    <input
                      type="number"
                      value={editingCourse.estimated_duration}
                      onChange={(e) => setEditingCourse({ ...editingCourse, estimated_duration: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Description</label>
                  <textarea
                    rows={3}
                    value={editingCourse.description || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingCourse(null)}>
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

      {/* Course Lessons Drawer / Modal */}
      <AnimatePresence>
        {activeCourseLessons && (
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
                    Syllabus: {activeCourseLessons.course.title}
                  </h3>
                  <p className="text-xs text-foreground-muted font-mono">{activeCourseLessons.course.id}</p>
                </div>
                <button onClick={() => setActiveCourseLessons(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider">
                  Lessons ({activeCourseLessons.lessons.length})
                </span>
                <Button size="sm" onClick={() => setShowAddLessonModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Lesson
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {activeCourseLessons.lessons.length === 0 ? (
                  <div className="py-12 text-center text-xs text-foreground-muted">
                    No lessons created for this course yet. Click &quot;Add Lesson&quot; to build the syllabus.
                  </div>
                ) : (
                  activeCourseLessons.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="p-3.5 rounded-xl bg-surface-elevated border border-border flex items-center justify-between hover:border-border-hover transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center font-mono text-xs font-bold">
                          {lesson.sort_order}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground flex items-center gap-2">
                            {lesson.title}
                            <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-surface-bright text-foreground-muted">
                              {lesson.content_type}
                            </span>
                          </p>
                          <p className="text-[11px] text-foreground-muted flex items-center gap-2">
                            <Clock className="w-3 h-3 text-sky-400" /> {lesson.duration} mins
                            {lesson.video_url && (
                              <>
                                <span>•</span>
                                <span className="text-sky-400 font-mono">{lesson.video_url}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingLesson({ ...lesson })}
                          icon={<Edit className="w-3.5 h-3.5 text-foreground-muted hover:text-sky-400" />}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLesson(lesson.id)}
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

      {/* Add Lesson Modal */}
      <AnimatePresence>
        {showAddLessonModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Add Module Lesson</h3>
                <button onClick={() => setShowAddLessonModal(false)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLesson} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lesson Unique ID (Slug) *</label>
                  <input
                    required
                    type="text"
                    value={newLessonForm.id}
                    onChange={(e) => setNewLessonForm({ ...newLessonForm, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none"
                    placeholder="e.g. recon-nmap-scripting"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lesson Title *</label>
                  <input
                    required
                    type="text"
                    value={newLessonForm.title}
                    onChange={(e) => setNewLessonForm({ ...newLessonForm, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    placeholder="e.g. Automated NSE Script Scanning"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Type</label>
                    <select
                      value={newLessonForm.content_type}
                      onChange={(e) => setNewLessonForm({ ...newLessonForm, content_type: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-medium"
                    >
                      <option value="video">Video</option>
                      <option value="article">Article / Text</option>
                      <option value="lab">Hands-on Lab</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Duration (Mins)</label>
                    <input
                      type="number"
                      value={newLessonForm.duration}
                      onChange={(e) => setNewLessonForm({ ...newLessonForm, duration: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Sort Order</label>
                    <input
                      type="number"
                      value={newLessonForm.sort_order}
                      onChange={(e) => setNewLessonForm({ ...newLessonForm, sort_order: parseInt(e.target.value) || 1 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Video Stream URL</label>
                  <input
                    type="url"
                    value={newLessonForm.video_url}
                    onChange={(e) => setNewLessonForm({ ...newLessonForm, video_url: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lesson Notes & Markdown Content</label>
                  <textarea
                    rows={4}
                    value={newLessonForm.content}
                    onChange={(e) => setNewLessonForm({ ...newLessonForm, content: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none"
                    placeholder="## Objective\nIn this lesson we cover..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddLessonModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Add Lesson
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Lesson Modal */}
      <AnimatePresence>
        {editingLesson && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Edit Lesson: {editingLesson.title}</h3>
                <button onClick={() => setEditingLesson(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateLesson} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lesson Title</label>
                  <input
                    type="text"
                    value={editingLesson.title}
                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Duration (Mins)</label>
                    <input
                      type="number"
                      value={editingLesson.duration}
                      onChange={(e) => setEditingLesson({ ...editingLesson, duration: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Order Index</label>
                    <input
                      type="number"
                      value={editingLesson.sort_order}
                      onChange={(e) => setEditingLesson({ ...editingLesson, sort_order: parseInt(e.target.value) || 1 })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Video Stream URL</label>
                  <input
                    type="url"
                    value={editingLesson.video_url || ""}
                    onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lesson Content</label>
                  <textarea
                    rows={4}
                    value={editingLesson.content || ""}
                    onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground font-mono focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingLesson(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Lesson
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
