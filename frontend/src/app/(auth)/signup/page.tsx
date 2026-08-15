"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button, Input } from "@/components/ui";

import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { signInWithGoogleFirebase, signUpWithEmailFirebase } from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setLoading(true);

    try {
      // 1. Create account in Firebase Authentication
      await signUpWithEmailFirebase(email, password).catch((firebaseErr) => {
        if (firebaseErr?.code === "auth/email-already-in-use") {
          throw new Error("A user account with this email address already exists.");
        } else if (firebaseErr?.code === "auth/weak-password") {
          throw new Error("Password is too weak. Please use at least 6 characters.");
        }
      });

      // 2. Register account in CyberLearn database
      await api.register({ email, password, full_name: name });

      // 3. Log in user and receive JWT access token
      const data = await api.login({ email, password });
      setAuthToken(data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to create account. Please try again.");
    }
  };

  const handleSocialLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithGoogleFirebase();
      if (!result || !result.email) {
        throw new Error("No verified email returned from Google account.");
      }

      const data = await api.socialLogin("google", result.email, result.fullName, result.token);
      setAuthToken(data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setLoading(false);
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Google sign-in popup was closed before completing.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError("Domain not authorized in Firebase Console. Please add cyber-learn-three.vercel.app to Authorized Domains in Firebase.");
      } else {
        setError(err?.message || "Google authentication failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-secondary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative text-center z-10">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">CyberLearn</h2>
          <p className="text-foreground-secondary max-w-xs">
            Join thousands of learners mastering cybersecurity through practice.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Shield className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-foreground">CyberLearn</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Create your account</h1>
          <p className="text-foreground-secondary mb-8">
            Start your cybersecurity journey today.
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded bg-error/15 text-error text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-surface-elevated border border-border rounded-[var(--radius-lg)] px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-bright transition-all duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-background text-foreground-muted">or</span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-0.5 rounded bg-surface-elevated border-border text-primary focus:ring-primary accent-primary"
              />
              <span className="text-sm text-foreground-secondary">
                I agree to the{" "}
                <Link href="#" className="text-primary hover:text-primary-hover">Terms of Service</Link>{" "}
                and{" "}
                <Link href="#" className="text-primary hover:text-primary-hover">Privacy Policy</Link>
              </span>
            </label>

            <Button fullWidth size="lg" type="submit" loading={loading}>
              Sign up
            </Button>
          </form>

          <p className="text-center text-sm text-foreground-secondary mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
