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
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment,
  onSnapshot,
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

// =========================================================================
// CLOUD FIRESTORE COMMUNITY FORUM PERMANENT STORAGE
// =========================================================================

export interface CommunityPostData {
  id?: string;
  user_id?: string;
  title: string;
  content: string;
  category: string;
  tags?: string;
  is_solved?: boolean;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  author_email?: string;
  upvotes?: number;
  upvoted_by?: string[];
  comment_count?: number;
  created_at?: string;
}

export interface CommunityCommentData {
  id?: string;
  post_id: string;
  user_id?: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  author_email?: string;
  author_role?: string;
  content: string;
  is_solution?: boolean;
  created_at?: string;
}

/**
 * Permanently saves or updates a community question/post in Cloud Firestore.
 */
export async function saveCommunityPostToFirestore(post: CommunityPostData): Promise<string> {
  const postId = post.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  try {
    const postDocRef = doc(firestore, "community_posts", postId);

    const payload = {
      id: postId,
      user_id: post.user_id || "",
      title: post.title.trim(),
      content: post.content.trim(),
      category: post.category || "Questions",
      tags: post.tags || "",
      is_solved: post.is_solved ?? false,
      author_name: post.author_name || "Learner",
      author_username: post.author_username || "learner",
      author_avatar: post.author_avatar || "",
      author_email: post.author_email || "",
      upvotes: post.upvotes ?? 1,
      upvoted_by: post.author_email ? [post.author_email.toLowerCase()] : [],
      comment_count: post.comment_count ?? 0,
      created_at: post.created_at || new Date().toISOString(),
      updated_at: serverTimestamp()
    };

    await setDoc(postDocRef, payload, { merge: true });
  } catch (err) {
    console.warn("Firestore saveCommunityPost warning:", err);
  }
  return postId;
}

/**
 * Retrieves all community posts permanently stored in Cloud Firestore.
 */
export async function getCommunityPostsFromFirestore(): Promise<any[]> {
  try {
    const q = query(
      collection(firestore, "community_posts"),
      orderBy("created_at", "desc"),
      limit(100)
    );
    const snap = await getDocs(q);
    const results: any[] = [];
    snap.forEach((d) => {
      results.push(d.data());
    });
    return results;
  } catch (err) {
    console.warn("Firestore getCommunityPosts warning:", err);
    return [];
  }
}

/**
 * Permanently saves a comment/answer for a question in Cloud Firestore.
 */
export async function addCommunityCommentToFirestore(
  postId: string,
  comment: CommunityCommentData
): Promise<any> {
  const commentId = comment.id || `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const commentData = {
    id: commentId,
    post_id: postId,
    user_id: comment.user_id || "",
    author_name: comment.author_name || "Learner",
    author_username: comment.author_username || "learner",
    author_avatar: comment.author_avatar || "",
    author_email: comment.author_email || "",
    author_role: comment.author_role || "student",
    content: comment.content.trim(),
    is_solution: comment.is_solution ?? false,
    created_at: comment.created_at || new Date().toISOString(),
  };

  try {
    const commentDocRef = doc(firestore, "community_posts", postId, "comments", commentId);
    await setDoc(commentDocRef, commentData);

    // Increment comment_count on the parent post document
    const postDocRef = doc(firestore, "community_posts", postId);
    await updateDoc(postDocRef, {
      comment_count: increment(1),
      updated_at: serverTimestamp()
    });
  } catch (err) {
    console.warn("Firestore addCommunityComment warning:", err);
  }

  return commentData;
}

/**
 * Retrieves all replies/answers for a community post from Cloud Firestore.
 */
export async function getCommunityCommentsFromFirestore(postId: string): Promise<any[]> {
  try {
    const q = query(
      collection(firestore, "community_posts", postId, "comments"),
      orderBy("created_at", "asc")
    );
    const snap = await getDocs(q);
    const results: any[] = [];
    snap.forEach((d) => {
      results.push(d.data());
    });
    return results;
  } catch (err) {
    console.warn("Firestore getCommunityComments warning:", err);
    return [];
  }
}

/**
 * Toggles an upvote on a community post in Cloud Firestore.
 */
export async function upvoteCommunityPostInFirestore(
  postId: string,
  userEmail: string
): Promise<{ upvotes: number; has_upvoted: boolean }> {
  const postDocRef = doc(firestore, "community_posts", postId);
  const snap = await getDoc(postDocRef);
  if (!snap.exists()) {
    return { upvotes: 1, has_upvoted: true };
  }

  const data = snap.data();
  const upvotedBy: string[] = data.upvoted_by || [];
  const normalizedEmail = (userEmail || "").toLowerCase().trim();
  const hasUpvoted = normalizedEmail ? upvotedBy.includes(normalizedEmail) : false;

  if (hasUpvoted && normalizedEmail) {
    const newUpvotes = Math.max(0, (data.upvotes || 1) - 1);
    await updateDoc(postDocRef, {
      upvotes: newUpvotes,
      upvoted_by: arrayRemove(normalizedEmail)
    });
    return { upvotes: newUpvotes, has_upvoted: false };
  } else {
    const newUpvotes = (data.upvotes || 0) + 1;
    const updates: Record<string, any> = { upvotes: newUpvotes };
    if (normalizedEmail) {
      updates.upvoted_by = arrayUnion(normalizedEmail);
    }
    await updateDoc(postDocRef, updates);
    return { upvotes: newUpvotes, has_upvoted: true };
  }
}

/**
 * Marks a community post as solved/unsolved in Cloud Firestore.
 */
export async function togglePostSolvedInFirestore(postId: string, isSolved: boolean): Promise<void> {
  try {
    const postDocRef = doc(firestore, "community_posts", postId);
    await updateDoc(postDocRef, {
      is_solved: isSolved,
      updated_at: serverTimestamp()
    });
  } catch (err) {
    console.warn("Firestore togglePostSolved warning:", err);
  }
}

/**
 * Deletes a community post from Cloud Firestore.
 */
export async function deleteCommunityPostFromFirestore(postId: string): Promise<void> {
  try {
    const postDocRef = doc(firestore, "community_posts", postId);
    await deleteDoc(postDocRef);
  } catch (err) {
    console.warn("Firestore deleteCommunityPost warning:", err);
  }
}
