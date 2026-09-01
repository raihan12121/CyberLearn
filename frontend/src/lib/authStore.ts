import { create } from "zustand";
import { api, getAuthToken } from "./api";
import { saveUserToFirestore, getUserFromFirestore } from "./firebase";

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
  if (!user) return false;
  if (user.role === "admin" || user.role === "instructor") return true;
  if (user.role === "pro_member" || user.role === "premium_member") return true;
  if (user.subscription_status === "active" || user.is_subscribed === true) {
    if (user.subscription_expires_at) {
      const exp = new Date(user.subscription_expires_at).getTime();
      if (!isNaN(exp) && exp < Date.now()) {
        return false;
      }
    }
    return true;
  }
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
      let mergedData: UserProfile = { ...data };

      // Permanently sync & restore from Cloud Firestore
      try {
        if (data && data.email) {
          const firestoreUser = await getUserFromFirestore(data.email);
          if (firestoreUser) {
            // Restore persistent subscription if active in Firestore
            if (firestoreUser.subscription_status === "active") {
              mergedData.subscription_status = "active";
              mergedData.subscription_tier = firestoreUser.subscription_tier || "pro";
              mergedData.subscription_expires_at = firestoreUser.subscription_expires_at;
              mergedData.is_subscribed = true;
              if (firestoreUser.role && firestoreUser.role !== "student") {
                mergedData.role = firestoreUser.role;
              }
            }
          }
          // Backup latest profile to Cloud Firestore permanently
          await saveUserToFirestore(mergedData);
        }
      } catch (fsErr) {
        console.warn("Firestore sync notification:", fsErr);
      }

      set({ user: mergedData, loading: false, lastFetched: Date.now(), error: null });
      if (typeof window !== "undefined" && mergedData) {
        try {
          localStorage.setItem("cyberlearn_user_profile", JSON.stringify(mergedData));
        } catch {}
      }
      return mergedData;
    } catch (err: any) {
      // If backend network fails, attempt fallback restore from Cloud Firestore & localStorage
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("cyberlearn_user_profile") : null;
        if (stored) {
          const localUser = JSON.parse(stored);
          if (localUser && localUser.email) {
            const firestoreUser = await getUserFromFirestore(localUser.email);
            if (firestoreUser) {
              const restored: UserProfile = {
                ...localUser,
                ...firestoreUser,
                is_subscribed: firestoreUser.subscription_status === "active",
              };
              set({ user: restored, loading: false, lastFetched: Date.now(), error: null });
              return restored;
            }
            set({ user: localUser, loading: false, lastFetched: Date.now(), error: null });
            return localUser;
          }
        }
      } catch {}

      // If truly unauthorized, clear user
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
          saveUserToFirestore(user).catch(() => {});
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
