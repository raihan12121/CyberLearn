"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Fingerprint,
} from "lucide-react";
import { api } from "@/lib/api";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  points: number;
  sort_order: number;
}

interface ExamData {
  id: string;
  course_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score_pct: number;
  total_marks: number;
  question_count: number;
  questions: Question[];
}

interface SubmissionResult {
  id: string;
  score: number;
  total_score: number;
  score_pct: number;
  passed: boolean;
  certificate_token?: string;
  breakdown?: {
    question_id: string;
    question_text: string;
    selected: string;
    correct_answer: string;
    is_correct: boolean;
    points_earned: number;
    points_possible: number;
    explanation?: string;
  }[];
}

export default function CourseExamPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam Taking State
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Exam
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getCourseExam(courseId);
        if (!res || !res.questions || res.questions.length === 0) {
          setError("No active certification exam is available for this course yet.");
        } else {
          setExam(res);
          setSecondsRemaining((res.duration_minutes || 25) * 60);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load exam data.");
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchExam();
  }, [courseId]);

  const selectedAnswersRef = useRef(selectedAnswers);
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  // Steady Timer Tick
  useEffect(() => {
    if (!started || result || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, result]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: String(optionIndex),
    }));
  };

  const handleSubmit = async () => {
    if (!exam || submitting) return;
    try {
      setSubmitting(true);
      const currentAnswers = selectedAnswersRef.current;
      const payload = exam.questions.map((q) => ({
        question_id: q.id,
        selected_answer: currentAnswers[q.id] || "",
      }));

      const res = await api.submitExam(exam.id, payload);
      setResult(res);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartExam = () => {
    setStarted(true);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setResult(null);
  };

  // Handle Timeout Auto-Submission
  useEffect(() => {
    if (started && !result && secondsRemaining === 0 && exam && !submitting) {
      handleSubmit();
    }
  }, [secondsRemaining, started, result, exam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-warning" />
        <h2 className="text-2xl font-bold text-foreground">Exam Notice</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course Lessons
        </Link>
      </div>
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // 1. Result Screen
  if (result) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 sm:p-10 text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div
            className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -z-10 ${
              result.passed ? "bg-emerald-500/15" : "bg-red-500/10"
            }`}
          />

          <div
            className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center ${
              result.passed
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {result.passed ? (
              <Award className="h-10 w-10 animate-bounce" />
            ) : (
              <AlertCircle className="h-10 w-10" />
            )}
          </div>

          <div className="space-y-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                result.passed
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {result.passed ? "Examination Passed ✓" : "Did Not Meet Passing Criteria"}
            </span>
            <h2 className="text-3xl font-extrabold text-foreground">
              {result.passed ? "Congratulations, Specialist!" : "Exam Completed"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {result.passed
                ? `You achieved a score of ${result.score_pct}%. Your official verifiable certificate of achievement has been generated!`
                : `You scored ${result.score_pct}%. The passing threshold is ${exam.passing_score_pct}%. Review the questions below and try again.`}
            </p>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto p-4 rounded-xl bg-background/80 border border-border/80 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Score</div>
              <div className="text-lg font-bold text-foreground">
                {result.score} / {result.total_score}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Percentage</div>
              <div
                className={`text-lg font-bold ${
                  result.passed ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {result.score_pct}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">XP Earned</div>
              <div className="text-lg font-bold text-warning flex items-center justify-center gap-1">
                <Sparkles className="h-4 w-4" />
                {result.passed ? "+800" : "+0"}
              </div>
            </div>
          </div>

          {/* ID Verification Warning if passed without verified ID */}
          {result.passed && !result.certificate_token && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Fingerprint className="h-4 w-4" />
                <span>Government ID Verification Required</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You passed the exam! Official certificates require verified government ID. Please complete ID verification at /verify-nid to unlock and claim your credential.
              </p>
              <Link
                href="/verify-nid"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-all mt-1"
              >
                Verify ID to Unlock Certificate →
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {result.passed && result.certificate_token && (
              <Link
                href={`/verify/${result.certificate_token}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all"
              >
                <Award className="h-4 w-4" />
                View &amp; Claim Certificate
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <button
              onClick={handleStartExam}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Retake Exam
            </button>
            <Link
              href={`/courses/${courseId}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-all"
            >
              <BookOpen className="h-4 w-4" />
              Back to Course
            </Link>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {result.breakdown && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              Question Review &amp; Explanations
            </h3>
            <div className="space-y-3">
              {result.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border ${
                    item.is_correct
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-red-500/5 border-red-500/30"
                  } space-y-3`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-semibold text-xs text-muted-foreground">
                      Question {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        item.is_correct
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {item.is_correct ? `+${item.points_earned} pts (Correct)` : `0 pts (Incorrect)`}
                    </span>
                  </div>
                  <p className="font-medium text-sm text-foreground">
                    {item.question_text}
                  </p>
                  {item.explanation && (
                    <p className="text-xs text-muted-foreground bg-background/60 p-3 rounded-xl border border-border/40">
                      <span className="font-semibold text-foreground">Rationale: </span>
                      {item.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Pre-Exam Intro Screen
  if (!started) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course Lessons
        </Link>

        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 sm:p-10 space-y-6 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
              <Award className="h-3.5 w-3.5" />
              Official Course Certification Exam
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              {exam.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {exam.description}
            </p>
          </div>

          {/* Exam Rules & Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-background/70 border border-border space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <Clock className="h-4 w-4 text-warning" /> Duration
              </div>
              <div className="text-base font-bold text-foreground">
                {exam.duration_minutes} Minutes
              </div>
            </div>

            <div className="p-4 rounded-xl bg-background/70 border border-border space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" /> Passing Threshold
              </div>
              <div className="text-base font-bold text-foreground">
                {exam.passing_score_pct}% Required
              </div>
            </div>

            <div className="p-4 rounded-xl bg-background/70 border border-border space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <Sparkles className="h-4 w-4 text-accent" /> Total Questions
              </div>
              <div className="text-base font-bold text-foreground">
                {exam.question_count} Questions
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-xs text-muted-foreground space-y-1.5">
            <div className="font-bold text-foreground">Certification Guidelines:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Once you click &ldquo;Begin Certification Exam&rdquo;, the timer cannot be paused.</li>
              <li>You may navigate forward and backward between questions at any time.</li>
              <li>Passing the exam automatically mints an accredited credential with verifiable QR code.</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleStartExam}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
            >
              <Zap className="h-4 w-4" />
              Begin Certification Exam
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Exam Question Screen
  const currentQuestion = exam.questions[currentIdx];
  const selectedForCurrent = selectedAnswers[currentQuestion.id];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header: Progress & Timer */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">
            Question {currentIdx + 1} of {exam.questions.length}
          </span>
          <span className="text-xs text-primary font-bold">
            ({answeredCount} of {exam.questions.length} answered)
          </span>
        </div>

        {/* Live Timer */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border text-sm font-mono font-bold ${
            secondsRemaining < 180
              ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
              : "bg-primary/10 border-primary/20 text-primary"
          }`}
        >
          <Clock className="h-4 w-4" />
          {timeFormatted}
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 space-y-6 shadow-md">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">
            Question {currentIdx + 1} ({currentQuestion.points} points)
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
            {currentQuestion.question_text}
          </h2>
        </div>

        {/* Options List */}
        <div className="space-y-3 pt-2">
          {currentQuestion.options.map((opt, optIdx) => {
            const isSelected = selectedForCurrent === String(optIdx);
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-primary/15 border-primary text-foreground shadow-sm ring-1 ring-primary/40"
                    : "bg-background/70 border-border/80 hover:border-primary/40 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-sm font-medium text-foreground">{opt}</span>
                </div>
                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation and Submission Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
          disabled={currentIdx === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 disabled:opacity-40 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>

        {/* Question Bubble Navigator */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {exam.questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/50 scale-105"
                    : isAnswered
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {currentIdx < exam.questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIdx((p) => Math.min(exam.questions.length - 1, p + 1))}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-all"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {submitting ? "Grading..." : "Submit Exam"}
            <CheckCircle2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
