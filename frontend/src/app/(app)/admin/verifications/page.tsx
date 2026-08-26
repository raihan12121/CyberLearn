"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  Shield,
  RefreshCw,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // KYC Verifications State
  const [verifications, setVerifications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadVerifications = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const list = await api.getAdminVerifications(statusFilter !== "all" ? statusFilter : undefined);
      setVerifications(list || []);
    } catch (err: any) {
      console.error("Failed to load KYC verifications:", err);
      if (err?.message?.includes("403")) {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, [statusFilter]);

  const handleReviewKYC = async (userId: string, newStatus: "verified" | "rejected") => {
    try {
      setReviewingId(userId);
      const updated = await api.reviewNidVerification(userId, { status: newStatus });
      setVerifications((prev) => prev.map((v) => (v.user_id === userId ? { ...v, verification_status: newStatus } : v)));
      alert(`User KYC status set to ${newStatus}.`);
    } catch (e: any) {
      alert(`Review error: ${e.message}`);
    } finally {
      setReviewingId(null);
    }
  };

  const pendingCount = verifications.filter((v) => v.verification_status === "pending").length;

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
          Administrative privileges required to access KYC Identity Queue.
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
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">KYC Identity Verification Queue</h1>
              {pendingCount > 0 ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                  {pendingCount} Pending Reviews
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Queue Clean
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review government National ID / Smart Card uploads to issue Verified Candidate badges for enterprise placement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadVerifications}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync KYC Queue"}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-[#0C1222] p-3 rounded-xl border border-[#1E293B]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter by Status:
          </span>
          <div className="flex items-center gap-1 bg-[#0F172A] p-1 rounded-lg border border-[#1E293B]">
            {["all", "pending", "verified", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verifications Table */}
      <Card padding="none" className="border border-[#1E293B] bg-[#0F172A] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[#1E293B] bg-[#0C1222] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Learner Candidate</th>
                <th className="py-3 px-4">NID / Smart Card #</th>
                <th className="py-3 px-4">Document Photos</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No verification submissions found for status &quot;{statusFilter}&quot;.
                  </td>
                </tr>
              ) : (
                verifications.map((v) => (
                  <tr key={v.id || v.user_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={v.full_name || v.user_name || v.user_email} size="sm" />
                        <div>
                          <p className="font-bold text-white">{v.full_name || v.user_name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{v.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {v.nid_number || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {v.nid_front_image && (
                          <button
                            onClick={() => setPreviewImage(v.nid_front_image)}
                            className="px-2 py-1 rounded bg-[#0C1222] border border-[#1E293B] text-[11px] text-blue-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" /> Front Photo
                          </button>
                        )}
                        {v.nid_back_image && (
                          <button
                            onClick={() => setPreviewImage(v.nid_back_image)}
                            className="px-2 py-1 rounded bg-[#0C1222] border border-[#1E293B] text-[11px] text-blue-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" /> Back Photo
                          </button>
                        )}
                        {!v.nid_front_image && !v.nid_back_image && (
                          <span className="text-slate-500 italic text-[11px]">No images uploaded</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          v.verification_status === "verified"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : v.verification_status === "rejected"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {v.verification_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {v.verification_status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReviewKYC(v.user_id, "verified")}
                            disabled={reviewingId === v.user_id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            icon={<Check className="w-3.5 h-3.5" />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReviewKYC(v.user_id, "rejected")}
                            disabled={reviewingId === v.user_id}
                            className="text-red-400 hover:bg-red-500/10 font-bold"
                            icon={<X className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Document Image Zoom Modal */}
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
              className="max-w-2xl max-h-[85vh] bg-[#0F172A] rounded-2xl p-4 border border-[#1E293B] shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-[#0C1222] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-sm font-bold text-white mb-3">NID Document Full Zoom Inspection</h4>
              <img
                src={previewImage}
                alt="Document Full View"
                className="max-h-[70vh] w-auto rounded-xl object-contain mx-auto border border-[#1E293B]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
