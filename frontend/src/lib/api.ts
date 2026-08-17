// Retrieve auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

// Save auth token to localStorage
export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
}

// Clear auth token
export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
}

function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  let url = envUrl && envUrl.trim() ? envUrl.trim() : "http://localhost:8000";
  while (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}

// Base Fetch Wrapper
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "API request failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Authentication
  register: (data: Record<string, unknown>) => apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  verifyEmail: (token: string) => apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  resendVerification: (email: string) => apiFetch("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  }),
  
  login: (data: Record<string, unknown>) => apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  
  logout: () => {
    removeAuthToken();
    return Promise.resolve({ detail: "Logged out locally" });
  },
  
  socialLogin: (provider: string, email: string, fullName?: string, token?: string) => {
    if (!email) {
      throw new Error("Authentication failed: No valid email address returned from identity provider.");
    }
    return apiFetch("/auth/social-login", {
      method: "POST",
      body: JSON.stringify({
        provider,
        email,
        full_name: fullName || email.split("@")[0],
        provider_token: token || "firebase_auth_token"
      }),
    });
  },

  getOAuthUrl: (provider: string, redirectUri?: string) => {
    const query = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : "";
    return apiFetch(`/auth/oauth/url/${provider}${query}`);
  },

  exchangeOAuthCode: (provider: string, code: string, redirectUri?: string) => apiFetch("/auth/oauth/exchange", {
    method: "POST",
    body: JSON.stringify({ provider, code, redirect_uri: redirectUri }),
  }),
  
  getMe: () => apiFetch("/auth/me"),

  // Courses
  getCourses: () => apiFetch("/courses"),
  getCourse: (id: string) => apiFetch(`/courses/${id}`),
  getProgress: () => apiFetch("/courses/progress"),
  updateProgress: (courseId: string, lessonId: string, status: string, completionPct: number) => apiFetch("/courses/progress", {
    method: "POST",
    body: JSON.stringify({ course_id: courseId, lesson_id: lessonId, status, completion_pct: completionPct }),
  }),
  submitQuiz: (lessonId: string, answers: { question_id: string; selected_option: number }[]) => apiFetch(`/courses/lessons/${lessonId}/quiz/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  }),

  // Labs
  getLabs: () => apiFetch("/labs"),
  startLab: (labId: string) => apiFetch("/labs/start", {
    method: "POST",
    body: JSON.stringify({ lab_id: labId }),
  }),
  resetLab: (sessionId: string) => apiFetch(`/labs/${sessionId}/reset`, {
    method: "POST",
  }),
  submitFlag: (sessionId: string, flag: string) => {
    const urlParams = new URLSearchParams({ flag_submission: flag });
    return apiFetch(`/labs/${sessionId}/submit?${urlParams.toString()}`, {
      method: "POST",
    });
  },

  // AI Cyber Coach
  chatWithCoach: (message: string, history: { sender: string; text: string }[]) => 
    apiFetch("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),

  // Community Feed
  getPosts: () => apiFetch("/posts"),
  createPost: (data: Record<string, unknown>) => apiFetch("/posts", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  upvotePost: (postId: string) => apiFetch(`/posts/${postId}/upvote`, {
    method: "POST",
  }),

  // Admin
  getAdminMetrics: () => apiFetch("/admin/metrics"),
  getAdminUsers: () => apiFetch("/admin/users"),

  // Leaderboard
  getLeaderboard: () => apiFetch("/leaderboard"),

  // Certificates
  getCertificates: () => apiFetch("/certificates"),

  // Admin: retrieve the generated flag for a specific lab (for container provisioning/testing)
  getLabFlag: (labId: string) => apiFetch(`/labs/${labId}/flag`),

  // Profile Updates & Details
  updateProfile: (data: Record<string, unknown>) => apiFetch("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  updatePassword: (data: Record<string, unknown>) => apiFetch("/users/me/password", {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAccount: () => apiFetch("/users/me", {
    method: "DELETE",
  }),
  getProfileDetails: () => apiFetch("/users/me/profile"),

  // Public Recruiter Portfolio & Certificate Verification
  getPublicProfile: (username: string) => apiFetch(`/users/${username}/public-profile`),
  verifyCertificate: (token: string) => apiFetch(`/certificates/verify/${token}`),

  // Live Proxy Inspection Forwarder
  forwardProxyRequest: (data: { method: string; url: string; headers?: Record<string, string>; body?: string }) => apiFetch("/labs/proxy/forward", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  // Socratic Hint Unlock & Persistent XP Deduction
  unlockHint: (labId: string, level: number, cost: number) => apiFetch(`/labs/${labId}/hints/unlock`, {
    method: "POST",
    body: JSON.stringify({ level, cost }),
  }),

  // Billing & Subscriptions
  createCheckoutSession: (planName: string, billingPeriod: string = "monthly") => apiFetch("/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan_name: planName, billing_period: billingPeriod }),
  }),

  // Human & NID Verification
  submitNidVerification: (data: { nid_number: string; nid_front_image?: string; nid_back_image?: string }) => apiFetch("/users/me/verify-nid", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getMyNidVerification: () => apiFetch("/users/me/verify-nid"),
  getAdminVerifications: (statusFilter?: string) => apiFetch(`/admin/verifications${statusFilter ? `?status_filter=${statusFilter}` : ""}`),
  reviewNidVerification: (userId: string, data: { status: string; notes?: string }) => apiFetch(`/admin/verifications/${userId}/review`, {
    method: "POST",
    body: JSON.stringify(data),
  }),

  // Batches & Cohorts
  getBatches: () => apiFetch("/batches"),
  createBatch: (data: Record<string, unknown>) => apiFetch("/batches", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getMyBatches: () => apiFetch("/batches/my"),
  getBatchDetails: (codeOrId: string) => apiFetch(`/batches/${codeOrId}`),
  joinBatch: (codeOrId: string) => apiFetch(`/batches/${codeOrId}/join`, {
    method: "POST",
  }),

  // Multi-Session AI Coach
  getAiSessions: () => apiFetch("/ai/sessions"),
  createAiSession: (data: { title?: string; system_prompt?: string; model_type?: string }) => apiFetch("/ai/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getAiSessionDetails: (sessionId: string) => apiFetch(`/ai/sessions/${sessionId}`),
  updateAiSession: (sessionId: string, data: { title?: string; system_prompt?: string; model_type?: string }) => apiFetch(`/ai/sessions/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAiSession: (sessionId: string) => apiFetch(`/ai/sessions/${sessionId}`, {
    method: "DELETE",
  }),
  chatInAiSession: (sessionId: string, message: string, overridePrompt?: string) => apiFetch(`/ai/sessions/${sessionId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, override_system_prompt: overridePrompt }),
  }),

  // Course Exams & Certification
  getExams: () => apiFetch("/exams"),
  getCourseExam: (courseId: string) => apiFetch(`/exams/course/${courseId}`),
  getExamDetails: (examId: string) => apiFetch(`/exams/${examId}`),
  submitExam: (examId: string, answers: { question_id: string; selected_answer: string }[]) => apiFetch(`/exams/${examId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  }),
  getMyExamSubmissions: () => apiFetch("/exams/submissions/my"),
};

