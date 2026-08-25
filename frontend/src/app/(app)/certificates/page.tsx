"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Download,
  Share2,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

const mockCertificates = [
  {
    id: "CERT-WEB-9831",
    courseTitle: "Web Security Fundamentals",
    category: "Web Security",
    issueDate: "June 12, 2026",
    credentialUrl: "https://cyberlearn.edu/verify/CERT-WEB-9831",
    xpEarned: 1200,
    status: "issued",
  },
  {
    id: "CERT-LINUX-2342",
    courseTitle: "Linux Command Line Basics",
    category: "Linux basics",
    issueDate: "June 05, 2026",
    credentialUrl: "https://cyberlearn.edu/verify/CERT-LINUX-2342",
    xpEarned: 1500,
    status: "issued",
  },
  {
    id: "CERT-NET-4521",
    courseTitle: "Network Security Essentials",
    category: "Networking",
    issueDate: "In Progress",
    credentialUrl: "",
    xpEarned: 0,
    status: "locked",
  },
];

export default function CertificatesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareCert, setShareCert] = useState<any | null>(null);
  const [printCert, setPrintCert] = useState<any | null>(null);

  useEffect(() => {
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
  }, []);

  const filtered = certificates.filter((cert) => {
    if (activeTab === "issued") return cert.status === "issued";
    if (activeTab === "locked") return cert.status === "locked";
    return true;
  });

  const verifiedCount = certificates.filter((c) => c.status === "issued").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
            <p className="text-foreground-secondary mt-1">
              Verify, share, or download official certificates of completion and qualification credentials.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={() => window.location.href = "/exams"} className="font-bold">
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px">
        {[
          { id: "all", name: "All Credentials" },
          { id: "issued", name: "Issued" },
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
                glow={isLocked ? undefined : "primary"}
                className={`h-full flex flex-col justify-between relative overflow-hidden border ${
                  isLocked ? "opacity-60 bg-surface/50 border-border" : "border-primary/20"
                }`}
              >
                {/* Visual Certificate Graphic Header */}
                <div className={`h-24 rounded-lg flex items-center justify-center relative overflow-hidden mb-4 ${
                  isLocked ? "bg-surface-elevated/40" : "bg-gradient-to-br from-primary/10 to-secondary/15 border border-primary/10"
                }`}>
                  {/* Subtle vector details */}
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-primary/5 blur-xl pointer-events-none" />
                  <Award className={`w-12 h-12 ${isLocked ? "text-foreground-muted" : "text-warning animate-pulse"}`} />
                  {!isLocked && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Verified</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground mb-1 leading-snug">
                    {cert.courseTitle}
                  </h3>
                  <p className="text-[10px] text-foreground-muted font-mono mb-4">
                    {isLocked ? "UNEARNED" : `ID: ${cert.id}`}
                  </p>

                  <div className="space-y-2 text-xs font-semibold text-foreground-secondary mb-6 border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span>Category</span>
                      <span className="text-foreground">{cert.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issued</span>
                      <span className="text-foreground">{cert.issueDate}</span>
                    </div>
                    {!isLocked && (
                      <div className="flex justify-between">
                        <span>XP Awarded</span>
                        <span className="text-primary">+{cert.xpEarned} XP</span>
                      </div>
                    )}
                  </div>
                </div>

                {isLocked ? (
                  <Button variant="outline" disabled fullWidth icon={<ShieldAlert className="w-4 h-4" />}>
                    Locked
                  </Button>
                ) : (
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
              className="w-full max-w-md bg-surface border border-border rounded-[var(--radius-xl)] shadow-lg p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Share Certificate</h3>
                <button
                  onClick={() => setShareCert(null)}
                  className="p-1 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed font-normal">
                Share your verified completion of <span className="font-bold text-foreground">{shareCert.courseTitle}</span> on social media platforms or copy the credential verification URL.
              </p>

              <div className="bg-surface-elevated border border-border p-3.5 rounded-[var(--radius-lg)] font-mono text-xs text-foreground break-all">
                {shareCert.credentialUrl}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(shareCert.credentialUrl);
                    alert("Verification link copied to clipboard!");
                  }}
                >
                  Copy Link
                </Button>
                <Button onClick={() => alert("Simulated LinkedIn share completed!")}>
                  Add to LinkedIn
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {printCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-surface border-2 border-primary/40 rounded-[var(--radius-xl)] shadow-2xl p-8 space-y-6 relative overflow-hidden"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-warning" />
                  <h3 className="text-base font-bold text-foreground">Official Certificate Preview</h3>
                </div>
                <button
                  onClick={() => setPrintCert(null)}
                  className="p-1 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Canvas */}
              <div className="bg-gradient-to-br from-surface-elevated via-surface to-surface-elevated border border-primary/20 p-8 rounded-xl text-center space-y-4 relative">
                <div className="text-xs font-bold text-primary tracking-widest uppercase font-mono">CYBERLEARN ACADEMY</div>
                <p className="text-xs text-foreground-muted uppercase tracking-wider">CERTIFICATE OF COMPLETION</p>
                <h2 className="text-2xl font-extrabold text-foreground underline decoration-primary/40 underline-offset-4">{printCert.courseTitle}</h2>
                <p className="text-xs text-foreground-secondary max-w-md mx-auto">
                  Demonstrated technical competence across hands-on sandbox labs, vulnerability assessments, and course assessments.
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono text-foreground-muted border-t border-border/50 pt-4">
                  <span>TOKEN: {printCert.id}</span>
                  <span>ISSUED: {printCert.issueDate}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setPrintCert(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    window.print();
                  }}
                  icon={<Download className="w-4 h-4" />}
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

// Inline replacement for X icon since it wasn't explicitly imported
function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
