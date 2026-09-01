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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD1tY3a1x-9D-e5wWIIBMHnValX-z4X2Ss",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cyberlearn-39cfe.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cyberlearn-39cfe",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cyberlearn-39cfe.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1009378289038",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1009378289038:web:7cd4706d45e1db4d8bb0df",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-E0RPF29F8D"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({
  prompt: "select_account"
});

/**
 * Sign in with Google using Firebase Popup with automatic timeout fallback.
 * Prevents hanging popups or ERR_CONNECTION_TIMED_OUT from stalling user sign-in.
 */
export async function signInWithGoogleFirebase(
  timeoutMs: number = 6000
): Promise<{ email: string; fullName: string; token: string; avatarUrl?: string }> {
  const popupTask = (async () => {
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
  })();

  const timeoutTask = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Firebase authentication domain timed out or was blocked. Switching to Direct OAuth."));
    }, timeoutMs);
  });

  return await Promise.race([popupTask, timeoutTask]);
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
