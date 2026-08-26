"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff, User, ArrowRight, RefreshCw, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { signInWithGoogleFirebase, signUpWithEmailFirebase } from "@/lib/firebase";
import { useAuthStore } from "@/lib/authStore";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP 6-Digit State
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Focus first OTP input on step change
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setLoading(true);

    try {
      // 1. Create account in Firebase Authentication (optional sync)
      await signUpWithEmailFirebase(email, password).catch(() => {
        // Fallback directly to CyberLearn backend
      });

      // 2. Register account in CyberLearn database (Generates 6-digit OTP & sends email via Brevo)
      const res = await api.register({ email, password, full_name: name });

      if (res?.dev_code) {
        setDevCode(res.dev_code);
      }

      setLoading(false);
      setStep("otp");
      setResendCooldown(60);
      setCanResend(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to create account. Please try again.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric characters
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    const newDigits = [...otpDigits];
    // Handle typing single character
    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance to next input box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If 6th digit entered, auto submit
    const completeCode = newDigits.join("");
    if (completeCode.length === 6 && !newDigits.includes("")) {
      submitOtpCode(completeCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);

    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
      submitOtpCode(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const submitOtpCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError("");
    setVerifyingOtp(true);

    try {
      const data = await api.verifyCode({ email, code });
      setAuthToken(data.access_token);

      const user = await api.getMe().catch(() => null);
      if (user) {
        useAuthStore.getState().setUser(user);
      }

      router.push("/dashboard");
    } catch (err: any) {
      setVerifyingOtp(false);
      setError(err.message || "Invalid or expired verification code. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setError("");
    setResending(true);

    try {
      const res = await api.resendCode(email);
      if (res?.dev_code) {
        setDevCode(res.dev_code);
      }
      setResendCooldown(60);
      setCanResend(false);
      setResending(false);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setResending(false);
      setError(err.message || "Failed to resend verification code. Please try again.");
    }
  };

  const handleSocialLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithGoogleFirebase();
      if (result && result.email) {
        const data = await api.socialLogin("google", result.email, result.fullName, result.token);
        setAuthToken(data.access_token);
        const user = await api.getMe().catch(() => null);
        if (user) {
          useAuthStore.getState().setUser(user);
        }
        router.push("/dashboard");
        return;
      }
    } catch (firebaseErr: any) {
      console.warn("Firebase popup sign-in encountered an issue, transitioning to direct Google OAuth flow:", firebaseErr);
    }

    try {
      const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const res = await api.getOAuthUrl("google", redirectUri);
      if (res && res.url) {
        window.location.href = res.url;
        return;
      }
      throw new Error("Unable to initialize Google OAuth session.");
    } catch (oauthErr: any) {
      setLoading(false);
      setError(oauthErr.message || "Google authentication failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Branding Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface items-center justify-center border-r border-border">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative text-center z-10 max-w-sm px-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-6 text-primary shadow-lg shadow-primary/5">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">CyberLearn Platform</h2>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            Enterprise cyber defense training with interactive container sandboxes, real-time telemetry, and certified credentials.
          </p>
        </div>
      </div>

      {/* Right - Form Container */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-card"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 text-primary">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Create Operative Account</h1>
                  <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
                    Start your hands-on cybersecurity journey today
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-medium">
                    {error}
                  </div>
                )}

                {/* Social Login */}
                <div className="space-y-3 mb-5">
                  <button
                    type="button"
                    onClick={handleSocialLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-foreground hover:bg-surface-elevated/80 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface px-2 text-foreground-muted">or register with email</span>
                  </div>
                </div>

                {/* Form */}
                <form id="cyberlearn-signup-form" method="post" action="#" className="space-y-4" onSubmit={handleSignupSubmit}>
                  <Input
                    id="name"
                    name="name"
                    label="Full Name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={<User className="w-4 h-4 text-foreground-muted" />}
                  />
                  <Input
                    id="email"
                    name="email"
                    label="Email Address"
                    type="email"
                    autoComplete="username email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4 text-foreground-muted" />}
                  />
                  <div className="space-y-1">
                    <Input
                      id="password"
                      name="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Lock className="w-4 h-4 text-foreground-muted" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-foreground-muted hover:text-foreground cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                  </div>

                  <Button fullWidth size="lg" type="submit" loading={loading} className="mt-2">
                    Create Account &amp; Verify
                  </Button>
                </form>

                <p className="text-center text-xs text-foreground-secondary mt-5">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:text-primary-light font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp-verification-screen"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-card space-y-6"
              >
                {/* Header */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mx-auto mb-3 text-blue-400">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Verify Your Email</h2>
                  <p className="text-xs text-foreground-secondary mt-1">
                    We sent a 6-digit verification code to:
                  </p>
                  <p className="text-xs font-mono font-semibold text-primary mt-0.5">{email}</p>
                </div>

                {/* Dev Mode Code Quick-Fill Helper (If local dev) */}
                {devCode && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center space-y-1.5">
                    <p className="text-[11px] text-blue-300">
                      ⚡ <strong>Dev Simulation Mode</strong> (No Brevo API key set):
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devCode.split("");
                        setOtpDigits(digits);
                        submitOtpCode(devCode);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-mono font-bold hover:bg-blue-500 transition-colors cursor-pointer"
                    >
                      Fill Code: {devCode}
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-medium text-center">
                    {error}
                  </div>
                )}

                {/* 6-Box OTP Input */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold rounded-xl border bg-surface-elevated text-foreground focus:outline-none transition-all ${
                        error
                          ? "border-error focus:ring-2 focus:ring-error/20"
                          : digit
                          ? "border-primary text-primary focus:ring-2 focus:ring-primary/25"
                          : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      }`}
                    />
                  ))}
                </div>

                {/* Verification CTA */}
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => submitOtpCode()}
                  loading={verifyingOtp}
                  disabled={otpDigits.join("").length !== 6}
                >
                  Verify &amp; Enter Academy
                </Button>

                {/* Resend Actions */}
                <div className="flex flex-col items-center gap-2 pt-2 border-t border-border/40 text-xs text-foreground-secondary">
                  <div className="flex items-center gap-1.5">
                    <span>Didn&apos;t receive the code?</span>
                    {canResend ? (
                      <button
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                        <span>Resend Code</span>
                      </button>
                    ) : (
                      <span className="font-mono text-foreground-muted font-medium">
                        Resend in {resendCooldown}s
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setStep("form");
                      setError("");
                    }}
                    className="text-foreground-muted hover:text-foreground flex items-center gap-1 mt-1 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change email address</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

