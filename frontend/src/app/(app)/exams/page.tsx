"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  GraduationCap,
  Network,
  Terminal,
  Shield,
  Key,
} from "lucide-react";
import { Card, Badge, Button, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

interface ExamItem {
  id: string;
  course_id?: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score_pct: number;
  total_marks: number;
  question_count: number;
  badge_icon?: string;
  tag?: string;
}

interface QuestionItem {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  points: number;
  sort_order: number;
}

const EXAM_PRESETS: Record<string, { icon: any; tag: string; xp: number; certCode: string }> = {
  "exam-ccna-security": {
    icon: Network,
    tag: "Networking & Cisco",
    xp: 2500,
    certCode: "CCNA-SEC",
  },
  "exam-comptia-secplus": {
    icon: ShieldCheck,
    tag: "Industry Standard",
    xp: 3000,
    certCode: "SECPLUS",
  },
  "exam-ceh-associate": {
    icon: Terminal,
    tag: "Offensive Security",
    xp: 3000,
    certCode: "CEH-ASSOC",
  },
  "exam-web-security-cert": {
    icon: Shield,
    tag: "Application Defense",
    xp: 2000,
    certCode: "WASCS",
  },
  "exam-linux-basics-cert": {
    icon: Key,
    tag: "Systems Hardening",
    xp: 2000,
    certCode: "LSSA",
  },
};

export default function ExamsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Exam Taking Session
  const [activeExam, setActiveExam] = useState<ExamItem | null>(null);
  const [examQuestions, setExamQuestions] = useState<QuestionItem[]>([]);
  const [examLoading, setExamLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<any | null>(null);

  const loadExams = () => {
    setLoading(true);
    Promise.all([api.getExams(), api.getMyExamSubmissions().catch(() => [])])
      .then(([examData, subData]) => {
        if (Array.isArray(examData)) {
          setExams(examData);
        }
        if (Array.isArray(subData)) {
          setSubmissions(subData);
        }
      })
      .catch((err) => {
        console.warn("Failed to load exams:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Timer Countdown
  useEffect(() => {
    if (!activeExam || examResult || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, examResult, timeRemaining]);

  const handleStartExam = async (exam: ExamItem) => {
    setExamLoading(true);
    try {
      const details = await api.getExamDetails(exam.id);
      setActiveExam(exam);
      setExamQuestions(details.questions || []);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setExamResult(null);
      setTimeRemaining(exam.duration_minutes * 60);
    } catch (err: any) {
      alert(err.message || "Failed to load exam questions.");
    } finally {
      setExamLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, optionIndexStr: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndexStr,
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    if (!activeExam) return;
    setIsSubmitting(true);

    const payloadAnswers = Object.entries(selectedAnswers).map(([qid, ans]) => ({
      question_id: qid,
      selected_answer: ans,
    }));

    try {
      const result = await api.submitExam(activeExam.id, payloadAnswers);
      setExamResult(result);
      loadExams(); // Refresh submissions & certificates
    } catch (err: any) {
      alert(err.message || "Failed to evaluate exam submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const passedExamCount = submissions.filter((s) => s.passed).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-2">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge variant="primary" size="sm" className="font-mono uppercase text-[10px] font-bold">
                Professional Certification Track
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">Certification Exams</h1>
            <p className="text-sm text-foreground-secondary mt-1 max-w-2xl leading-relaxed">
              Demonstrate verified cybersecurity mastery. Complete standardized certification exams in networking (CCNA), threat defense (CompTIA Security+), ethical hacking (CEH), web security, and Linux administration to earn official verifiable certificates.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Card padding="sm" className="flex items-center gap-3 bg-surface-elevated/80 border-primary/20">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-foreground-muted font-medium">Earned Credentials</p>
                <p className="text-base font-extrabold text-foreground">{passedExamCount} / {exams.length || 5} Certifications</p>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm text-foreground-muted">Loading available certification exams...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam, i) => {
            const meta = EXAM_PRESETS[exam.id] || {
              icon: FileCheck,
              tag: "Certification",
              xp: 2000,
              certCode: "CERT",
            };
            const Icon = meta.icon;
            const pastSubmissions = submissions.filter((s) => s.exam_id === exam.id);
            const latestPass = pastSubmissions.find((s) => s.passed);

            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover padding="lg" className="h-full flex flex-col justify-between relative overflow-hidden border-border/80 group">
                  <div className="space-y-4">
                    {/* Top Tag & Status */}
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {latestPass ? (
                          <Badge variant="success" size="sm" className="gap-1 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            PASSED ({Math.round(latestPass.score_pct)}%)
                          </Badge>
                        ) : (
                          <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                            {meta.tag}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-foreground-secondary mt-2 line-clamp-3 leading-relaxed">
                        {exam.description}
                      </p>
                    </div>

                    {/* Meta Specs */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-foreground-muted block">Duration</span>
                        <span className="font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-primary" />
                          {exam.duration_minutes}m
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-foreground-muted block">Passing Bar</span>
                        <span className="font-bold text-foreground mt-0.5 block">
                          {exam.passing_score_pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-foreground-muted block">Questions</span>
                        <span className="font-bold text-foreground mt-0.5 block">
                          {exam.question_count || 4} MCQs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
                      <span className="flex items-center gap-1 text-primary font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        +{meta.xp} XP &amp; Diploma
                      </span>
                      {pastSubmissions.length > 0 && (
                        <span>{pastSubmissions.length} Attempt{pastSubmissions.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>

                    <Button
                      fullWidth
                      variant={latestPass ? "outline" : "primary"}
                      onClick={() => handleStartExam(exam)}
                      loading={examLoading && activeExam?.id === exam.id}
                      icon={latestPass ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    >
                      {latestPass ? "Retake for Score Improvement" : "Begin Certification Exam"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ACTIVE EXAM TAKING MODAL */}
      <AnimatePresence>
        {activeExam && examQuestions.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl border border-border w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Exam Header */}
              <div className="p-5 border-b border-border bg-surface-elevated flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider font-mono">
                    Official Proctored Exam Session
                  </span>
                  <h3 className="text-base font-bold text-foreground">{activeExam.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono font-bold text-xs ${
                    timeRemaining < 180
                      ? "bg-error/15 border-error/40 text-error animate-pulse"
                      : "bg-surface border-border text-foreground"
                  }`}>
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{formatTime(timeRemaining)}</span>
                  </div>

                  {!examResult && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to exit the exam? Your current progress will be lost.")) {
                          setActiveExam(null);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-bright text-foreground-muted hover:text-foreground cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Exam Content or Result */}
              {!examResult ? (
                <>
                  {/* Progress Indicator */}
                  <div className="px-6 pt-4 pb-2">
                    <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
                      <span>Question {currentQuestionIndex + 1} of {examQuestions.length}</span>
                      <span>{Object.keys(selectedAnswers).length} answered</span>
                    </div>
                    <ProgressBar
                      value={((currentQuestionIndex + 1) / examQuestions.length) * 100}
                      size="sm"
                      variant="primary"
                    />
                  </div>

                  {/* Question Body */}
                  <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {examQuestions[currentQuestionIndex] && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-surface-elevated/60 border border-border">
                          <h4 className="text-base font-bold text-foreground leading-relaxed">
                            {examQuestions[currentQuestionIndex].question_text}
                          </h4>
                        </div>

                        <div className="space-y-2.5">
                          {examQuestions[currentQuestionIndex].options.map((opt, optIdx) => {
                            const qId = examQuestions[currentQuestionIndex].id;
                            const isSelected = selectedAnswers[qId] === String(optIdx);

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectAnswer(qId, String(optIdx))}
                                className={`w-full p-4 rounded-xl border text-left text-xs md:text-sm font-medium transition-all duration-150 cursor-pointer flex items-start gap-3 ${
                                  isSelected
                                    ? "bg-primary/15 border-primary text-primary shadow-sm ring-1 ring-primary/40"
                                    : "bg-surface hover:bg-surface-elevated border-border text-foreground-secondary hover:text-foreground"
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold ${
                                  isSelected
                                    ? "border-primary bg-primary text-black"
                                    : "border-border text-foreground-muted"
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span className="flex-1 leading-relaxed">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Navigation */}
                  <div className="p-5 border-t border-border bg-surface-elevated flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    >
                      ← Previous
                    </Button>

                    <div className="flex items-center gap-2">
                      {currentQuestionIndex < examQuestions.length - 1 ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setCurrentQuestionIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                        >
                          Next Question →
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          loading={isSubmitting}
                          onClick={handleSubmitExam}
                          className="font-bold shadow-lg"
                        >
                          Submit &amp; Evaluate Exam
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* EXAM RESULT SUMMARY */
                <div className="p-8 text-center space-y-6 overflow-y-auto flex-1">
                  <div className={`inline-flex items-center justify-center p-5 rounded-full border shadow-xl ${
                    examResult.passed
                      ? "bg-success/15 border-success/30 text-success"
                      : "bg-error/15 border-error/30 text-error"
                  }`}>
                    {examResult.passed ? (
                      <Award className="w-16 h-16 text-success animate-bounce" />
                    ) : (
                      <AlertCircle className="w-16 h-16 text-error" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Badge variant={examResult.passed ? "success" : "danger"} size="md" className="font-bold uppercase tracking-wider">
                      {examResult.passed ? "Certification Granted" : "Did Not Meet 70% Passing Threshold"}
                    </Badge>
                    <h2 className="text-2xl font-extrabold text-foreground">
                      {examResult.passed ? "Congratulations! You Passed!" : "Exam Completed"}
                    </h2>
                    <p className="text-xs md:text-sm text-foreground-secondary max-w-md mx-auto leading-relaxed">
                      {examResult.passed
                        ? `You have demonstrated verified competency in ${activeExam.title}. Your verifiable certification credential has been issued to your profile.`
                        : "You did not achieve the required 70% passing threshold for this certification. Review the curriculum and retake when ready."}
                    </p>
                  </div>

                  {/* Score Stats */}
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto p-4 rounded-2xl bg-surface-elevated border border-border text-center">
                    <div>
                      <span className="text-[10px] text-foreground-muted block uppercase">Score</span>
                      <span className="text-xl font-extrabold text-foreground">{Math.round(examResult.score_pct)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground-muted block uppercase">Correct</span>
                      <span className="text-xl font-extrabold text-foreground">{examResult.correct_count}/{examResult.total_questions}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground-muted block uppercase">XP Awarded</span>
                      <span className="text-xl font-extrabold text-primary">+{examResult.xp_awarded}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    {examResult.passed ? (
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => {
                          setActiveExam(null);
                          router.push("/certificates");
                        }}
                        className="font-bold shadow-lg w-full sm:w-auto"
                      >
                        <Award className="w-4 h-4 mr-1.5" />
                        View My Certificates →
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => handleStartExam(activeExam)}
                        className="font-bold w-full sm:w-auto"
                      >
                        <RotateCcw className="w-4 h-4 mr-1.5" />
                        Retake Exam Now
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setActiveExam(null)}
                      className="w-full sm:w-auto"
                    >
                      Back to Exams List
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
