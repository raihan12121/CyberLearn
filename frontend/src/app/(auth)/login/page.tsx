"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { api, setAuthToken } from "@/lib/api";
import { signInWithGoogleFirebase, signInWithEmailFirebase } from "@/lib/firebase";
import { useAuthStore } from "@/lib/authStore";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-fill saved email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("remember_email");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setLoading(true);

    try {
      if (rememberMe) {
        try { localStorage.setItem("remember_email", email); } catch {}
      } else {
        try { localStorage.removeItem("remember_email"); } catch {}
      }

      // Authenticate with Firebase Auth
      await signInWithEmailFirebase(email, password).catch(() => {
        // Continue to backend auth
      });

      // Authenticate with CyberLearn API
      const data = await api.login({ email, password });
      setAuthToken(data.access_token);
      const user = await api.getMe().catch(() => null);
      if (user) {
        useAuthStore.getState().setUser(user);
      }
      if (redirectTarget) {
        router.push(redirectTarget);
      } else if (user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Incorrect email address or password. Please check your credentials.");
    }
  };

  const handleSocialLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // 1. Attempt Firebase Google Sign-In Popup
      const result = await signInWithGoogleFirebase();
      if (result && result.email) {
        const data = await api.socialLogin("google", result.email, result.fullName, result.token);
        setAuthToken(data.access_token);
        const user = await api.getMe().catch(() => null);
        if (user) {
          useAuthStore.getState().setUser(user);
        }
        if (redirectTarget) {
          router.push(redirectTarget);
        } else if (user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        return;
      }
    } catch (firebaseErr: any) {
      console.warn("Firebase popup sign-in encountered an issue, transitioning to direct Google OAuth flow:", firebaseErr);
    }

    try {
      // 2. Seamless Direct Google OAuth Fallback
      const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const data = await api.getOAuthUrl("google", redirectUri);
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        setError("Google authentication service is temporarily unavailable. Please use email and password.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Direct Google login fallback failure:", err);
      setError(err.message || "Failed to initialize Google login. Please try again with email.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border p-8 shadow-card"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-foreground-secondary mt-1">
              Sign in to continue your learning path
            </p>
          </div>

          {/* Social Logins */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleSocialLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-surface-elevated hover:bg-surface-elevated/80 text-foreground font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-foreground-muted">
                or sign in with email
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
              {error}
            </div>
          )}

          {/* Form */}
          <form id="cyberlearn-login-form" method="post" action="#" onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
            <Input
              id="email"
              name="email"
              label="Email Address"
              type="email"
              autoComplete="username email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-foreground-muted" />}
              required
            />

            <div className="space-y-1.5">
              <Input
                id="password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-foreground-muted" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 mt-1 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Hide password
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Show password
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-elevated border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="text-sm text-foreground-secondary">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-hover transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button fullWidth size="lg" type="submit" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-foreground-secondary mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-sm text-foreground-muted">Loading sign in...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
