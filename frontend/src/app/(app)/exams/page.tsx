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
  Fingerprint,
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

const DEFAULT_EXAM_CATALOG: ExamItem[] = [
  {
    id: "exam-ccna-security",
    title: "Cisco CCNA Security & Network Defense Exam",
    description: "Official qualification exam testing IPv4/IPv6 subnetting, TCP/IP handshakes, Access Control Lists (ACLs), VLAN trunking, Dynamic ARP Inspection, DHCP snooping, and IPSec VPNs.",
    duration_minutes: 45,
    passing_score_pct: 70,
    total_marks: 100,
    question_count: 20,
  },
  {
    id: "exam-comptia-secplus",
    title: "CompTIA Security+ (SY0-701) Certification Exam",
    description: "Industry-standard certification exam covering Threat Landscape, Cryptography & PKI, Identity & Access Management, Zero Trust Architecture, and Incident Response.",
    duration_minutes: 45,
    passing_score_pct: 70,
    total_marks: 100,
    question_count: 20,
  },
  {
    id: "exam-ceh-associate",
    title: "Certified Ethical Hacker (CEH) Associate Exam",
    description: "Comprehensive penetration testing exam evaluating Reconnaissance, Port Scanning, Metasploit Exploitation, Buffer Overflows, Privilege Escalation, and Pivoting.",
    duration_minutes: 45,
    passing_score_pct: 70,
    total_marks: 100,
    question_count: 20,
  },
  {
    id: "exam-web-security-cert",
    title: "Web Application Security Certified Specialist (WASCS) Exam",
    description: "Comprehensive qualification exam covering Same-Origin Policy, XSS vectors, SQL Injection mitigation, CSRF, SSRF, IDOR, and secure session architectures.",
    duration_minutes: 45,
    passing_score_pct: 70,
    total_marks: 100,
    question_count: 20,
  },
  {
    id: "exam-linux-basics-cert",
    title: "Linux Security & Systems Administration Exam",
    description: "Final qualification exam covering Linux permissions, SUID binaries, SSH hardening, process inspection, PAM, iptables, and kernel namespaces.",
    duration_minutes: 45,
    passing_score_pct: 70,
    total_marks: 100,
    question_count: 20,
  },
];

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
  const [exams, setExams] = useState<ExamItem[]>(DEFAULT_EXAM_CATALOG);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    Promise.all([
      api.getExams().catch((err) => {
        console.warn("Could not fetch exams from API, using catalog defaults:", err);
        return DEFAULT_EXAM_CATALOG;
      }),
      api.getMyExamSubmissions().catch(() => [])
    ])
      .then(([examData, subData]) => {
        if (Array.isArray(examData) && examData.length > 0) {
          setExams(examData);
        } else {
          setExams(DEFAULT_EXAM_CATALOG);
        }
        if (Array.isArray(subData)) {
          setSubmissions(subData);
        }
      })
      .catch((err) => {
        console.warn("Failed to load exams:", err);
        setExams(DEFAULT_EXAM_CATALOG);
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
      setTimeRemaining((exam.duration_minutes || 45) * 60);
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
  const isVerified = user?.verification_status === "verified";

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
                        <Badge variant="success" size="sm" className="flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Certified ({Math.round(latestPass.score_pct)}%)</span>
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
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-foreground-secondary mt-2 line-clamp-3 leading-relaxed">
                      {exam.description}
                    </p>
                  </div>

                  {/* Exam Specs Table */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-elevated/60 border border-border/60 text-center">
                    <div>
                      <span className="text-[10px] text-foreground-muted block uppercase font-mono">Questions</span>
                      <span className="text-xs font-extrabold text-foreground">{exam.question_count || 20} MCQs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground-muted block uppercase font-mono">Duration</span>
                      <span className="text-xs font-extrabold text-foreground">{exam.duration_minutes || 45} Mins</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground-muted block uppercase font-mono">Passing</span>
                      <span className="text-xs font-extrabold text-accent">{exam.passing_score_pct || 70}%</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-5 border-t border-border mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{meta.xp} XP Bonus</span>
                  </div>

                  <Button
                    variant={latestPass ? "outline" : "primary"}
                    size="sm"
                    loading={examLoading && activeExam?.id === exam.id}
                    onClick={() => handleStartExam(exam)}
                    className="font-bold shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    <span>{latestPass ? "Retake Exam" : "Start Exam →"}</span>
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ACTIVE EXAM TAKING MODAL */}
      <AnimatePresence>
        {activeExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-4xl max-h-[90vh] bg-surface border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
            >
              {/* Exam Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-surface-elevated">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground line-clamp-1">{activeExam.title}</h2>
                    <p className="text-xs text-foreground-muted">Standardized Proctored Evaluation • 20 Multiple Choice Questions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Live Timer */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${
                    timeRemaining < 300
                      ? "bg-error/15 border-error/30 text-error animate-pulse"
                      : "bg-surface border-border text-foreground"
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{formatTime(timeRemaining)}</span>
                  </div>

                  {!examResult && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to exit? Your exam progress will not be saved.")) {
                          setActiveExam(null);
                        }
                      }}
                      className="p-1.5 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {!examResult ? (
                <>
                  {/* Question Viewport */}
                  <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                    {/* Progress Indicator */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-foreground-muted">
                        <span>Question {currentQuestionIndex + 1} of {examQuestions.length || 20}</span>
                        <span>{Object.keys(selectedAnswers).length} / {examQuestions.length || 20} Answered</span>
                      </div>
                      <ProgressBar
                        value={((currentQuestionIndex + 1) / (examQuestions.length || 1)) * 100}
                        variant="primary"
                        size="sm"
                      />
                    </div>

                    {/* Question Content */}
                    {examQuestions[currentQuestionIndex] && (
                      <div className="space-y-5">
                        <h3 className="text-lg md:text-xl font-extrabold text-foreground leading-relaxed">
                          {examQuestions[currentQuestionIndex].question_text}
                        </h3>

                        {/* Options List */}
                        <div className="space-y-3 pt-2">
                          {examQuestions[currentQuestionIndex].options.map((option, idx) => {
                            const optionIndexStr = String(idx);
                            const isSelected = selectedAnswers[examQuestions[currentQuestionIndex].id] === optionIndexStr;

                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelectAnswer(examQuestions[currentQuestionIndex].id, optionIndexStr)}
                                className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-primary/10 border-primary shadow-sm text-foreground ring-1 ring-primary"
                                    : "bg-surface-elevated/60 border-border hover:border-primary/40 hover:bg-surface-elevated text-foreground-secondary hover:text-foreground"
                                }`}
                              >
                                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-surface border border-border text-foreground-muted"
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="text-sm font-medium leading-relaxed pt-0.5">
                                  {option}
                                </span>
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

                    {/* Question Bubbles */}
                    <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto px-2">
                      {examQuestions.map((q, idx) => {
                        const isAnswered = selectedAnswers[q.id] !== undefined;
                        const isCurrent = idx === currentQuestionIndex;
                        return (
                          <button
                            key={q.id || idx}
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                              isCurrent
                                ? "bg-primary text-primary-foreground ring-2 ring-primary/40 scale-105"
                                : isAnswered
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-surface border border-border text-foreground-muted hover:text-foreground"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

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
                          Submit Exam
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
                      {examResult.passed ? "Exam Passed ✓" : "Did Not Meet 70% Passing Threshold"}
                    </Badge>
                    <h2 className="text-2xl font-extrabold text-foreground">
                      {examResult.passed ? "Congratulations, Specialist!" : "Exam Completed"}
                    </h2>
                    <p className="text-xs md:text-sm text-foreground-secondary max-w-md mx-auto leading-relaxed">
                      {examResult.passed
                        ? `You have achieved a passing score of ${Math.round(examResult.score_pct)}% in ${activeExam.title}.`
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
                      <span className="text-[10px] text-foreground-muted block uppercase">Marks</span>
                      <span className="text-xl font-extrabold text-foreground">{examResult.score}/{examResult.total_score}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground-muted block uppercase">Status</span>
                      <span className={`text-xl font-extrabold ${examResult.passed ? "text-success" : "text-error"}`}>
                        {examResult.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                  </div>

                  {/* ID Verification Warning if passed without verified ID */}
                  {examResult.passed && !examResult.certificate_token && (
                    <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 text-left max-w-md mx-auto space-y-2">
                      <div className="flex items-center gap-2 text-warning font-bold text-xs">
                        <Fingerprint className="w-4 h-4" />
                        <span>Government ID Verification Required to Claim Credential</span>
                      </div>
                      <p className="text-xs text-foreground-secondary leading-relaxed">
                        You have successfully passed the exam! Official certification diplomas are locked until your National ID is verified.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => {
                          setActiveExam(null);
                          router.push("/verify-nid");
                        }}
                        className="font-bold mt-2 shadow-md"
                      >
                        Verify National ID to Unlock Certificate →
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    {examResult.passed ? (
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => {
                          setActiveExam(null);
                          router.push(examResult.certificate_token ? "/certificates" : "/verify-nid");
                        }}
                        className="font-bold shadow-lg w-full sm:w-auto"
                      >
                        <Award className="w-4 h-4 mr-1.5" />
                        {examResult.certificate_token ? "View My Certificates →" : "Complete ID Verification →"}
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
