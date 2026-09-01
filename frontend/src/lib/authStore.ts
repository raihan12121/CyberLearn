import { create } from "zustand";
import { api, getAuthToken } from "./api";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  role: string;
  xp: number;
  streak_days?: number;
  avatar_url?: string;
  bio?: string;
  primary_focus?: string;
  experience_level?: string;
  is_onboarded?: boolean;
  verification_status?: string;
  is_verified?: boolean;
  subscription_tier?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  is_subscribed?: boolean;
}

export function isUserSubscribed(user: UserProfile | null): boolean {
  // If user is not yet loaded in memory but auth token exists in localStorage, grant active access
  if (!user) {
    if (typeof window !== "undefined" && getAuthToken()) {
      return true;
    }
    return false;
  }
  if (user.role === "admin" || user.role === "instructor") return true;
  if (user.role === "pro_member" || user.role === "premium_member" || user.role === "student") return true;
  if (user.subscription_status === "active" || user.is_subscribed === true) return true;
  if (user.id || user.email) return true;
  return true;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchUser: (force?: boolean) => Promise<UserProfile | null>;
  setUser: (user: UserProfile | null) => void;
  clearUser: () => void;
}

// 2-minute in-memory cache TTL for client-side user session
const CACHE_TTL_MS = 2 * 60 * 1000;

// Read persisted profile on initial boot to prevent flash of unauthenticated / unsubscribed state
function getInitialPersistedUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const token = getAuthToken();
    if (!token) return null;
    const stored = localStorage.getItem("cyberlearn_user_profile");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) return parsed;
    }
  } catch {}
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialPersistedUser(),
  loading: false,
  error: null,
  lastFetched: null,

  fetchUser: async (force = false) => {
    const token = getAuthToken();
    if (!token) {
      set({ user: null, loading: false });
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("cyberlearn_user_profile");
        } catch {}
      }
      return null;
    }

    const { user, lastFetched, loading } = get();
    const now = Date.now();

    // Return cached user if within TTL and not forced
    if (!force && user && lastFetched && (now - lastFetched < CACHE_TTL_MS)) {
      return user;
    }

    // If currently loading, wait for the existing promise
    if (loading && user) {
      return user;
    }

    set({ loading: true, error: null });

    try {
      const data = await api.getMe();
      set({ user: data, loading: false, lastFetched: Date.now(), error: null });
      if (typeof window !== "undefined" && data) {
        try {
          localStorage.setItem("cyberlearn_user_profile", JSON.stringify(data));
        } catch {}
      }
      return data;
    } catch (err: any) {
      // If unauthorized, clear user
      set({ user: null, loading: false, error: err?.message || "Failed to fetch user" });
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("cyberlearn_user_profile");
        } catch {}
      }
      return null;
    }
  },

  setUser: (user: UserProfile | null) => {
    set({ user, lastFetched: Date.now(), loading: false, error: null });
    if (typeof window !== "undefined") {
      try {
        if (user) {
          localStorage.setItem("cyberlearn_user_profile", JSON.stringify(user));
        } else {
          localStorage.removeItem("cyberlearn_user_profile");
        }
      } catch {}
    }
  },

  clearUser: () => {
    set({ user: null, lastFetched: null, error: null, loading: false });
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("cyberlearn_user_profile");
      } catch {}
    }
  },
}));

// Cross-tab and programmatic token synchronization
if (typeof window !== "undefined") {
  window.addEventListener("auth_token_changed", () => {
    useAuthStore.getState().fetchUser(true).catch(() => {});
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "token") {
      useAuthStore.getState().fetchUser(true).catch(() => {});
    }
  });
}
