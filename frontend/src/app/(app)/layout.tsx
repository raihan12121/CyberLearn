"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, TopNav } from "@/components/layout";
import { OnboardingModal } from "@/components/OnboardingModal";
import { getAuthToken, removeAuthToken } from "@/lib/api";
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

      try {
        const currentUser = await fetchUser(true);
        if (!currentUser) {
          removeAuthToken();
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
          router.replace(redirectUrl);
          return;
        }
        setIsAuthenticated(true);
      } catch {
        removeAuthToken();
        setIsAuthenticated(false);
        const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
        router.replace(redirectUrl);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [pathname, router, fetchUser]);

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
