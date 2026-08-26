"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Terminal as TerminalIcon,
  DollarSign,
  Activity,
  Server,
  Database,
  ArrowUpRight,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  RefreshCw,
  Eye,
  BadgeCheck,
  Zap,
  Check,
  X,
  Layers,
  Cpu,
  HardDrive,
  Radio,
  TrendingUp,
  BookOpen,
  Lock,
  Plus,
  Trash2,
  Edit,
  GraduationCap,
  Award,
  FileCheck,
  MessageSquare,
  AlertTriangle,
  CreditCard,
  Tag,
  HelpCircle,
  ListOrdered,
  PlayCircle,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, Badge, ProgressBar, Button, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

const DEFAULT_STATS = [
  { label: "Total Users", value: "10,245", change: "+12% this month", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { label: "Total Revenue", value: "$4,850.00", change: "42 active subs", icon: DollarSign, color: "text-success", bg: "bg-success/10" },
  { label: "Active Sandboxes", value: "84", change: "42% CPU load", icon: TerminalIcon, color: "text-accent", bg: "bg-accent/10" },
  { label: "Issued Credentials", value: "189", change: "5 active tracks", icon: Award, color: "text-warning", bg: "bg-warning/10" },
];

const DEFAULT_CONTAINERS = [
  { name: "linux-navigation-sandbox", users: 34, status: "Healthy", cpu: "12%", memory: "1.2 GB", port: "3001/TCP" },
  { name: "sqli-bypass-sandbox", users: 28, status: "Healthy", cpu: "24%", memory: "2.1 GB", port: "3002/TCP" },
  { name: "wireshark-sniffer-sandbox", users: 15, status: "Healthy", cpu: "8%", memory: "890 MB", port: "3003/TCP" },
  { name: "cron-privesc-sandbox", users: 7, status: "Healthy", cpu: "65%", memory: "1.8 GB", port: "3004/TCP" },
];

const SYSTEM_SERVICES = [
  { name: "FastAPI Core Engine", status: "Online", latency: "14ms", icon: Activity },
  { name: "Container Sandbox Pool", status: "Online", latency: "28ms", icon: TerminalIcon },
  { name: "PostgreSQL Database", status: "Online", latency: "4ms", icon: Database },
  { name: "AI Tutor LLM Gateway", status: "Online", latency: "120ms", icon: Zap },
];

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState(tabParam);
  const [authorized, setAuthorized] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [statsData, setStatsData] = useState(DEFAULT_STATS);
  const [metricsSummary, setMetricsSummary] = useState<any>({});
  const [containerStatus, setContainerStatus] = useState(DEFAULT_CONTAINERS);
  const [resources, setResources] = useState({ cpu: 42, ram: 64, storage: 78, db_conn: 14 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    full_name: "",
    username: "",
    role: "student",
    subscription_tier: "free",
    xp: 0,
    is_verified: false,
  });

  // KYC Verifications
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Courses & Lessons State
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

  // Exams & Questions State
  const [examsList, setExamsList] = useState<any[]>([]);
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
  const [activeExamQuestions, setActiveExamQuestions] = useState<{ exam: any; questions: any[] } | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
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
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);

  // Batches State
  const [batchesList, setBatchesList] = useState<any[]>([]);
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
  const [activeBatchStudents, setActiveBatchStudents] = useState<{ batch: any; students: any[] } | null>(null);
  const [enrollStudentEmail, setEnrollStudentEmail] = useState("");

  // Labs & Sandboxes State
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
  const [labSessionsList, setLabSessionsList] = useState<any[]>([]);

  // Certificates State
  const [certificatesList, setCertificatesList] = useState<any[]>([]);
  const [showIssueCertModal, setShowIssueCertModal] = useState(false);
  const [manualCertForm, setManualCertForm] = useState({
    user_id: "",
    course_id: "",
    exam_id: "",
    score_pct: 100,
    certificate_type: "course_completion",
  });

  // Community Posts State
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [inspectingPost, setInspectingPost] = useState<any | null>(null);

  // Billing & Financials State
  const [financialsData, setFinancialsData] = useState<any>({
    gross_revenue: 0,
    refunded_total: 0,
    net_revenue: 0,
    total_invoices: 0,
    paid_subscriptions_count: 0,
    lifetime_course_purchases_count: 0,
    active_promos: [],
  });
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const loadAdminData = async () => {
    setRefreshing(true);
    try {
      const user = await api.getMe();
      if (user.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setAuthorized(true);

      // Load core metrics
      try {
        const data = await api.getAdminMetrics();
        if (data.stats) {
          const mappedStats = data.stats.map((s: { label: string; value: string; change: string }) => {
            let icon = Activity;
            if (s.label === "Total Users") icon = Users;
            else if (s.label === "Total Revenue") icon = DollarSign;
            else if (s.label === "Active Sandboxes") icon = TerminalIcon;
            else if (s.label === "Issued Credentials") icon = Award;
            return {
              ...s,
              icon,
              color:
                s.label === "Total Users"
                  ? "text-primary"
                  : s.label === "Total Revenue"
                  ? "text-success"
                  : s.label === "Active Sandboxes"
                  ? "text-accent"
                  : "text-warning",
              bg:
                s.label === "Total Users"
                  ? "bg-primary/10"
                  : s.label === "Total Revenue"
                  ? "bg-success/10"
                  : s.label === "Active Sandboxes"
                  ? "bg-accent/10"
                  : "bg-warning/10",
            };
          });
          setStatsData(mappedStats);
        }
        if (data.summary) setMetricsSummary(data.summary);
        if (data.containers) setContainerStatus(data.containers);
        if (data.resources) setResources(data.resources);
        if (data.errors) setRecentLogs(data.errors);
      } catch (err) {
        console.warn("Metrics load error:", err);
      }

      // Load Users
      try {
        const uList = await api.getAdminUsers();
        if (uList) setUsersList(uList);
      } catch (e) {
        console.warn("Failed users:", e);
      }

      // Load KYC
      try {
        const vList = await api.getAdminVerifications();
        if (vList) setVerifications(vList);
      } catch (e) {
        console.warn("Failed KYC:", e);
      }

      // Load Courses
      try {
        const cList = await api.getAdminCourses();
        if (cList) setCoursesList(cList);
      } catch (e) {
        console.warn("Failed courses:", e);
      }

      // Load Exams & Submissions
      try {
        const eList = await api.getAdminExams();
        if (eList) setExamsList(eList);
        const sList = await api.getAdminExamSubmissions();
        if (sList) setSubmissionsList(sList);
      } catch (e) {
        console.warn("Failed exams:", e);
      }

      // Load Batches
      try {
        const bList = await api.getAdminBatches();
        if (bList) setBatchesList(bList);
      } catch (e) {
        console.warn("Failed batches:", e);
      }

      // Load Labs & Sessions
      try {
        const lList = await api.getAdminLabs();
        if (lList) setLabsList(lList);
        const lsList = await api.getAdminLabSessions();
        if (lsList) setLabSessionsList(lsList);
      } catch (e) {
        console.warn("Failed labs:", e);
      }

      // Load Certificates
      try {
        const certList = await api.getAdminCertificates();
        if (certList) setCertificatesList(certList);
      } catch (e) {
        console.warn("Failed certs:", e);
      }

      // Load Community Posts
      try {
        const pList = await api.getAdminPosts();
        if (pList) setCommunityPosts(pList);
      } catch (e) {
        console.warn("Failed posts:", e);
      }

      // Load Financials & Invoices
      try {
        const fin = await api.getAdminFinancials();
        if (fin) setFinancialsData(fin);
        const invList = await api.getAdminInvoices();
        if (invList) setInvoicesList(invList);
      } catch (e) {
        console.warn("Failed invoices:", e);
      }
    } catch (err) {
      console.error("Auth error:", err);
      router.push("/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [router]);

  // Handlers for KYC Review
  const handleReviewKYC = async (userId: string, newStatus: "verified" | "rejected") => {
    try {
      setReviewingId(userId);
      const updated = await api.reviewNidVerification(userId, { status: newStatus });
      setVerifications((prev) => prev.map((v) => (v.user_id === userId ? updated : v)));
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, verification_status: newStatus, is_verified: newStatus === "verified" } : u))
      );
    } catch (e: any) {
      alert(`Review error: ${e.message}`);
    } finally {
      setReviewingId(null);
    }
  };

  // Handlers for User Management
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminUser(newUserForm);
      setUsersList((prev) => [created, ...prev]);
      setShowAddUserModal(false);
      setNewUserForm({
        email: "",
        password: "",
        full_name: "",
        username: "",
        role: "student",
        subscription_tier: "free",
        xp: 0,
        is_verified: false,
      });
      alert(`User ${created.email} created successfully.`);
    } catch (e: any) {
      alert(`Error creating user: ${e.message}`);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const updated = await api.updateAdminUser(editingUser.id, editingUser);
      setUsersList((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
      setEditingUser(null);
      alert("User updated successfully.");
    } catch (e: any) {
      alert(`Error updating user: ${e.message}`);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user ${email}?`)) return;
    try {
      await api.deleteAdminUser(userId);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      alert("User deleted.");
    } catch (e: any) {
      alert(`Error deleting user: ${e.message}`);
    }
  };

  // Handlers for Courses & Lessons
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

  // Handlers for Exams & Questions
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
      alert(`Exam "${created.title}" created.`);
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
      alert("Exam updated.");
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

  // Handlers for Batches
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
      alert("Batch updated.");
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
      alert(res.message);
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

  // Handlers for Labs
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
      alert(`Lab "${created.title}" created.`);
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
      alert("Lab updated.");
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
    if (!confirm(`Terminate sandbox session ${sessionId}?`)) return;
    try {
      await api.terminateAdminLabSession(sessionId);
      setLabSessionsList((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: "stopped" } : s)));
      alert("Sandbox terminated.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  // Handlers for Certificates
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.issueAdminCertificate(manualCertForm);
      alert(res.message);
      setShowIssueCertModal(false);
      const updated = await api.getAdminCertificates();
      setCertificatesList(updated);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleRevokeCertificate = async (certId: string, token: string) => {
    if (!confirm(`Are you sure you want to revoke and delete certificate ${token}?`)) return;
    try {
      await api.revokeAdminCertificate(certId);
      setCertificatesList((prev) => prev.filter((c) => c.id !== certId && c.verification_token !== certId));
      alert("Certificate revoked.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  // Handlers for Community
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this community post?")) return;
    try {
      await api.deletePost(postId);
      setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
      if (inspectingPost?.id === postId) {
        setInspectingPost(null);
      }
      alert("Post deleted.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await api.deleteAdminComment(commentId);
      if (inspectingPost) {
        setInspectingPost((prev: any) => ({
          ...prev,
          comments: prev.comments.filter((c: any) => c.id !== commentId),
        }));
      }
      alert("Comment removed.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleToggleSolved = async (postId: string) => {
    try {
      const res = await api.togglePostSolved(postId);
      setCommunityPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, is_solved: res.is_solved } : p)));
      if (inspectingPost?.id === postId) {
        setInspectingPost((prev: any) => ({ ...prev, is_solved: res.is_solved }));
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  // Handlers for Invoices
  const handleUpdateInvoiceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    try {
      await api.updateAdminInvoiceStatus(editingInvoice.id, editingInvoice.status);
      setInvoicesList((prev) =>
        prev.map((inv) => (inv.id === editingInvoice.id ? { ...inv, status: editingInvoice.status } : inv))
      );
      setEditingInvoice(null);
      alert("Invoice status updated.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-foreground-muted tracking-wide">
          Connecting to Admin Control Center...
        </p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card padding="lg" className="max-w-md text-center space-y-4 border-error/30 bg-surface">
          <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto border border-error/30">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            You do not have administrative credentials to access this management console.
          </p>
          <Button onClick={() => router.push("/login")} size="sm" className="mx-auto">
            Return to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingKYCCount = verifications.filter((v) => v.verification_status === "pending").length;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/25 flex items-center justify-center shadow-sm shadow-blue-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Admin Command Center</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                System Control
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time cybersecurity platform metrics, user access governance, curriculum, and system telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAdminData}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Telemetry"}
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-sm hover:border-slate-700 transition-all duration-150 flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {stat.value}
                    </h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {stat.change}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Unified Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#0C1222] border border-[#1E293B] rounded-xl overflow-x-auto scrollbar-thin shadow-inner">
        {[
          { id: "overview", label: "Overview & Health", icon: Layers },
          { id: "users", label: `Users (${usersList.length})`, icon: Users },
          { id: "courses", label: `Courses (${coursesList.length})`, icon: BookOpen },
          { id: "exams", label: `Exams (${examsList.length})`, icon: FileCheck },
          { id: "batches", label: `Cohorts (${batchesList.length})`, icon: GraduationCap },
          { id: "labs", label: `Labs (${labsList.length})`, icon: TerminalIcon },
          { id: "certificates", label: `Certificates (${certificatesList.length})`, icon: Award },
          {
            id: "verifications",
            label: "KYC Queue",
            icon: BadgeCheck,
            badge: pendingKYCCount > 0 ? `${pendingKYCCount}` : undefined,
          },
          { id: "community", label: `Community (${communityPosts.length})`, icon: MessageSquare },
          { id: "billing", label: "Financials", icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.push(`/admin?tab=${tab.id}`);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 ml-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & CLUSTER HEALTH */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <Card padding="lg" className="border border-border/60 bg-surface space-y-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-bold text-foreground">Cluster Resource Load</h3>
                  </div>
                  <span className="text-[11px] font-mono text-success flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    HEALTHY CLUSTER
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-surface-elevated/50 rounded-xl border border-border/40 space-y-2">
                    <p className="text-xs text-foreground-muted font-medium">CPU Load</p>
                    <p className="text-xl font-extrabold text-foreground">{resources.cpu}%</p>
                    <ProgressBar value={resources.cpu} variant="primary" size="sm" />
                  </div>
                  <div className="p-3.5 bg-surface-elevated/50 rounded-xl border border-border/40 space-y-2">
                    <p className="text-xs text-foreground-muted font-medium">Memory RAM</p>
                    <p className="text-xl font-extrabold text-foreground">{resources.ram}%</p>
                    <ProgressBar value={resources.ram} variant="gradient" size="sm" />
                  </div>
                  <div className="p-3.5 bg-surface-elevated/50 rounded-xl border border-border/40 space-y-2">
                    <p className="text-xs text-foreground-muted font-medium">Storage</p>
                    <p className="text-xl font-extrabold text-foreground">{resources.storage}%</p>
                    <ProgressBar value={resources.storage} variant="warning" size="sm" />
                  </div>
                  <div className="p-3.5 bg-surface-elevated/50 rounded-xl border border-border/40 space-y-2">
                    <p className="text-xs text-foreground-muted font-medium">DB Pool</p>
                    <p className="text-xl font-extrabold text-foreground">{resources.db_conn} / 100</p>
                    <ProgressBar value={resources.db_conn} variant="success" size="sm" />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">
                      Active Docker Sandbox Pool
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="border-b border-border text-foreground-muted">
                        <tr>
                          <th className="pb-2.5 font-semibold">Container Name</th>
                          <th className="pb-2.5 font-semibold">Status</th>
                          <th className="pb-2.5 font-semibold">Learners</th>
                          <th className="pb-2.5 font-semibold">CPU</th>
                          <th className="pb-2.5 font-semibold">Memory</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {containerStatus.map((c) => (
                          <tr key={c.name} className="hover:bg-surface-elevated/40">
                            <td className="py-2.5 font-mono text-primary font-medium">{c.name}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/15 text-success border border-success/20">
                                {c.status}
                              </span>
                            </td>
                            <td className="py-2.5 font-semibold text-foreground">{c.users} active</td>
                            <td className="py-2.5 font-mono text-foreground-secondary">{c.cpu}</td>
                            <td className="py-2.5 font-mono text-foreground-secondary">{c.memory}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <Card padding="lg" className="border border-border/60 bg-surface space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Radio className="w-5 h-5 text-success" />
                    System Service Nodes
                  </h3>
                  <span className="text-[10px] font-mono text-foreground-muted">Live Telemetry</span>
                </div>

                <div className="space-y-3">
                  {SYSTEM_SERVICES.map((srv) => {
                    const Icon = srv.icon;
                    return (
                      <div
                        key={srv.name}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/50 border border-border/40 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-xs text-foreground">{srv.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-mono text-foreground-muted">{srv.latency}</span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            {srv.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {pendingKYCCount > 0 && (
                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{pendingKYCCount} Student KYC Submissions</p>
                      <p className="text-[11px] text-slate-400">Waiting for National ID audit review.</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab("verifications")}>
                    Audit Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER & ACCESS CONTROL */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <Card padding="lg" className="border border-[#1E293B] bg-[#0F172A] space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Registered User Roster</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total {usersList.length} user records registered in platform database.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, username, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-[#131B2E] border border-[#1E293B] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-[#131B2E] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="pro_member">Pro Members</option>
                <option value="premium_member">Premium Members</option>
                <option value="instructor">Instructors</option>
                <option value="admin">Administrators</option>
              </select>

              <Button size="sm" onClick={() => setShowAddUserModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Add User
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C1222]/80 border-b border-[#1E293B] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">User Details</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Subscription</th>
                  <th className="py-3 px-3">Earned XP</th>
                  <th className="py-3 px-3">KYC Status</th>
                  <th className="py-3 px-3">Registered At</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name || u.email} src={u.avatar_url} size="sm" />
                        <div>
                          <p className="font-semibold text-white">{u.full_name || "Anonymous User"}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          u.role === "admin"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : u.role === "instructor"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : u.role?.includes("member")
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-800 text-slate-300 border-slate-700/60"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          u.subscription_status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {u.subscription_tier || "free"} ({u.subscription_status || "inactive"})
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-blue-400">
                      ⚡ {(u.xp || 0).toLocaleString()} XP
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          u.verification_status === "verified"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : u.verification_status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700/50"
                        }`}
                      >
                        {u.verification_status || "unverified"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-foreground-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingUser({ ...u })}
                          icon={<Edit className="w-3.5 h-3.5" />}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="text-error hover:bg-error/10"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COURSES & LESSON SYLLABUS */}
      {/* ========================================================================= */}
      {activeTab === "courses" && (
        <div className="space-y-6">
          <Card padding="lg" className="border border-border/60 bg-surface space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Course Catalog & Syllabus Management</h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Publish courses, set lifetime pricing, organize modules, and upload video lessons.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowAddCourseModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Create New Course
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-foreground-muted font-semibold">
                  <tr>
                    <th className="py-3 px-3">Course Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Difficulty</th>
                    <th className="py-3 px-3">Price (USD)</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Lessons</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {coursesList.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">{c.title}</div>
                        <div className="text-[10px] text-foreground-muted font-mono">{c.id}</div>
                      </td>
                      <td className="py-3 px-3 font-medium">{c.category || "General"}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-success">${Number(c.price || 49).toFixed(2)}</td>
                      <td className="py-3 px-3 text-foreground-secondary">{c.estimated_duration} mins</td>
                      <td className="py-3 px-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenLessons(c)}
                          className="text-[11px] font-semibold"
                          icon={<ListOrdered className="w-3 h-3" />}
                        >
                          {c.lesson_count || 0} Lessons
                        </Button>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.is_published
                              ? "bg-success/15 text-success border border-success/30"
                              : "bg-surface-elevated text-foreground-muted border border-border"
                          }`}
                        >
                          {c.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCourse({ ...c })}
                            icon={<Edit className="w-3.5 h-3.5" />}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCourse(c.id, c.title)}
                            className="text-error hover:bg-error/10"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EXAMS & QUESTION BANKS */}
      {/* ========================================================================= */}
      {activeTab === "exams" && (
        <div className="space-y-6">
          <Card padding="lg" className="border border-border/60 bg-surface space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Certification Exams & Assessment Question Banks</h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Manage qualification exams, passing scores, question options, and automated credential issuance.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowAddExamModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Create Certification Track
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-foreground-muted font-semibold">
                  <tr>
                    <th className="py-3 px-3">Exam Title</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Passing %</th>
                    <th className="py-3 px-3">Total Marks</th>
                    <th className="py-3 px-3">Question Bank</th>
                    <th className="py-3 px-3">Submissions</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {examsList.map((ex) => (
                    <tr key={ex.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">{ex.title}</div>
                        <div className="text-[10px] text-foreground-muted font-mono">{ex.id}</div>
                      </td>
                      <td className="py-3 px-3 font-mono">{ex.duration_minutes} mins</td>
                      <td className="py-3 px-3 font-mono font-bold text-primary">{ex.passing_score_pct}%</td>
                      <td className="py-3 px-3 font-mono">{ex.total_marks} pts</td>
                      <td className="py-3 px-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenQuestions(ex)}
                          className="text-[11px] font-semibold"
                          icon={<HelpCircle className="w-3 h-3" />}
                        >
                          {ex.question_count || 0} Questions
                        </Button>
                      </td>
                      <td className="py-3 px-3 font-bold text-foreground">{ex.submission_count || 0} taken</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ex.is_published
                              ? "bg-success/15 text-success border border-success/30"
                              : "bg-surface-elevated text-foreground-muted border border-border"
                          }`}
                        >
                          {ex.is_published ? "Active" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingExam({ ...ex })}
                            icon={<Edit className="w-3.5 h-3.5" />}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteExam(ex.id, ex.title)}
                            className="text-error hover:bg-error/10"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Student Submissions Log Table */}
          <Card padding="lg" className="border border-border/60 bg-surface space-y-4 shadow-lg">
            <div className="border-b border-border/40 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Live Student Exam Submissions Log
              </h3>
              <span className="text-xs text-foreground-muted font-mono">{submissionsList.length} total attempts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-foreground-muted font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Exam</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Result</th>
                    <th className="py-2.5 px-3">Certificate Token</th>
                    <th className="py-2.5 px-3">Submitted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {submissionsList.slice(0, 25).map((s) => (
                    <tr key={s.id} className="hover:bg-surface-elevated/40">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-foreground">{s.user_name}</p>
                        <p className="text-[10px] text-foreground-muted font-mono">{s.user_email}</p>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{s.exam_title}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">
                        {s.score} / {s.total_score} ({s.score_pct}%)
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.passed
                              ? "bg-success/15 text-success border border-success/30"
                              : "bg-error/15 text-error border border-error/30"
                          }`}
                        >
                          {s.passed ? "PASSED" : "FAILED"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-accent">
                        {s.certificate_token || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-foreground-muted">
                        {new Date(s.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: COHORTS & LIVE BATCHES */}
      {/* ========================================================================= */}
      {activeTab === "batches" && (
        <Card padding="lg" className="border border-border/60 bg-surface space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Live Cohorts & Training Batches</h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Assign instructors, configure live class schedules & meeting links, and manage student enrollments.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowAddBatchModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Create Live Batch
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border text-foreground-muted font-semibold">
                <tr>
                  <th className="py-3 px-3">Batch Name & Code</th>
                  <th className="py-3 px-3">Instructor</th>
                  <th className="py-3 px-3">Course Track</th>
                  <th className="py-3 px-3">Schedule</th>
                  <th className="py-3 px-3">Capacity</th>
                  <th className="py-3 px-3">Meeting Link</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {batchesList.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-foreground">{b.name}</p>
                      <p className="text-[10px] text-primary font-mono font-bold">{b.batch_code}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">{b.instructor_name}</td>
                    <td className="py-3 px-3 text-foreground-secondary">{b.course_title || "All Modules"}</td>
                    <td className="py-3 px-3 text-[11px] text-foreground-muted">{b.schedule_details || "TBA"}</td>
                    <td className="py-3 px-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBatchStudents(b)}
                        className="text-[11px] font-semibold"
                        icon={<Users className="w-3 h-3" />}
                      >
                        {b.enrolled_count} / {b.max_students}
                      </Button>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-accent truncate max-w-[140px]">
                      {b.meeting_link ? (
                        <a href={b.meeting_link} target="_blank" rel="noreferrer" className="underline hover:text-white">
                          {b.meeting_link}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.is_active
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-surface-elevated text-foreground-muted border border-border"
                        }`}
                      >
                        {b.is_active ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingBatch({ ...b })}
                          icon={<Edit className="w-3.5 h-3.5" />}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBatch(b.id, b.name)}
                          className="text-error hover:bg-error/10"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: LABS & SANDBOX POOL */}
      {/* ========================================================================= */}
      {activeTab === "labs" && (
        <div className="space-y-6">
          <Card padding="lg" className="border border-border/60 bg-surface space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Hands-on Practice Labs & CTF Challenges</h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Configure interactive terminal sandboxes, XP rewards, time limits, and container templates.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowAddLabModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Create New Lab
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-foreground-muted font-semibold">
                  <tr>
                    <th className="py-3 px-3">Lab Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Difficulty</th>
                    <th className="py-3 px-3">Container Template</th>
                    <th className="py-3 px-3">XP Reward</th>
                    <th className="py-3 px-3">Time Limit</th>
                    <th className="py-3 px-3">Sessions</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {labsList.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">{l.title}</div>
                        <div className="text-[10px] text-foreground-muted font-mono">{l.id}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">{l.type}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {l.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-accent">{l.container_template}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-blue-400">+{l.xp_reward} XP</td>
                      <td className="py-3 px-3 text-foreground-secondary">{Math.round((l.time_limit || 1800) / 60)} mins</td>
                      <td className="py-3 px-3 font-bold text-foreground">{l.session_count || 0}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingLab({ ...l })}
                            icon={<Edit className="w-3.5 h-3.5" />}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLab(l.id, l.title)}
                            className="text-error hover:bg-error/10"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Live Sandbox Sessions Monitor */}
          <Card padding="lg" className="border border-border/60 bg-surface space-y-4 shadow-lg">
            <div className="border-b border-border/40 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-accent" />
                Live Container Sandbox Sessions Monitor
              </h3>
              <span className="text-xs text-foreground-muted font-mono">{labSessionsList.length} total sessions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-foreground-muted font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Lab Environment</th>
                    <th className="py-2.5 px-3">Container ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Started At</th>
                    <th className="py-2.5 px-3">Expires At</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {labSessionsList.slice(0, 20).map((s) => (
                    <tr key={s.id} className="hover:bg-surface-elevated/40">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-foreground">{s.user_name}</p>
                        <p className="text-[10px] text-foreground-muted font-mono">{s.user_email}</p>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{s.lab_title}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-primary">{s.container_id || "sandbox-vm"}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === "running"
                              ? "bg-success/15 text-success border border-success/30 animate-pulse"
                              : s.status === "completed"
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "bg-surface-elevated text-foreground-muted border border-border"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-foreground-muted">
                        {new Date(s.started_at).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-foreground-muted">
                        {s.expires_at ? new Date(s.expires_at).toLocaleTimeString() : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {s.status === "running" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTerminateSession(s.id)}
                            className="text-[10px] border-error/40 text-error hover:bg-error/10"
                          >
                            Terminate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: CERTIFICATES & CREDENTIALS */}
      {/* ========================================================================= */}
      {activeTab === "certificates" && (
        <Card padding="lg" className="border border-border/60 bg-surface space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Issued Credentials & Certificate Registry</h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Audit cryptographically verifiable certificates minted for course completions and exam passes.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowIssueCertModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Manually Mint Certificate
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border text-foreground-muted font-semibold">
                <tr>
                  <th className="py-3 px-3">Verification Token</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Credential Title</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Issued Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {certificatesList.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-primary">{c.verification_token}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-foreground">{c.student_name}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{c.student_email}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">{c.title}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {c.certificate_type === "exam_certified" ? "Exam Certified" : "Course Completion"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-success">{c.score_pct}%</td>
                    <td className="py-3 px-3 font-mono text-foreground-muted">
                      {new Date(c.issued_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(c.verify_url, "_blank")}
                          className="text-primary"
                          icon={<ExternalLink className="w-3 h-3" />}
                        >
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRevokeCertificate(c.id, c.verification_token)}
                          className="text-error hover:bg-error/10"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: KYC VERIFICATION QUEUE */}
      {/* ========================================================================= */}
      {activeTab === "verifications" && (
        <Card padding="lg" className="border border-border/60 bg-surface space-y-6 shadow-lg">
          <div className="border-b border-border/40 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Student KYC & NID Verification Queue</h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Review submitted National ID documents to mint verified credential certificates.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {pendingKYCCount} Pending Reviews
            </span>
          </div>

          {verifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-foreground-muted">
                <CheckCircle2 className="w-6 h-6 text-success opacity-60" />
              </div>
              <p className="text-sm font-bold text-foreground">Queue is Clear</p>
              <p className="text-xs text-foreground-muted">No student KYC verification requests submitted yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifications.map((item) => (
                <div
                  key={item.user_id}
                  className="p-5 rounded-2xl bg-surface-elevated/40 border border-border/60 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.full_name || "Unnamed Student"}</h4>
                      <p className="text-xs font-mono text-foreground-muted">{item.email}</p>
                      <p className="text-xs font-bold text-primary mt-1">NID: {item.nid_number}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                        item.verification_status === "verified"
                          ? "bg-success/15 text-success border-success/30"
                          : item.verification_status === "rejected"
                          ? "bg-error/15 text-error border-error/30"
                          : "bg-warning/15 text-warning border-warning/30 animate-pulse"
                      }`}
                    >
                      {item.verification_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {item.nid_front_image ? (
                      <div
                        onClick={() => setPreviewImage(item.nid_front_image)}
                        className="cursor-pointer group relative rounded-xl overflow-hidden border border-border bg-black/40 h-28 flex items-center justify-center"
                      >
                        <img
                          src={item.nid_front_image}
                          alt="Front NID"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                          <Eye className="w-3.5 h-3.5" /> Preview Front
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 bg-surface h-28 flex items-center justify-center text-[10px] text-foreground-muted">
                        No Front Image
                      </div>
                    )}

                    {item.nid_back_image ? (
                      <div
                        onClick={() => setPreviewImage(item.nid_back_image)}
                        className="cursor-pointer group relative rounded-xl overflow-hidden border border-border bg-black/40 h-28 flex items-center justify-center"
                      >
                        <img
                          src={item.nid_back_image}
                          alt="Back NID"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                          <Eye className="w-3.5 h-3.5" /> Preview Back
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 bg-surface h-28 flex items-center justify-center text-[10px] text-foreground-muted">
                        No Back Image
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => handleReviewKYC(item.user_id, "verified")}
                      disabled={reviewingId === item.user_id}
                      className="bg-success hover:bg-success/90 text-white font-bold text-xs"
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve NID
                    </Button>
                    <Button
                      size="sm"
                      fullWidth
                      variant="outline"
                      onClick={() => handleReviewKYC(item.user_id, "rejected")}
                      disabled={reviewingId === item.user_id}
                      className="border-error/40 text-error hover:bg-error/10 font-bold text-xs"
                      icon={<X className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: COMMUNITY & FORUM MODERATION */}
      {/* ========================================================================= */}
      {activeTab === "community" && (
        <Card padding="lg" className="border border-border/60 bg-surface space-y-5 shadow-lg">
          <div className="border-b border-border/40 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Community & Forum Moderation</h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Review discussions, delete spam or abusive posts, and moderate student replies.
              </p>
            </div>
            <span className="text-xs text-foreground-muted font-mono">{communityPosts.length} total posts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border text-foreground-muted font-semibold">
                <tr>
                  <th className="py-3 px-3">Post Title</th>
                  <th className="py-3 px-3">Author</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Upvotes</th>
                  <th className="py-3 px-3">Replies</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {communityPosts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-3 max-w-[280px]">
                      <p className="font-bold text-foreground truncate">{p.title}</p>
                      <p className="text-[11px] text-foreground-muted line-clamp-1">{p.content}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">{p.author_name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {p.category || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-blue-400">+{p.upvotes}</td>
                    <td className="py-3 px-3 font-bold text-foreground">{p.comment_count || 0}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleSolved(p.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          p.is_solved
                            ? "bg-success/15 text-success border border-success/30 hover:bg-success/20"
                            : "bg-surface-elevated text-foreground-muted border border-border hover:text-foreground"
                        }`}
                      >
                        {p.is_solved ? "Solved" : "Unsolved"}
                      </button>
                    </td>
                    <td className="py-3 px-3 font-mono text-foreground-muted">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setInspectingPost(p)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePost(p.id)}
                          className="text-error hover:bg-error/10"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: FINANCIALS & INVOICES */}
      {/* ========================================================================= */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card padding="md" className="border border-border/60 bg-surface space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-foreground-muted font-bold">Gross Platform Revenue</p>
              <h3 className="text-2xl font-extrabold text-success">
                ${Number(financialsData.gross_revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-foreground-secondary">{financialsData.total_invoices || 0} total settled transactions</p>
            </Card>

            <Card padding="md" className="border border-border/60 bg-surface space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-foreground-muted font-bold">Active Subscriptions</p>
              <h3 className="text-2xl font-extrabold text-primary">
                {financialsData.paid_subscriptions_count || 0}
              </h3>
              <p className="text-[11px] text-foreground-secondary">Monthly & Annual recurring seats</p>
            </Card>

            <Card padding="md" className="border border-border/60 bg-surface space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-foreground-muted font-bold">Lifetime Course Sales</p>
              <h3 className="text-2xl font-extrabold text-accent">
                {financialsData.lifetime_course_purchases_count || 0}
              </h3>
              <p className="text-[11px] text-foreground-secondary">$49/course permanent passes</p>
            </Card>
          </div>

          <Card padding="lg" className="border border-border/60 bg-surface space-y-5 shadow-lg">
            <div className="border-b border-border/40 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Itemized Transactions & Invoices Ledger</h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Real-time billing receipts, promo discounts, card brand/last4, and payment statuses.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-foreground-muted font-semibold">
                  <tr>
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Plan / Item</th>
                    <th className="py-3 px-3">Subtotal</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-3">Total Paid</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3">Promo</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {invoicesList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-primary">{inv.invoice_number}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-foreground">{inv.user_name}</p>
                        <p className="text-[10px] text-foreground-muted font-mono">{inv.user_email}</p>
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">{inv.item_name}</td>
                      <td className="py-3 px-3 font-mono text-foreground-secondary">${Number(inv.subtotal || 0).toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono text-error">
                        {inv.discount_amount > 0 ? `-$${Number(inv.discount_amount).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-success">
                        ${Number(inv.total_paid || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-foreground-secondary">
                        {inv.payment_method} {inv.card_last4 ? `(•${inv.card_last4})` : ""}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-emerald-400 font-semibold">{inv.promo_code || "—"}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === "paid"
                              ? "bg-success/15 text-success border border-success/30"
                              : inv.status === "refunded"
                              ? "bg-error/15 text-error border border-error/30"
                              : "bg-warning/15 text-warning border border-warning/30"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-foreground-muted">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingInvoice({ ...inv })}
                          icon={<Edit className="w-3.5 h-3.5" />}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS */}
      {/* ========================================================================= */}

      {/* 1. Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-base font-bold text-foreground">Create New Platform User</h3>
                <button onClick={() => setShowAddUserModal(false)} className="text-foreground-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="user@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Full Name</label>
                    <input
                      type="text"
                      value={newUserForm.full_name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                      placeholder="Alex Mercer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Username</label>
                    <input
                      type="text"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                      placeholder="alex_hacker"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Password *</label>
                  <input
                    required
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Role</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Subscription Tier</label>
                    <select
                      value={newUserForm.subscription_tier}
                      onChange={(e) => setNewUserForm({ ...newUserForm, subscription_tier: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddUserModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Create User
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-base font-bold text-foreground">Edit User Profile & Access</h3>
                <button onClick={() => setEditingUser(null)} className="text-foreground-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Full Name</label>
                    <input
                      type="text"
                      value={editingUser.full_name || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Username</label>
                    <input
                      type="text"
                      value={editingUser.username || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    >
                      <option value="student">student</option>
                      <option value="pro_member">pro_member</option>
                      <option value="premium_member">premium_member</option>
                      <option value="instructor">instructor</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Subscription Tier</label>
                    <select
                      value={editingUser.subscription_tier || "free"}
                      onChange={(e) => setEditingUser({ ...editingUser, subscription_tier: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    >
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                      <option value="premium">premium</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Subscription Status</label>
                    <select
                      value={editingUser.subscription_status || "inactive"}
                      onChange={(e) => setEditingUser({ ...editingUser, subscription_status: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    >
                      <option value="inactive">inactive</option>
                      <option value="active">active</option>
                      <option value="canceled">canceled</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Earned XP</label>
                    <input
                      type="number"
                      value={editingUser.xp || 0}
                      onChange={(e) => setEditingUser({ ...editingUser, xp: Number(e.target.value) })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">KYC Verification Status</label>
                    <select
                      value={editingUser.verification_status || "unverified"}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          verification_status: e.target.value,
                          is_verified: e.target.value === "verified",
                        })
                      }
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    >
                      <option value="unverified">unverified</option>
                      <option value="pending">pending</option>
                      <option value="verified">verified</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Streak Days</label>
                    <input
                      type="number"
                      value={editingUser.streak_days || 0}
                      onChange={(e) => setEditingUser({ ...editingUser, streak_days: Number(e.target.value) })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(null)}>
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

      {/* 3. Add/Edit Course Modal */}
      <AnimatePresence>
        {(showAddCourseModal || editingCourse) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-base font-bold text-foreground">
                  {editingCourse ? "Edit Course" : "Create New Course"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddCourseModal(false);
                    setEditingCourse(null);
                  }}
                  className="text-foreground-muted hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Course Title *</label>
                  <input
                    required
                    type="text"
                    value={editingCourse ? editingCourse.title : newCourseForm.title}
                    onChange={(e) =>
                      editingCourse
                        ? setEditingCourse({ ...editingCourse, title: e.target.value })
                        : setNewCourseForm({ ...newCourseForm, title: e.target.value })
                    }
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Web Security Fundamentals"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Category</label>
                    <input
                      type="text"
                      value={editingCourse ? editingCourse.category : newCourseForm.category}
                      onChange={(e) =>
                        editingCourse
                          ? setEditingCourse({ ...editingCourse, category: e.target.value })
                          : setNewCourseForm({ ...newCourseForm, category: e.target.value })
                      }
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Difficulty</label>
                    <select
                      value={editingCourse ? editingCourse.difficulty : newCourseForm.difficulty}
                      onChange={(e) =>
                        editingCourse
                          ? setEditingCourse({ ...editingCourse, difficulty: e.target.value })
                          : setNewCourseForm({ ...newCourseForm, difficulty: e.target.value })
                      }
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
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
                    <label className="font-semibold text-foreground">Lifetime Price ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingCourse ? editingCourse.price : newCourseForm.price}
                      onChange={(e) =>
                        editingCourse
                          ? setEditingCourse({ ...editingCourse, price: parseFloat(e.target.value) })
                          : setNewCourseForm({ ...newCourseForm, price: parseFloat(e.target.value) })
                      }
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Estimated Duration (Mins)</label>
                    <input
                      type="number"
                      value={editingCourse ? editingCourse.estimated_duration : newCourseForm.estimated_duration}
                      onChange={(e) =>
                        editingCourse
                          ? setEditingCourse({ ...editingCourse, estimated_duration: parseInt(e.target.value) })
                          : setNewCourseForm({ ...newCourseForm, estimated_duration: parseInt(e.target.value) })
                      }
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Description</label>
                  <textarea
                    rows={3}
                    value={editingCourse ? editingCourse.description : newCourseForm.description}
                    onChange={(e) =>
                      editingCourse
                        ? setEditingCourse({ ...editingCourse, description: e.target.value })
                        : setNewCourseForm({ ...newCourseForm, description: e.target.value })
                    }
                    className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="course_published"
                    checked={editingCourse ? editingCourse.is_published : newCourseForm.is_published}
                    onChange={(e) =>
                      editingCourse
                        ? setEditingCourse({ ...editingCourse, is_published: e.target.checked })
                        : setNewCourseForm({ ...newCourseForm, is_published: e.target.checked })
                    }
                    className="rounded border-border"
                  />
                  <label htmlFor="course_published" className="font-semibold text-foreground">
                    Publish Course Live to Students
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddCourseModal(false);
                      setEditingCourse(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    {editingCourse ? "Save Changes" : "Create Course"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Manage Lessons Drawer/Modal */}
      <AnimatePresence>
        {activeCourseLessons && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4 max-h-[88vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Lessons for: {activeCourseLessons.course.title}
                  </h3>
                  <p className="text-xs text-foreground-muted">Organize syllabus chapters, videos, and reading material.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setShowAddLessonModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add Lesson
                  </Button>
                  <button onClick={() => setActiveCourseLessons(null)} className="text-foreground-muted hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {activeCourseLessons.lessons.length === 0 ? (
                  <div className="py-12 text-center text-foreground-muted text-xs">
                    No lessons created yet for this course. Click "Add Lesson" to start syllabus.
                  </div>
                ) : (
                  activeCourseLessons.lessons.map((l, idx) => (
                    <div
                      key={l.id}
                      className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border/50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-surface border border-border text-[11px] font-mono font-bold flex items-center justify-center text-foreground-muted">
                          {l.sort_order || idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-foreground text-xs">{l.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                              {l.content_type}
                            </span>
                            <span className="text-[10px] text-foreground-muted">{l.duration} mins</span>
                            {l.video_url && <span className="text-[10px] text-accent truncate max-w-[200px]">{l.video_url}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingLesson({ ...l })}
                          icon={<Edit className="w-3.5 h-3.5" />}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLesson(l.id)}
                          className="text-error hover:bg-error/10"
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

      {/* 5. Add / Edit Lesson Form Modal */}
      <AnimatePresence>
        {(showAddLessonModal || editingLesson) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-base font-bold text-foreground">
                  {editingLesson ? "Edit Lesson" : "Add Lesson to Syllabus"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddLessonModal(false);
                    setEditingLesson(null);
                  }}
                  className="text-foreground-muted hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lesson Title *</label>
                  <input
                    required
                    type="text"
                    value={editingLesson ? editingLesson.title : newLessonForm.title}
                    onChange={(e) =>
                      editingLesson
                        ? setEditingLesson({ ...editingLesson, title: e.target.value })
                        : setNewLessonForm({ ...newLessonForm, title: e.target.value })
                    }
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="How the Web Works: HTTP and HTML"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Content Type</label>
                    <select
                      value={editingLesson ? editingLesson.content_type : newLessonForm.content_type}
                      onChange={(e) =>
                        editingLesson
                          ? setEditingLesson({ ...editingLesson, content_type: e.target.value })
                          : setNewLessonForm({ ...newLessonForm, content_type: e.target.value })
                      }
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    >
                      <option value="video">Video</option>
                      <option value="reading">Reading</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Duration (Mins)</label>
                    <input
                      type="number"
                      value={editingLesson ? editingLesson.duration : newLessonForm.duration}
                      onChange={(e) =>
                        editingLesson
                          ? setEditingLesson({ ...editingLesson, duration: parseInt(e.target.value) })
                          : setNewLessonForm({ ...newLessonForm, duration: parseInt(e.target.value) })
                      }
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Order #</label>
                    <input
                      type="number"
                      value={editingLesson ? editingLesson.sort_order : newLessonForm.sort_order}
                      onChange={(e) =>
                        editingLesson
                          ? setEditingLesson({ ...editingLesson, sort_order: parseInt(e.target.value) })
                          : setNewLessonForm({ ...newLessonForm, sort_order: parseInt(e.target.value) })
                      }
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Video URL (YouTube Embed / Direct MP4)</label>
                  <input
                    type="text"
                    value={editingLesson ? editingLesson.video_url || "" : newLessonForm.video_url}
                    onChange={(e) =>
                      editingLesson
                        ? setEditingLesson({ ...editingLesson, video_url: e.target.value })
                        : setNewLessonForm({ ...newLessonForm, video_url: e.target.value })
                    }
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    placeholder="https://www.youtube-nocookie.com/embed/..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lesson Reading / Markdown Content</label>
                  <textarea
                    rows={4}
                    value={editingLesson ? editingLesson.content || "" : newLessonForm.content}
                    onChange={(e) =>
                      editingLesson
                        ? setEditingLesson({ ...editingLesson, content: e.target.value })
                        : setNewLessonForm({ ...newLessonForm, content: e.target.value })
                    }
                    className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-foreground focus:outline-none font-mono text-[11px]"
                    placeholder="Markdown explanation or quiz JSON..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddLessonModal(false);
                      setEditingLesson(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    {editingLesson ? "Save Changes" : "Save Lesson"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Manage Exam Questions Modal */}
      <AnimatePresence>
        {activeExamQuestions && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4 max-h-[88vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Question Bank: {activeExamQuestions.exam.title}
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Total {activeExamQuestions.questions.length} questions in this certification exam.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowAddQuestionModal(true)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Question
                  </Button>
                  <button onClick={() => setActiveExamQuestions(null)} className="text-foreground-muted hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {activeExamQuestions.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-surface-elevated/40 border border-border/50 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold text-foreground">
                        <span className="text-primary font-mono mr-2">Q{q.sort_order || idx + 1}.</span>
                        {q.question_text}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                          {q.points} pts
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-error hover:bg-error/10"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {q.options?.map((opt: string, oIdx: number) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg text-[11px] border ${
                            String(q.correct_answer) === String(oIdx)
                              ? "bg-success/15 border-success/40 text-success font-bold"
                              : "bg-surface border-border/40 text-foreground-secondary"
                          }`}
                        >
                          <span className="font-mono mr-1.5">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-foreground-muted italic pt-1 border-t border-border/30">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Add Exam Question Modal */}
      <AnimatePresence>
        {showAddQuestionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-base font-bold text-foreground">Add Multiple Choice Question</h3>
                <button onClick={() => setShowAddQuestionModal(false)} className="text-foreground-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateQuestion} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Question Text *</label>
                  <textarea
                    required
                    rows={2}
                    value={newQuestionForm.question_text}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question_text: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-foreground focus:outline-none"
                    placeholder="Which HTTP header defends against Clickjacking attacks?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-foreground">Answer Options *</label>
                  <div className="space-y-1.5">
                    <input
                      required
                      type="text"
                      value={newQuestionForm.opt0}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, opt0: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-foreground"
                      placeholder="Option A"
                    />
                    <input
                      required
                      type="text"
                      value={newQuestionForm.opt1}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, opt1: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-foreground"
                      placeholder="Option B"
                    />
                    <input
                      type="text"
                      value={newQuestionForm.opt2}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, opt2: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-foreground"
                      placeholder="Option C"
                    />
                    <input
                      type="text"
                      value={newQuestionForm.opt3}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, opt3: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-foreground"
                      placeholder="Option D"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Correct Option</label>
                    <select
                      value={newQuestionForm.correct_answer}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correct_answer: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-bold text-success"
                    >
                      <option value="0">Option A (Index 0)</option>
                      <option value="1">Option B (Index 1)</option>
                      <option value="2">Option C (Index 2)</option>
                      <option value="3">Option D (Index 3)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Points Value</label>
                    <input
                      type="number"
                      value={newQuestionForm.points}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, points: parseInt(e.target.value) })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Explanation / Rational</label>
                  <input
                    type="text"
                    value={newQuestionForm.explanation}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    placeholder="X-Frame-Options: DENY disallows framing..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
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

      {/* 8. Batch Students Modal */}
      <AnimatePresence>
        {activeBatchStudents && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Enrolled Roster: {activeBatchStudents.batch.name}
                  </h3>
                  <p className="text-xs text-foreground-muted font-mono">{activeBatchStudents.batch.batch_code}</p>
                </div>
                <button onClick={() => setActiveBatchStudents(null)} className="text-foreground-muted hover:text-foreground">
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
                  className="flex-1 bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                />
                <Button size="sm" type="submit" icon={<Plus className="w-3.5 h-3.5" />}>
                  Enroll Student
                </Button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {activeBatchStudents.students.length === 0 ? (
                  <div className="py-10 text-center text-xs text-foreground-muted">
                    No students enrolled in this batch yet.
                  </div>
                ) : (
                  activeBatchStudents.students.map((s) => (
                    <div
                      key={s.user_id}
                      className="p-3 rounded-xl bg-surface-elevated/40 border border-border/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-foreground">{s.full_name}</p>
                        <p className="text-[11px] text-foreground-muted font-mono">{s.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-primary font-bold">{s.xp} XP</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveBatchStudent(s.user_id)}
                          className="text-error hover:bg-error/10"
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

      {/* 9. Manual Mint Certificate Modal */}
      <AnimatePresence>
        {showIssueCertModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-base font-bold text-foreground">Manual Certificate Minting</h3>
                <button onClick={() => setShowIssueCertModal(false)} className="text-foreground-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleIssueCertificate} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Target Student User *</label>
                  <select
                    required
                    value={manualCertForm.user_id}
                    onChange={(e) => setManualCertForm({ ...manualCertForm, user_id: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  >
                    <option value="">Select Student</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Associate with Exam Track</label>
                  <select
                    value={manualCertForm.exam_id}
                    onChange={(e) =>
                      setManualCertForm({
                        ...manualCertForm,
                        exam_id: e.target.value,
                        certificate_type: e.target.value ? "exam_certified" : "course_completion",
                      })
                    }
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  >
                    <option value="">None (Course Track)</option>
                    {examsList.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Associate with Course</label>
                  <select
                    value={manualCertForm.course_id}
                    onChange={(e) => setManualCertForm({ ...manualCertForm, course_id: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  >
                    <option value="">None</option>
                    {coursesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Score Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualCertForm.score_pct}
                    onChange={(e) => setManualCertForm({ ...manualCertForm, score_pct: parseFloat(e.target.value) })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowIssueCertModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Mint Credential
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. Update Invoice Status Modal */}
      <AnimatePresence>
        {editingInvoice && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-base font-bold text-foreground">Update Invoice Status</h3>
                <button onClick={() => setEditingInvoice(null)} className="text-foreground-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateInvoiceStatus} className="space-y-4 text-xs">
                <p className="font-mono text-primary font-bold">{editingInvoice.invoice_number}</p>
                <p className="text-foreground-secondary">
                  Customer: {editingInvoice.user_name} (${editingInvoice.total_paid})
                </p>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Transaction Status</label>
                  <select
                    value={editingInvoice.status}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-bold"
                  >
                    <option value="paid">paid</option>
                    <option value="refunded">refunded</option>
                    <option value="void">void</option>
                    <option value="pending">pending</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingInvoice(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Update Status
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. Inspect Community Post Modal */}
      <AnimatePresence>
        {inspectingPost && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{inspectingPost.title}</h3>
                  <p className="text-xs text-foreground-muted">By {inspectingPost.author_name}</p>
                </div>
                <button onClick={() => setInspectingPost(null)} className="text-foreground-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 bg-surface-elevated/50 rounded-xl text-xs text-foreground leading-relaxed">
                {inspectingPost.content}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                <h4 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">
                  Comments & Answers ({inspectingPost.comments?.length || 0})
                </h4>
                {inspectingPost.comments?.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-surface-elevated/30 border border-border/40 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-foreground">{c.author}</p>
                      <p className="text-foreground-secondary mt-0.5">{c.content}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-error hover:bg-error/10 shrink-0"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 12. KYC Document Viewer Modal */}
      <AnimatePresence>
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl max-h-[85vh] bg-surface rounded-2xl p-4 border border-border shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-surface-elevated text-foreground hover:text-error transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-sm font-bold text-foreground mb-3">NID Document Inspection</h4>
              <img
                src={previewImage}
                alt="Document Full View"
                className="max-h-[70vh] w-auto rounded-xl object-contain mx-auto"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
