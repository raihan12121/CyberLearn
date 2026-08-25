"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Download,
  Share2,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle,
  X,
  Printer,
  ShieldCheck,
  Fingerprint,
  ArrowRight,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

export default function CertificatesPage() {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("all");
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareCert, setShareCert] = useState<any | null>(null);
  const [printCert, setPrintCert] = useState<any | null>(null);

  useEffect(() => {
    fetchUser().catch(() => {});
    setLoading(true);
    api.getCertificates()
      .then((data) => {
        if (Array.isArray(data)) {
          setCertificates(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch certificates:", err);
      })
      .finally(() => setLoading(false));
  }, [fetchUser]);

  const isVerified = user?.verification_status === "verified";

  const filtered = certificates.filter((cert) => {
    if (activeTab === "issued") return cert.status === "issued";
    if (activeTab === "pending") return cert.status === "verification_required";
    if (activeTab === "locked") return cert.status === "locked";
    return true;
  });

  const verifiedCount = certificates.filter((c) => c.status === "issued").length;
  const pendingCount = certificates.filter((c) => c.status === "verification_required").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Certificates &amp; Credentials</h1>
            <p className="text-foreground-secondary mt-1 text-xs md:text-sm">
              Official verifiable diplomas and industry proctored qualification credentials with tamper-proof cryptographic verification.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={() => router.push("/exams")} className="font-bold">
              <Award className="w-4 h-4 mr-1.5" />
              <span>Take Certification Exams →</span>
            </Button>
            <Badge variant="primary" size="md" className="bg-primary/5 border border-primary/20 text-primary py-2 px-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span>{verifiedCount} Verified Credential{verifiedCount !== 1 ? "s" : ""}</span>
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Mandatory ID Verification Alert Banner */}
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-warning/10 border border-warning/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/20 text-warning shrink-0">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Government ID Verification Mandatory</span>
                <Badge variant="warning" size="sm" className="text-[10px] uppercase font-mono">Required</Badge>
              </h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Per CyberLearn academic policy, all official certification diplomas require verified identity to prevent fraud. Verify your National ID to unlock your earned credentials.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/verify-nid")}
            className="font-bold shrink-0 shadow-md"
          >
            <span>Verify ID Now</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px">
        {[
          { id: "all", name: "All Credentials" },
          { id: "issued", name: `Issued (${verifiedCount})` },
          ...(pendingCount > 0 ? [{ id: "pending", name: `Pending ID Verification (${pendingCount})` }] : []),
          { id: "locked", name: "Locked" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-foreground-secondary hover:text-foreground"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cert, i) => {
          const isIssued = cert.status === "issued";
          const isPendingNid = cert.status === "verification_required";
          const isLocked = cert.status === "locked";

          return (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                padding="lg"
                glow={isIssued ? "primary" : undefined}
                className={`h-full flex flex-col justify-between relative overflow-hidden border ${
                  isIssued
                    ? "border-primary/30 bg-surface"
                    : isPendingNid
                    ? "border-warning/40 bg-warning/5"
                    : "opacity-60 bg-surface/50 border-border"
                }`}
              >
                {/* Visual Certificate Graphic Header */}
                <div
                  className={`h-24 rounded-lg flex items-center justify-center relative overflow-hidden mb-4 ${
                    isIssued
                      ? "bg-gradient-to-br from-primary/10 to-secondary/15 border border-primary/20"
                      : isPendingNid
                      ? "bg-warning/15 border border-warning/30"
                      : "bg-surface-elevated/40"
                  }`}
                >
                  <Award
                    className={`w-12 h-12 ${
                      isIssued ? "text-primary animate-pulse" : isPendingNid ? "text-warning" : "text-foreground-muted"
                    }`}
                  />
                  {isIssued && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-surface/80 px-2 py-0.5 rounded-md border border-accent/20">
                      <CheckCircle className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Verified</span>
                    </div>
                  )}
                  {isPendingNid && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-surface/80 px-2 py-0.5 rounded-md border border-warning/30">
                      <Fingerprint className="w-3.5 h-3.5 text-warning" />
                      <span className="text-[10px] text-warning font-bold uppercase tracking-wider">ID Required</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground mb-1 leading-snug">
                    {cert.courseTitle}
                  </h3>
                  <p className="text-[10px] text-foreground-muted font-mono mb-4">
                    {isIssued ? `TOKEN: ${cert.id}` : isPendingNid ? "CLAIM PENDING VERIFICATION" : "UNEARNED"}
                  </p>

                  <div className="space-y-2 text-xs font-semibold text-foreground-secondary mb-6 border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span>Category</span>
                      <span className="text-foreground">{cert.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className={isIssued ? "text-success font-bold" : isPendingNid ? "text-warning font-bold" : "text-foreground"}>
                        {cert.issueDate}
                      </span>
                    </div>
                    {isIssued && (
                      <div className="flex justify-between">
                        <span>XP Awarded</span>
                        <span className="text-primary font-bold">+{cert.xpEarned} XP</span>
                      </div>
                    )}
                    {isPendingNid && (
                      <p className="text-[11px] text-warning bg-warning/10 p-2 rounded-lg leading-relaxed mt-2 border border-warning/20">
                        {cert.message || "Complete National ID verification to mint this official certificate."}
                      </p>
                    )}
                  </div>
                </div>

                {isIssued ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:flex-1 text-xs justify-center"
                      onClick={() => setShareCert(cert)}
                      icon={<Share2 className="w-3.5 h-3.5" />}
                    >
                      Share
                    </Button>
                    <Button
                      size="sm"
                      className="w-full sm:flex-1 text-xs justify-center"
                      onClick={() => setPrintCert(cert)}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                  </div>
                ) : isPendingNid ? (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => router.push("/verify-nid")}
                    icon={<Fingerprint className="w-4 h-4" />}
                    className="font-bold"
                  >
                    Verify ID to Unlock →
                  </Button>
                ) : (
                  <Button variant="outline" disabled fullWidth icon={<ShieldAlert className="w-4 h-4" />}>
                    Locked
                  </Button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Share Modal Dialog */}
      <AnimatePresence>
        {shareCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Share Official Certificate</h3>
                <button
                  onClick={() => setShareCert(null)}
                  className="p-1 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed font-normal">
                Share your verified credential for <strong className="text-foreground">{shareCert.courseTitle}</strong> on LinkedIn, resume portfolios, or copy the public verification URL.
              </p>

              <div className="bg-surface-elevated border border-border p-3.5 rounded-2xl font-mono text-xs text-foreground break-all">
                {typeof window !== "undefined" ? `${window.location.origin}${shareCert.credentialUrl}` : shareCert.credentialUrl}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fullUrl = `${window.location.origin}${shareCert.credentialUrl}`;
                    navigator.clipboard.writeText(fullUrl);
                    alert("Credential verification link copied to clipboard!");
                  }}
                >
                  Copy Link
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const fullUrl = encodeURIComponent(`${window.location.origin}${shareCert.credentialUrl}`);
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${fullUrl}`, "_blank");
                  }}
                >
                  Post to LinkedIn
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable / Downloadable Certificate Modal */}
      <AnimatePresence>
        {printCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-surface border-2 border-primary/40 rounded-3xl shadow-2xl p-8 space-y-6 relative overflow-hidden"
            >
              {/* Header decorative seals */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2">
                  <Award className="w-10 h-10 animate-bounce" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight uppercase font-mono">
                  CyberLearn Security Academy
                </h2>
                <p className="text-xs uppercase tracking-widest text-primary font-bold">
                  Official Certificate of Qualification &amp; Mastery
                </p>
              </div>

              <div className="py-6 border-y border-border text-center space-y-3">
                <p className="text-xs text-foreground-secondary uppercase tracking-wider">This is proudly conferred upon</p>
                <h3 className="text-2xl font-black text-foreground underline decoration-primary decoration-2 underline-offset-4">
                  {user?.full_name || "Verified Student"}
                </h3>
                <p className="text-xs text-foreground-secondary max-w-md mx-auto leading-relaxed">
                  for successfully mastering all curriculum competencies and passing proctored evaluations in
                </p>
                <h4 className="text-lg font-bold text-primary">
                  {printCert.courseTitle}
                </h4>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-foreground-muted gap-4">
                <div>
                  <span className="block font-mono text-[10px]">Verification Token:</span>
                  <span className="font-mono text-xs font-bold text-foreground">{printCert.id}</span>
                </div>
                <div className="flex items-center gap-1 text-accent font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Government ID &amp; Cryptographically Verified</span>
                </div>
                <div className="text-right">
                  <span className="block font-mono text-[10px]">Issue Date:</span>
                  <span className="font-bold text-foreground">{printCert.issueDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setPrintCert(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                  icon={<Printer className="w-4 h-4" />}
                  className="font-bold"
                >
                  Print / Save PDF
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
