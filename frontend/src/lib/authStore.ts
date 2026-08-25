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
  verification_status?: string;
  is_verified?: boolean;
  subscription_tier?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  is_subscribed?: boolean;
}

export function isUserSubscribed(user: UserProfile | null): boolean {
  if (!user) return false;
  if (user.role === "admin" || user.role === "instructor") return true;
  if (user.role === "pro_member" || user.role === "premium_member") return true;
  if (user.subscription_status === "active" || user.is_subscribed === true) return true;
  return false;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchUser: async (force = false) => {
    const token = getAuthToken();
    if (!token) {
      set({ user: null, loading: false });
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
      return data;
    } catch (err: any) {
      // If unauthorized, clear user
      set({ user: null, loading: false, error: err?.message || "Failed to fetch user" });
      return null;
    }
  },

  setUser: (user: UserProfile | null) => {
    set({ user, lastFetched: Date.now() });
  },

  clearUser: () => {
    set({ user: null, lastFetched: null, error: null });
  },
}));
