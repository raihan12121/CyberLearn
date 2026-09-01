import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD1tY3a1x-9D-e5wWIIBMHnValX-z4X2Ss",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cyberlearn-39cfe.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cyberlearn-39cfe",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cyberlearn-39cfe.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1009378289038",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1009378289038:web:7cd4706d45e1db4d8bb0df",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-E0RPF29F8D"
};

// Initialize Firebase App & Services
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const firestore = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

export async function signInWithGoogleFirebase(): Promise<{ email: string; fullName: string; token: string; avatarUrl?: string }> {
  const result: UserCredential = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const token = await user.getIdToken();
  if (!user.email) {
    throw new Error("No verified email address returned from Google account.");
  }
  return {
    email: user.email,
    fullName: user.displayName || user.email.split("@")[0],
    avatarUrl: user.photoURL || undefined,
    token
  };
}

export async function signUpWithEmailFirebase(email: string, password: string): Promise<UserCredential> {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmailFirebase(email: string, password: string): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("Firebase signout error:", err);
  }
}

// =========================================================================
// CLOUD FIRESTORE PERMANENT ACCOUNT & PROGRESS STORAGE
// =========================================================================

/**
 * Permanently saves or updates user account & subscription data in Firebase Cloud Firestore.
 */
export async function saveUserToFirestore(userData: {
  id?: string;
  email: string;
  full_name?: string;
  username?: string;
  role?: string;
  xp?: number;
  streak_days?: number;
  avatar_url?: string;
  bio?: string;
  primary_focus?: string;
  experience_level?: string;
  is_onboarded?: boolean;
  is_verified?: boolean;
  verification_status?: string;
  subscription_tier?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  is_subscribed?: boolean;
}): Promise<void> {
  if (!userData || !userData.email) return;

  try {
    const userEmailKey = userData.email.toLowerCase().trim();
    const userDocRef = doc(firestore, "users", userEmailKey);

    const payload: Record<string, any> = {
      email: userEmailKey,
      updated_at: serverTimestamp(),
    };

    if (userData.id) payload.id = userData.id;
    if (userData.full_name !== undefined) payload.full_name = userData.full_name;
    if (userData.username !== undefined) payload.username = userData.username;
    if (userData.role !== undefined) payload.role = userData.role;
    if (userData.xp !== undefined) payload.xp = userData.xp;
    if (userData.streak_days !== undefined) payload.streak_days = userData.streak_days;
    if (userData.avatar_url !== undefined) payload.avatar_url = userData.avatar_url;
    if (userData.bio !== undefined) payload.bio = userData.bio;
    if (userData.primary_focus !== undefined) payload.primary_focus = userData.primary_focus;
    if (userData.experience_level !== undefined) payload.experience_level = userData.experience_level;
    if (userData.is_onboarded !== undefined) payload.is_onboarded = userData.is_onboarded;
    if (userData.is_verified !== undefined) payload.is_verified = userData.is_verified;
    if (userData.verification_status !== undefined) payload.verification_status = userData.verification_status;
    if (userData.subscription_tier !== undefined) payload.subscription_tier = userData.subscription_tier;
    if (userData.subscription_status !== undefined) payload.subscription_status = userData.subscription_status;
    if (userData.subscription_expires_at !== undefined) payload.subscription_expires_at = userData.subscription_expires_at;
    if (userData.is_subscribed !== undefined) payload.is_subscribed = userData.is_subscribed;

    await setDoc(userDocRef, payload, { merge: true });
  } catch (err) {
    console.warn("Firestore user sync warning:", err);
  }
}

/**
 * Retrieves the permanently stored user account data from Firebase Cloud Firestore.
 */
export async function getUserFromFirestore(email: string): Promise<Record<string, any> | null> {
  if (!email) return null;

  try {
    const userEmailKey = email.toLowerCase().trim();
    const userDocRef = doc(firestore, "users", userEmailKey);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn("Firestore getUser error:", err);
    return null;
  }
}

/**
 * Permanently saves active subscription details to Firebase Cloud Firestore.
 */
export async function saveSubscriptionToFirestore(
  email: string,
  planTier: string,
  status: string,
  expiresAt?: string,
  role?: string
): Promise<void> {
  if (!email) return;

  try {
    const userEmailKey = email.toLowerCase().trim();
    const userDocRef = doc(firestore, "users", userEmailKey);

    await setDoc(
      userDocRef,
      {
        email: userEmailKey,
        subscription_tier: planTier.toLowerCase(),
        subscription_status: status,
        subscription_expires_at: expiresAt || null,
        is_subscribed: status === "active",
        role: role || (planTier.toLowerCase() === "free" ? "student" : `${planTier.toLowerCase()}_member`),
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore subscription save error:", err);
  }
}

/**
 * Permanently saves completed lab submissions and captured flags in Firebase Cloud Firestore.
 */
export async function saveLabSolveToFirestore(
  email: string,
  labId: string,
  flag: string,
  xpEarned: number = 100
): Promise<void> {
  if (!email || !labId) return;

  try {
    const userEmailKey = email.toLowerCase().trim();
    const labDocRef = doc(firestore, "users", userEmailKey, "labs", labId);

    await setDoc(
      labDocRef,
      {
        lab_id: labId,
        flag_submitted: flag,
        status: "completed",
        xp_earned: xpEarned,
        solved_at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore lab save error:", err);
  }
}

/**
 * Permanently saves course and lesson progress in Firebase Cloud Firestore.
 */
export async function saveCourseProgressToFirestore(
  email: string,
  courseId: string,
  lessonId: string,
  status: string = "completed"
): Promise<void> {
  if (!email || !courseId || !lessonId) return;

  try {
    const userEmailKey = email.toLowerCase().trim();
    const progressDocRef = doc(firestore, "users", userEmailKey, "courses", `${courseId}_${lessonId}`);

    await setDoc(
      progressDocRef,
      {
        course_id: courseId,
        lesson_id: lessonId,
        status,
        completed_at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore course progress save error:", err);
  }
}
