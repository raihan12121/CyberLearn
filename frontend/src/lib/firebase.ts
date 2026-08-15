import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoPlaceholderKey123456789",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cyberlearn-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cyberlearn-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cyberlearn-app.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:demo1234567890"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

const githubProvider = new GithubAuthProvider();
githubProvider.addScope("user:email");

export async function signInWithGoogleFirebase(): Promise<{ email: string; fullName: string; token: string; avatarUrl?: string }> {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const token = await user.getIdToken();
    return {
      email: user.email || `google_${user.uid.slice(0, 8)}@cyberlearn.io`,
      fullName: user.displayName || "Google User",
      avatarUrl: user.photoURL || undefined,
      token
    };
  } catch (error: any) {
    // If popups are blocked or config missing, fallback gracefully
    if (error.code === "auth/configuration-not-found" || error.code === "auth/invalid-api-key") {
      throw new Error("FIREBASE_CONFIG_MISSING");
    }
    throw error;
  }
}

export async function signInWithGithubFirebase(): Promise<{ email: string; fullName: string; token: string; avatarUrl?: string }> {
  try {
    const result: UserCredential = await signInWithPopup(auth, githubProvider);
    const user = result.user;
    const token = await user.getIdToken();
    return {
      email: user.email || `github_${user.uid.slice(0, 8)}@cyberlearn.io`,
      fullName: user.displayName || "GitHub User",
      avatarUrl: user.photoURL || undefined,
      token
    };
  } catch (error: any) {
    if (error.code === "auth/configuration-not-found" || error.code === "auth/invalid-api-key") {
      throw new Error("FIREBASE_CONFIG_MISSING");
    }
    throw error;
  }
}
