"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  Video,
  Share2,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  Search,
  BookOpen,
  Copy,
  ExternalLink,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";

interface Batch {
  id: string;
  name: string;
  batch_code: string;
  description: string;
  instructor_id: string;
  instructor_name: string;
  course_id?: string;
  course_title?: string;
  start_date?: string;
  end_date?: string;
  max_students: number;
  meeting_link?: string;
  schedule_details?: string;
  is_active: boolean;
  enrolled_count: number;
  is_enrolled: boolean;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State for Creating Batch
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchDesc, setNewBatchDesc] = useState("");
  const [newBatchCourse, setNewBatchCourse] = useState("");
  const [newBatchSchedule, setNewBatchSchedule] = useState("");
  const [newBatchMeet, setNewBatchMeet] = useState("");
  const [newBatchMax, setNewBatchMax] = useState(40);
  const [creating, setCreating] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const [batchesRes, userRes, coursesRes] = await Promise.all([
        api.getBatches().catch(() => []),
        api.getMe().catch(() => null),
        api.getCourses().catch(() => []),
      ]);
      setBatches(batchesRes || []);
      setCurrentUser(userRes);
      setCourses(coursesRes || []);
    } catch (err: any) {
      console.error("Error loading batches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCopyLink = (batchCode: string) => {
    const fullUrl = `${window.location.origin}/batches/${batchCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(batchCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleJoin = async (batchCode: string) => {
    try {
      setJoiningId(batchCode);
      setMessage(null);
      const res = await api.joinBatch(batchCode);
      setMessage({ type: "success", text: res.message || "Successfully enrolled!" });
      fetchBatches();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to join batch." });
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    try {
      setCreating(true);
      setMessage(null);
      await api.createBatch({
        name: newBatchName.trim(),
        description: newBatchDesc.trim() || undefined,
        course_id: newBatchCourse || undefined,
        schedule_details: newBatchSchedule.trim() || undefined,
        meeting_link: newBatchMeet.trim() || undefined,
        max_students: Number(newBatchMax) || 50,
      });

      setShowCreateModal(false);
      setNewBatchName("");
      setNewBatchDesc("");
      setNewBatchSchedule("");
      setNewBatchMeet("");
      setMessage({ type: "success", text: "New learning batch created successfully!" });
      fetchBatches();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to create batch." });
    } finally {
      setCreating(false);
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (activeTab === "my" && !b.is_enrolled) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.batch_code.toLowerCase().includes(q) ||
        (b.course_title && b.course_title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const isInstructorOrAdmin =
    currentUser?.role === "instructor" || currentUser?.role === "admin";

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card via-card/70 to-card/40 border border-border/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-primary/15 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
              <GraduationCap className="h-3.5 w-3.5" />
              Live Cybersecurity Cohorts
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Learning Batches & Cohorts
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Join structured, instructor-led batches with live mentorship, weekly tactical sprints, private sandboxes, and shareable cohort links.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isInstructorOrAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:opacity-90 transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Batch
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between gap-3 ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-card border border-border/60 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Batches ({batches.length})
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "my"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Enrolled ({batches.filter((b) => b.is_enrolled).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search batches by name or code..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Batches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-card/40 border border-border/40 animate-pulse"
            />
          ))}
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card/30 border border-border/40 space-y-4">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground/60" />
          <h3 className="text-lg font-semibold text-foreground">
            No learning batches found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {activeTab === "my"
              ? "You haven't enrolled in any batches yet. Explore all batches and join a cohort!"
              : "Try adjusting your search criteria or check back later for new cohort openings."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBatches.map((batch) => {
            const pct = Math.min(
              100,
              Math.round((batch.enrolled_count / batch.max_students) * 100)
            );
            const isFull = batch.enrolled_count >= batch.max_students;

            return (
              <div
                key={batch.id}
                className="group relative rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all p-6 flex flex-col justify-between space-y-5 shadow-sm hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="space-y-4">
                  {/* Top Bar: Batch Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 text-foreground font-mono text-xs font-semibold">
                      #{batch.batch_code}
                    </span>
                    {batch.is_enrolled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Enrolled
                      </span>
                    ) : isFull ? (
                      <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                        Batch Full
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                        Open for Enrollment
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {batch.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {batch.description || "Join this intensive live cybersecurity cohort."}
                    </p>
                  </div>

                  {/* Metadata list */}
                  <div className="space-y-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        Course Module:
                      </span>
                      <span className="text-foreground font-medium truncate max-w-[200px]">
                        {batch.course_title || "All Core Tracks"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-accent" />
                        Lead Instructor:
                      </span>
                      <span className="text-foreground font-medium">
                        {batch.instructor_name}
                      </span>
                    </div>
                    {batch.schedule_details && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-warning" />
                          Live Schedule:
                        </span>
                        <span className="text-foreground font-medium truncate max-w-[200px]">
                          {batch.schedule_details}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Enrollment Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Seats Filled</span>
                      <span className="font-medium text-foreground">
                        {batch.enrolled_count} / {batch.max_students} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
                  {/* Share Link Button */}
                  <button
                    onClick={() => handleCopyLink(batch.batch_code)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg bg-card/60 hover:bg-secondary border border-border/60 transition-all"
                  >
                    {copiedCode === batch.batch_code ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* View Batch Hub / Details Link */}
                    <Link
                      href={`/batches/${batch.batch_code}`}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-foreground bg-secondary/80 hover:bg-secondary transition-all"
                    >
                      View Details
                    </Link>

                    {/* Join / Meeting action */}
                    {batch.is_enrolled ? (
                      batch.meeting_link ? (
                        <a
                          href={batch.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Join Live Room
                        </a>
                      ) : (
                        <span className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                          Enrolled
                        </span>
                      )
                    ) : (
                      <button
                        onClick={() => handleJoin(batch.batch_code)}
                        disabled={joiningId === batch.batch_code || isFull}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {joiningId === batch.batch_code ? "Enrolling..." : "Join Cohort"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Create Learning Batch
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="e.g. Red Team Tactical Sprint — Cohort 2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Batch Description
                </label>
                <textarea
                  rows={2}
                  value={newBatchDesc}
                  onChange={(e) => setNewBatchDesc(e.target.value)}
                  placeholder="Brief description of the curriculum, goals, and target audience..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Associated Course
                  </label>
                  <select
                    value={newBatchCourse}
                    onChange={(e) => setNewBatchCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">General Track (No Course)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Max Student Capacity
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={newBatchMax}
                    onChange={(e) => setNewBatchMax(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Live Class Schedule
                </label>
                <input
                  type="text"
                  value={newBatchSchedule}
                  onChange={(e) => setNewBatchSchedule(e.target.value)}
                  placeholder="e.g. Every Sat & Wed at 8:00 PM GMT+6"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Meeting URL (Google Meet / Zoom)
                </label>
                <input
                  type="url"
                  value={newBatchMeet}
                  onChange={(e) => setNewBatchMeet(e.target.value)}
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Publish Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
