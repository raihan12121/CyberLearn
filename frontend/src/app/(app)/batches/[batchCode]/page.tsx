"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  Video,
  Share2,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  Award,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

interface Student {
  id: string;
  full_name: string;
  avatar_url?: string;
  xp: number;
  enrolled_at?: string;
}

interface BatchDetail {
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
  students: Student[];
}

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchCode = params.batchCode as string;

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await api.getBatchDetails(batchCode);
      setBatch(res);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to load batch details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batchCode) {
      fetchBatch();
    }
  }, [batchCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoin = async () => {
    try {
      setJoining(true);
      setMessage(null);
      const res = await api.joinBatch(batchCode);
      setMessage({ type: "success", text: res.message || "Enrolled successfully in batch!" });
      fetchBatch();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to enroll in this batch." });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-red-400" />
        <h2 className="text-2xl font-bold text-foreground">Cohort Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested batch code &ldquo;{batchCode}&rdquo; could not be found or has expired.
        </p>
        <Link
          href="/batches"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Batches
        </Link>
      </div>
    );
  }

  const isFull = batch.enrolled_count >= batch.max_students;
  const pct = Math.min(100, Math.round((batch.enrolled_count / batch.max_students) * 100));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/batches"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Batches
        </Link>

        {/* Share Batch Link */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-all"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Share Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-primary" />
              <span>Share Cohort Link</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
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

      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card/80 to-card/50 border border-border/50 p-6 sm:p-10 backdrop-blur-md shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold">
                BATCH #{batch.batch_code}
              </span>
              {batch.is_enrolled ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Enrolled Member
                </span>
              ) : isFull ? (
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">
                  Batch Full
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-semibold">
                  Open for Admission
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {batch.name}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {batch.description ||
                "Comprehensive hands-on training cohort with structured syllabus, lab challenges, and live instructor sessions."}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border/40">
              <div>
                <div className="text-xs text-muted-foreground">Lead Instructor</div>
                <div className="font-semibold text-sm text-foreground">
                  {batch.instructor_name}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Track Module</div>
                <div className="font-semibold text-sm text-foreground truncate">
                  {batch.course_title || "General Security"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Enrolled Students</div>
                <div className="font-semibold text-sm text-foreground">
                  {batch.enrolled_count} / {batch.max_students}
                </div>
              </div>
            </div>
          </div>

          {/* Join / Live Hub Action Card */}
          <div className="w-full lg:w-80 rounded-2xl bg-background/80 border border-border/80 p-6 space-y-5 shadow-lg flex-shrink-0">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Capacity Status</span>
                <span className="font-bold text-foreground">{pct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {batch.schedule_details && (
              <div className="p-3 rounded-xl bg-card border border-border/50 space-y-1 text-xs">
                <div className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  Live Schedule
                </div>
                <div className="font-semibold text-foreground">
                  {batch.schedule_details}
                </div>
              </div>
            )}

            {batch.is_enrolled ? (
              <div className="space-y-3">
                {batch.meeting_link ? (
                  <a
                    href={batch.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all"
                  >
                    <Video className="h-4 w-4" />
                    Enter Live Class
                  </a>
                ) : (
                  <div className="text-center py-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    Enrolled &amp; Ready
                  </div>
                )}
                {batch.course_id && (
                  <Link
                    href={`/courses/${batch.course_id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-secondary text-foreground font-semibold text-xs text-center flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Go to Course Lessons
                  </Link>
                )}
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining || isFull}
                className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : isFull ? (
                  "Batch Full"
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Join This Batch
                  </>
                )}
              </button>
            )}

            <p className="text-[11px] text-center text-muted-foreground">
              Direct access link generated for CyberLearn Academy learners.
            </p>
          </div>
        </div>
      </div>

      {/* Cohort Classmates Section */}
      <div className="bg-card/60 border border-border/50 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Enrolled Classmates ({batch.students?.length || 0})
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {batch.max_students - (batch.students?.length || 0)} seats remaining
          </span>
        </div>

        {!batch.students || batch.students.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Be the first student to enroll in this cohort!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {batch.students.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/50"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center font-bold text-sm text-foreground">
                  {student.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-xs text-foreground truncate">
                    {student.full_name}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-warning" />
                    {student.xp} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
