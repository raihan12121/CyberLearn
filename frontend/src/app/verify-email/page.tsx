"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, CheckCircle2, XCircle, ArrowRight, Mail, RefreshCw } from "lucide-react";
import { Card, Button, Input } from "@/components/ui";
import { api } from "@/lib/api";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : "No verification token provided. Please check your activation email link."
  );
  const [emailToResend, setEmailToResend] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    api.verifyEmail(token)
      .then(() => {
        setSuccess(true);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired email verification link.");
        setLoading(false);
      });
  }, [token]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToResend) return;
    setResending(true);
    setResendStatus(null);

    api.resendVerification(emailToResend)
      .then((res) => {
        setResending(false);
        setResendStatus(res.detail || "Verification email resent!");
      })
      .catch((err) => {
        setResending(false);
        setResendStatus(`Error: ${err.message}`);
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="flex items-center gap-2 mb-8 justify-center">
        <Shield className="w-8 h-8 text-primary" />
        <span className="text-2xl font-extrabold text-foreground tracking-tight">CyberLearn</span>
      </div>

      <Card padding="lg" glow="primary" className="text-center p-8 space-y-6 border border-border bg-surface">
        {loading ? (
          <div className="py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Verifying Email Address...</h2>
            <p className="text-xs text-foreground-muted">Communicating with CyberLearn Security Academy...</p>
          </div>
        ) : success ? (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-success/20 text-success border border-success/40 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-foreground">Account Verified!</h1>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                Your email address has been successfully confirmed. You now have full access to interactive practice labs and AI Cyber Coach tutoring.
              </p>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={() => router.push("/login")}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Start Learning
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <div className="w-16 h-16 rounded-full bg-error/20 text-error border border-error/40 flex items-center justify-center mx-auto shadow-lg">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Verification Failed</h2>
              <p className="text-xs text-error font-medium">{error}</p>
            </div>

            <div className="border-t border-border pt-6 space-y-4 text-left">
              <p className="text-xs font-semibold text-foreground-secondary">
                Need a new verification link? Enter your account email below:
              </p>
              <form onSubmit={handleResend} className="space-y-3">
                <Input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={emailToResend}
                  onChange={(e) => setEmailToResend(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />
                <Button
                  fullWidth
                  size="sm"
                  type="submit"
                  loading={resending}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Resend Verification Email
                </Button>
              </form>
              {resendStatus && (
                <p className="text-xs font-mono text-center text-primary mt-2">{resendStatus}</p>
              )}
            </div>

            <div className="pt-2">
              <Link href="/login" className="text-xs text-foreground-muted hover:text-foreground">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
