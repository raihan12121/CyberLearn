"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Certificates State
  const [certificatesList, setCertificatesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [examsList, setExamsList] = useState<any[]>([]);
  const [certSearch, setCertSearch] = useState("");

  // Mint modal
  const [showIssueCertModal, setShowIssueCertModal] = useState(false);
  const [manualCertForm, setManualCertForm] = useState({
    user_id: "",
    course_id: "",
    exam_id: "",
    score_pct: 100,
    certificate_type: "course_completion",
  });

  const loadCertificatesData = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [certs, users, courses, exams] = await Promise.all([
        api.getAdminCertificates().catch(() => []),
        api.getAdminUsers().catch(() => []),
        api.getAdminCourses().catch(() => []),
        api.getAdminExams().catch(() => []),
      ]);

      setCertificatesList(certs || []);
      setUsersList(users || []);
      setCoursesList(courses || []);
      setExamsList(exams || []);
    } catch (err: any) {
      console.error("Failed to load certificates:", err);
      if (err?.message?.includes("403")) {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCertificatesData();
  }, []);

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCertForm.user_id) {
      alert("Please select a student user.");
      return;
    }
    try {
      const minted = await api.issueAdminCertificate({
        user_id: manualCertForm.user_id,
        course_id: manualCertForm.course_id || undefined,
        exam_id: manualCertForm.exam_id || undefined,
        score_pct: Number(manualCertForm.score_pct),
        certificate_type: manualCertForm.certificate_type,
      });
      setCertificatesList((prev) => [minted, ...prev]);
      setShowIssueCertModal(false);
      setManualCertForm({
        user_id: "",
        course_id: "",
        exam_id: "",
        score_pct: 100,
        certificate_type: "course_completion",
      });
      alert(`Certificate minted successfully. Verification Code: ${minted.certificate_code}`);
    } catch (e: any) {
      alert(`Error minting certificate: ${e.message}`);
    }
  };

  const handleRevokeCertificate = async (certId: string, certCode: string) => {
    if (!confirm(`Are you sure you want to revoke certificate ${certCode}? This will invalidate public verification.`)) return;
    try {
      await api.revokeAdminCertificate(certId);
      setCertificatesList((prev) => prev.filter((c) => c.id !== certId));
      alert("Certificate revoked.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const filteredCerts = certificatesList.filter((c) => {
    if (!certSearch) return true;
    const term = certSearch.toLowerCase();
    return (
      c.certificate_code?.toLowerCase().includes(term) ||
      c.user_name?.toLowerCase().includes(term) ||
      c.user_email?.toLowerCase().includes(term) ||
      c.title?.toLowerCase().includes(term)
    );
  });

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
          Administrative privileges required to access Certificate Registry.
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
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Certificates & Credentials Registry</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {certificatesList.length} Issued Credentials
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographically verified cybersecurity credentials, exam achievements, and public recruiter lookup ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCertificatesData}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Credentials"}
          </Button>
          <Button size="sm" onClick={() => setShowIssueCertModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Manual Mint Credential
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center bg-[#0C1222] p-3 rounded-xl border border-[#1E293B]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={certSearch}
            onChange={(e) => setCertSearch(e.target.value)}
            placeholder="Search credentials by certificate code, student name, email, or track..."
            className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Certificates Table */}
      <Card padding="none" className="border border-[#1E293B] bg-[#0F172A] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[#1E293B] bg-[#0C1222] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Credential Code</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Certification Program</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Issued Date</th>
                <th className="py-3 px-4">Verification Link</th>
                <th className="py-3 px-4 text-right">Revoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No issued credentials matching your search.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{cert.certificate_code}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{cert.user_name || "Platform Learner"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{cert.user_email}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{cert.title}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{cert.score_pct || 100}%</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(cert.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`/verify/${cert.verification_token || cert.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:underline font-mono text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" /> Inspect Token
                      </a>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeCertificate(cert.id, cert.certificate_code)}
                        className="text-red-400 hover:bg-red-500/10"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Mint Modal */}
      <AnimatePresence>
        {showIssueCertModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0F172A] rounded-2xl p-6 border border-[#1E293B] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Manual Certificate Minting</h3>
                <button onClick={() => setShowIssueCertModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleIssueCertificate} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Target Student User *</label>
                  <select
                    required
                    value={manualCertForm.user_id}
                    onChange={(e) => setManualCertForm({ ...manualCertForm, user_id: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
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
                  <label className="font-semibold text-white">Associate with Exam Track</label>
                  <select
                    value={manualCertForm.exam_id}
                    onChange={(e) =>
                      setManualCertForm({
                        ...manualCertForm,
                        exam_id: e.target.value,
                        certificate_type: e.target.value ? "exam_certified" : "course_completion",
                      })
                    }
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
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
                  <label className="font-semibold text-white">Associate with Course</label>
                  <select
                    value={manualCertForm.course_id}
                    onChange={(e) => setManualCertForm({ ...manualCertForm, course_id: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none"
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
                  <label className="font-semibold text-white">Score Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualCertForm.score_pct}
                    onChange={(e) => setManualCertForm({ ...manualCertForm, score_pct: parseFloat(e.target.value) || 100 })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
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
    </div>
  );
}
