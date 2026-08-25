"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, TopNav } from "@/components/layout";
import { OnboardingModal } from "@/components/OnboardingModal";
import { api, getAuthToken, removeAuthToken } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { Shield } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchUser } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
        router.replace(redirectUrl);
        return;
      }

      // If user profile is already in memory, set authenticated immediately for seamless navigation
      if (user) {
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
      }

      try {
        const currentUser = await fetchUser(false);
        if (currentUser) {
          setIsAuthenticated(true);
        } else if (!user) {
          // Double check with direct getMe call
          const freshUser = await api.getMe().catch(() => null);
          if (freshUser) {
            useAuthStore.getState().setUser(freshUser);
            setIsAuthenticated(true);
          } else {
            removeAuthToken();
            setIsAuthenticated(false);
            const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
            router.replace(redirectUrl);
          }
        }
      } catch (err: any) {
        // Only wipe token if server definitively rejected with 401 Unauthorized
        const msg = String(err?.message || "").toLowerCase();
        if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("invalid token")) {
          removeAuthToken();
          setIsAuthenticated(false);
          const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
          router.replace(redirectUrl);
        } else {
          // Transient network issue: preserve session and allow page rendering
          setIsAuthenticated(true);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [pathname, router, fetchUser, user]);

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Shield className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Verifying CyberLearn Credentials...</p>
            <p className="text-xs text-foreground-muted">Ensuring authenticated encrypted session</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          collapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"
        }`}
      >
        <TopNav onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
      <OnboardingModal />
    </div>
  );
}
