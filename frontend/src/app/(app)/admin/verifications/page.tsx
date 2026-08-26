"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  RefreshCw,
  X,
  User,
  CreditCard,
  ZoomIn,
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Verifications state
  const [verificationsList, setVerificationsList] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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

      const list = await api.getAdminVerifications(filterStatus !== "all" ? filterStatus : undefined);
      setVerificationsList(list || []);
    } catch (err: any) {
      console.error("Failed to load verifications:", err);
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
  }, [filterStatus]);

  const handleReviewAction = async (userId: string, action: "approve" | "reject") => {
    try {
      await api.reviewNidVerification(userId, {
        status: action === "approve" ? "verified" : "rejected",
        notes: reviewNotes || undefined,
      });
      setVerificationsList((prev) => prev.filter((v) => v.id !== userId && v.user_id !== userId));
      setSelectedVerification(null);
      setReviewNotes("");
      alert(`Identity verification ${action === "approve" ? "APPROVED" : "REJECTED"} successfully.`);
    } catch (e: any) {
      alert(`Error reviewing verification: ${e.message}`);
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
          Administrative privileges required to access Identity Verifications.
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-sm shadow-amber-500/10">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Identity KYC Verifications</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {verificationsList.length} in Queue
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Review government National ID (NID) cards, examine front/back document photos, and approve KYC credentials.
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
            {refreshing ? "Syncing..." : "Sync Queue"}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border">
        <div className="flex items-center gap-1.5 bg-surface-elevated p-1 rounded-lg border border-border">
          {["pending", "verified", "rejected", "all"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                filterStatus === st
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
                  : "text-foreground-secondary hover:text-foreground hover:bg-surface-bright"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <span className="text-xs text-foreground-muted">
          Showing {verificationsList.length} records
        </span>
      </div>

      {/* Verification Queue Table */}
      <Card padding="none" className="border border-border bg-surface shadow-lg overflow-hidden space-y-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border bg-surface-elevated text-foreground-muted font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">National ID Number</th>
                <th className="py-3 px-4">Date of Birth</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {verificationsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-foreground-muted">
                    No ID verification requests found in the {filterStatus} queue.
                  </td>
                </tr>
              ) : (
                verificationsList.map((v) => (
                  <tr key={v.id || v.user_id} className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={v.full_name || v.username || v.email} size="sm" />
                        <div>
                          <p className="font-bold text-foreground">{v.full_name || v.username}</p>
                          <p className="text-[10px] text-foreground-muted font-mono">{v.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {v.nid_number || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground-secondary">
                      {v.date_of_birth || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {v.verification_status === "verified" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : v.verification_status === "rejected" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground-muted text-[11px]">
                      {v.submitted_at || v.created_at ? new Date(v.submitted_at || v.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedVerification(v)}
                      >
                        Inspect NID
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect Verification Modal */}
      <AnimatePresence>
        {selectedVerification && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-amber-400" /> Review Identity: {selectedVerification.full_name}
                </h3>
                <button onClick={() => setSelectedVerification(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-elevated border border-border text-xs">
                  <div>
                    <span className="text-foreground-muted">Applicant Name:</span>
                    <p className="font-bold text-foreground">{selectedVerification.full_name}</p>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Email:</span>
                    <p className="font-mono text-sky-400">{selectedVerification.email}</p>
                  </div>
                  <div>
                    <span className="text-foreground-muted">National ID Number:</span>
                    <p className="font-mono font-bold text-amber-400">{selectedVerification.nid_number || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Date of Birth:</span>
                    <p className="font-mono text-foreground">{selectedVerification.date_of_birth || "N/A"}</p>
                  </div>
                </div>

                {/* ID Photos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-sky-400" /> NID Front Photo
                    </span>
                    <div
                      onClick={() =>
                        (selectedVerification.nid_front_image || selectedVerification.nid_front_url) &&
                        setZoomedImage(selectedVerification.nid_front_image || selectedVerification.nid_front_url)
                      }
                      className="h-44 rounded-xl bg-surface-elevated border border-border flex items-center justify-center overflow-hidden cursor-pointer group relative"
                    >
                      {selectedVerification.nid_front_image || selectedVerification.nid_front_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={selectedVerification.nid_front_image || selectedVerification.nid_front_url}
                          alt="NID Front"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="text-center p-4 text-xs text-foreground-muted">
                          <User className="w-8 h-8 mx-auto mb-1 text-foreground-muted opacity-40" />
                          No front photo attached
                        </div>
                      )}
                      {(selectedVerification.nid_front_image || selectedVerification.nid_front_url) && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity">
                          <ZoomIn className="w-4 h-4" /> Click to Zoom
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-sky-400" /> NID Back Photo
                    </span>
                    <div
                      onClick={() =>
                        (selectedVerification.nid_back_image || selectedVerification.nid_back_url) &&
                        setZoomedImage(selectedVerification.nid_back_image || selectedVerification.nid_back_url)
                      }
                      className="h-44 rounded-xl bg-surface-elevated border border-border flex items-center justify-center overflow-hidden cursor-pointer group relative"
                    >
                      {selectedVerification.nid_back_image || selectedVerification.nid_back_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={selectedVerification.nid_back_image || selectedVerification.nid_back_url}
                          alt="NID Back"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="text-center p-4 text-xs text-foreground-muted">
                          <CreditCard className="w-8 h-8 mx-auto mb-1 text-foreground-muted opacity-40" />
                          No back photo attached
                        </div>
                      )}
                      {(selectedVerification.nid_back_image || selectedVerification.nid_back_url) && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity">
                          <ZoomIn className="w-4 h-4" /> Click to Zoom
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Notes */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-foreground">Reviewer Decision Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Official government ID verified with matching name and valid holograms."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVerification(null)}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReviewAction(selectedVerification.id || selectedVerification.user_id, "reject")}
                    icon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject ID
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleReviewAction(selectedVerification.id || selectedVerification.user_id, "approve")}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve Verification
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Zoom Lightbox */}
      <AnimatePresence>
        {zoomedImage && (
          <div
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 cursor-pointer"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zoomedImage} alt="Zoomed NID" className="w-full h-full object-contain" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
