"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, AlertTriangle } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { api, setAuthToken } from "@/lib/api";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const provider = searchParams.get("provider") || "google";

    if (!code) {
      setError("No authorization code received from OAuth provider.");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    api.exchangeOAuthCode(provider, code, redirectUri)
      .then((data) => {
        setAuthToken(data.access_token);
        router.push("/dashboard");
      })
      .catch((err) => {
        setError(err.message || "Social login authentication failed.");
      });
  }, [searchParams, router]);

  return (
    <div className="w-full max-w-md text-center">
      <div className="flex items-center gap-2 mb-8 justify-center">
        <Shield className="w-8 h-8 text-primary animate-pulse" />
        <span className="text-2xl font-extrabold text-foreground tracking-tight">CyberLearn</span>
      </div>

      <Card padding="lg" className="p-8 border border-border bg-surface shadow-2xl">
        {error ? (
          <div className="space-y-6 py-4">
            <div className="w-14 h-14 rounded-full bg-error/20 text-error border border-error/40 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Authentication Failed</h2>
              <p className="text-xs text-error">{error}</p>
            </div>
            <Button fullWidth onClick={() => router.push("/login")}>
              Return to Sign In
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Completing Social Authentication...</h2>
              <p className="text-xs text-foreground-muted">Securing your session with CyberLearn OAuth provider...</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      }>
        <OAuthCallbackContent />
      </Suspense>
    </div>
  );
}
