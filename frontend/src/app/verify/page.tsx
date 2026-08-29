"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Shield,
  ArrowLeft,
  Share2,
  Download,
  Search,
  KeyRound,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

interface CertVerification {
  valid: boolean;
  token: string;
  student_name: string;
  course_title: string;
  category: string;
  issued_at: string;
  issuer: string;
  verification_url: string;
  score_pct?: number;
  certificate_type?: string;
}

function CertificateVerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryToken = searchParams.get("token") || searchParams.get("id") || "";
  const [searchToken, setSearchToken] = useState(queryToken);
  const [activeToken, setActiveToken] = useState(queryToken);

  const [data, setData] = useState<CertVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!queryToken);

  const verifyToken = async (tok: string) => {
    if (!tok.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await api.verifyCertificate(tok.trim());
      setData(res);
    } catch (err: any) {
      setError(err.message || "Certificate verification token not found or invalid.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryToken) {
      setSearchToken(queryToken);
      setActiveToken(queryToken);
      verifyToken(queryToken);
    }
  }, [queryToken]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchToken.trim()) return;
    setActiveToken(searchToken.trim());
    verifyToken(searchToken.trim());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to CyberLearn
          </Button>
          {data && (
            <Badge
              variant={data.valid ? "success" : "danger"}
              size="md"
              className="flex items-center gap-1.5 py-1.5 px-3"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{data.valid ? "VERIFIED AUTHENTIC" : "INVALID CREDENTIAL"}</span>
            </Badge>
          )}
        </div>

        {/* Verification Lookup Input Card */}
        <Card padding="md" className="border border-border/80 bg-surface/90 shadow-lg space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Official Credential Verification</h3>
              <p className="text-xs text-foreground-muted">
                Inspect and cryptographically validate certificates issued by CyberLearn Academy.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              placeholder="Enter Certificate ID or Verification Token (e.g. afda7f6e-...)"
              className="flex-1 px-3.5 py-2 rounded-xl bg-surface-elevated border border-border text-foreground text-xs font-mono focus:outline-none focus:border-primary"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || !searchToken.trim()}
              icon={<Search className="w-3.5 h-3.5" />}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </form>
        </Card>

        {loading && (
          <div className="py-12 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <Card padding="lg" className="text-center space-y-4 border-rose-500/30 bg-rose-500/5">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Certificate Verification Failed</h2>
            <p className="text-sm text-rose-300 font-mono">{error}</p>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              We could not find an authentic certificate matching the token &quot;{activeToken}&quot;. Please ensure the ID was copied correctly without extra spaces.
            </p>
          </Card>
        )}

        {!loading && data && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <Card
              padding="lg"
              glow="primary"
              className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-surface via-surface-elevated/40 to-surface p-8 md:p-12 space-y-8"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border pb-6 text-center md:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground tracking-wide">CYBERLEARN ACADEMY</h2>
                    <p className="text-xs text-foreground-muted">Verified Hands-on Certificate of Completion</p>
                  </div>
                </div>
                <div className="text-xs font-mono text-primary font-bold bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                  TOKEN: {data.token}
                </div>
              </div>

              {/* Certificate Recipient Statement */}
              <div className="text-center space-y-3 py-4">
                <p className="text-xs uppercase tracking-widest text-foreground-muted font-mono">THIS CERTIFIES THAT</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight underline decoration-primary/40 underline-offset-8">
                  {data.student_name}
                </h1>
                <p className="text-sm text-foreground-secondary max-w-lg mx-auto leading-relaxed pt-2">
                  has successfully completed all required interactive practice labs, vulnerability assessments, and technical examinations for
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-primary pt-1">
                  {data.course_title}
                </h3>
              </div>

              {/* Certificate Metadata & Stamps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-6 text-center md:text-left">
                <div>
                  <span className="text-[10px] text-foreground-muted uppercase tracking-wider block">Category Track</span>
                  <span className="text-xs font-bold text-foreground font-mono">{data.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-foreground-muted uppercase tracking-wider block">Date Issued</span>
                  <span className="text-xs font-bold text-foreground font-mono">{data.issued_at}</span>
                </div>
                <div>
                  <span className="text-[10px] text-foreground-muted uppercase tracking-wider block">Issuing Body</span>
                  <span className="text-xs font-bold text-foreground font-mono">{data.issuer}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cryptographically Authenticated &amp; Verified</span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fullUrl = `${window.location.origin}/verify/${data.token}`;
                      navigator.clipboard.writeText(fullUrl);
                      alert("Verification URL copied to clipboard!");
                    }}
                    icon={<Share2 className="w-3.5 h-3.5" />}
                  >
                    Share Credential
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Print Certificate
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function CertificateVerificationPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CertificateVerificationContent />
    </Suspense>
  );
}
