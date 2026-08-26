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
  KeyRound,
  Mail,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Certificates state
  const [certsList, setCertsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintForm, setMintForm] = useState({
    user_email: "",
    course_id: "",
    custom_title: "Certified Defensive Security Specialist",
  });

  const loadCertificates = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [certs, courses, users] = await Promise.all([
        api.getAdminCertificates().catch(() => []),
        api.getAdminCourses().catch(() => []),
        api.getAdminUsers().catch(() => []),
      ]);

      setCertsList(certs || []);
      setCoursesList(courses || []);
      setUsersList(users || []);
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

  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    loadCertificates();
  }, []);

  const handleMintCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintForm.user_email.trim()) return;
    try {
      const matchedUser = usersList.find(
        (u) =>
          u.email?.toLowerCase() === mintForm.user_email.trim().toLowerCase() ||
          u.id === mintForm.user_email.trim()
      );
      const userId = matchedUser ? matchedUser.id : mintForm.user_email.trim();

      const minted = await api.issueAdminCertificate({
        user_id: userId,
        course_id: mintForm.course_id || undefined,
        certificate_type: "course_completion",
      });
      loadCertificates();
      setShowMintModal(false);
      setMintForm({
        user_email: "",
        course_id: "",
        custom_title: "Certified Defensive Security Specialist",
      });
      alert(`Certificate minted successfully!`);
    } catch (e: any) {
      alert(`Error minting credential: ${e.message}`);
    }
  };

  const handleRevokeCertificate = async (certId: string, recipientName: string) => {
    if (!confirm(`Are you sure you want to permanently revoke certificate issued to "${recipientName}"?`)) return;
    try {
      await api.revokeAdminCertificate(certId);
      setCertsList((prev) => prev.filter((c) => c.id !== certId));
      alert("Certificate revoked.");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-sm shadow-rose-500/10">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Certificates & Credentials Registry</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                {certsList.length} Issued
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Mint cryptographic proof-of-knowledge certificates, verify digital signature hashes, and manage revoked credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCertificates}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Registry"}
          </Button>
          <Button size="sm" onClick={() => setShowMintModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Mint Certificate
          </Button>
        </div>
      </div>

      {/* Certificates Registry Table */}
      <Card padding="none" className="border border-border bg-surface shadow-lg overflow-hidden space-y-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border bg-surface-elevated text-foreground-muted font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Certification Title</th>
                <th className="py-3 px-4">Credential ID & Hash</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {certsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-foreground-muted">
                    No certificates issued in registry yet. Click &quot;Mint Certificate&quot; to issue a new credential.
                  </td>
                </tr>
              ) : (
                certsList.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-foreground">{c.user_name || c.recipient_name || "Learner"}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{c.user_email || c.recipient_email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{c.course_title || c.title || "Cyber Security Specialist"}</p>
                      <span className="text-[10px] font-mono text-foreground-muted">{c.course_id || "standalone"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-sky-400 font-bold flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-sky-400" />
                        {c.credential_id || c.certificate_number || c.id}
                      </p>
                      {c.verification_hash && (
                        <p className="font-mono text-[9px] text-foreground-muted truncate max-w-[160px]">
                          {c.verification_hash}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Valid & Verified
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground-muted text-[11px]">
                      {new Date(c.issue_date || c.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/verify?id=${c.credential_id || c.id}`, "_blank")}
                          className="hover:text-sky-400"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRevokeCertificate(c.id, c.user_name || c.user_email || "User")}
                          className="hover:bg-rose-500/10 text-rose-400"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mint Certificate Modal */}
      <AnimatePresence>
        {showMintModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Mint Verifiable Credential</h3>
                <button onClick={() => setShowMintModal(false)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleMintCertificate} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Student Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                    <input
                      required
                      type="email"
                      value={mintForm.user_email}
                      onChange={(e) => setMintForm({ ...mintForm, user_email: e.target.value })}
                      className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-rose-400"
                      placeholder="student@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Associated Course Track</label>
                  <select
                    value={mintForm.course_id}
                    onChange={(e) => setMintForm({ ...mintForm, course_id: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-medium"
                  >
                    <option value="">Custom Title / Direct Mint</option>
                    {coursesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Certificate Title</label>
                  <input
                    type="text"
                    value={mintForm.custom_title}
                    onChange={(e) => setMintForm({ ...mintForm, custom_title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    placeholder="e.g. Certified Defensive Security Specialist"
                  />
                </div>

                <div className="p-3 rounded-xl bg-surface-elevated border border-border text-[11px] text-foreground-muted space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-rose-400" /> Cryptographic Minting
                  </p>
                  <p>
                    Minting will generate a unique hash, record it in the public verification ledger, and issue the certificate directly to the student&apos;s credential dashboard.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowMintModal(false)}>
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
