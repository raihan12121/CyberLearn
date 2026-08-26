// Retrieve auth token from localStorage, sessionStorage, or persistent cookie
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    // 1. Check localStorage
    try {
      const local = localStorage.getItem("token");
      if (local && local !== "null" && local !== "undefined" && local.trim().length > 10) {
        return local.trim();
      }
    } catch {}

    // 2. Check sessionStorage
    try {
      const session = sessionStorage.getItem("token");
      if (session && session !== "null" && session !== "undefined" && session.trim().length > 10) {
        const cleanSession = session.trim();
        try { localStorage.setItem("token", cleanSession); } catch {}
        return cleanSession;
      }
    } catch {}

    // 3. Check document.cookie fallback
    try {
      const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
      if (match && match[1]) {
        const cookieToken = decodeURIComponent(match[1]).trim();
        if (cookieToken && cookieToken !== "null" && cookieToken !== "undefined" && cookieToken.length > 10) {
          try { localStorage.setItem("token", cookieToken); } catch {}
          return cookieToken;
        }
      }
    } catch {}
  }
  return null;
}

// Save auth token to localStorage, sessionStorage, and persistent 30-day cookie
export function setAuthToken(token: string) {
  if (typeof window !== "undefined" && token) {
    const clean = token.trim();
    try { localStorage.setItem("token", clean); } catch {}
    try { sessionStorage.setItem("token", clean); } catch {}
    try {
      const maxAge = 30 * 24 * 60 * 60; // 30 days
      document.cookie = `token=${encodeURIComponent(clean)}; path=/; max-age=${maxAge}; SameSite=Lax;`;
    } catch {}
    window.dispatchEvent(new Event("auth_token_changed"));
  }
}

// Clear auth token across all storages
export function removeAuthToken() {
  if (typeof window !== "undefined") {
    try { localStorage.removeItem("token"); } catch {}
    try { sessionStorage.removeItem("token"); } catch {}
    try {
      document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;";
    } catch {}
    window.dispatchEvent(new Event("auth_token_changed"));
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

  // If unauthorized on an authenticated request and not a login/register call, clear bad token
  if (response.status === 401 && !cleanEndpoint.startsWith("/auth/")) {
    removeAuthToken();
  }

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

  verifyCode: (data: { email: string; code: string }) => apiFetch("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  resendCode: (email: string) => apiFetch("/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
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
  chatWithCoach: (message: string, history: { sender: string; text: string }[] = []) => 
    apiFetch("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),


  // Community Feed & Problem Sharing
  getPosts: (params?: { category?: string; search?: string; is_solved?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category && params.category !== "All") q.append("category", params.category);
    if (params?.search) q.append("search", params.search);
    if (params?.is_solved !== undefined) q.append("is_solved", String(params.is_solved));
    const qs = q.toString();
    return apiFetch(`/posts${qs ? `?${qs}` : ""}`);
  },
  getPostDetail: (postId: string) => apiFetch(`/posts/${postId}`),
  createPost: (data: { title: string; content: string; category?: string; tags?: string }) => apiFetch("/posts", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  addComment: (postId: string, content: string) => apiFetch(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  }),
  upvotePost: (postId: string) => apiFetch(`/posts/${postId}/upvote`, {
    method: "POST",
  }),
  togglePostSolved: (postId: string) => apiFetch(`/posts/${postId}/toggle-solved`, {
    method: "POST",
  }),
  deletePost: (postId: string) => apiFetch(`/posts/${postId}`, {
    method: "DELETE",
  }),

  // Admin Control Center API
  getAdminMetrics: () => apiFetch("/admin/metrics"),
  getAdminUsers: (params?: { search?: string; role?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.role && params.role !== "all") q.append("role", params.role);
    const qs = q.toString();
    return apiFetch(`/admin/users${qs ? `?${qs}` : ""}`);
  },
  createAdminUser: (data: Record<string, unknown>) => apiFetch("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateAdminUser: (userId: string, data: Record<string, unknown>) => apiFetch(`/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAdminUser: (userId: string) => apiFetch(`/admin/users/${userId}`, {
    method: "DELETE",
  }),

  // Admin Courses & Lessons
  getAdminCourses: () => apiFetch("/admin/courses"),
  createAdminCourse: (data: Record<string, unknown>) => apiFetch("/admin/courses", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateAdminCourse: (courseId: string, data: Record<string, unknown>) => apiFetch(`/admin/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAdminCourse: (courseId: string) => apiFetch(`/admin/courses/${courseId}`, {
    method: "DELETE",
  }),
  getAdminCourseLessons: (courseId: string) => apiFetch(`/admin/courses/${courseId}/lessons`),
  createAdminLesson: (courseId: string, data: Record<string, unknown>) => apiFetch(`/admin/courses/${courseId}/lessons`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateAdminLesson: (lessonId: string, data: Record<string, unknown>) => apiFetch(`/admin/lessons/${lessonId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAdminLesson: (lessonId: string) => apiFetch(`/admin/lessons/${lessonId}`, {
    method: "DELETE",
  }),

  // Admin Exams & Questions
  getAdminExams: () => apiFetch("/admin/exams"),
  createAdminExam: (data: Record<string, unknown>) => apiFetch("/admin/exams", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateAdminExam: (examId: string, data: Record<string, unknown>) => apiFetch(`/admin/exams/${examId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAdminExam: (examId: string) => apiFetch(`/admin/exams/${examId}`, {
    method: "DELETE",
  }),
  getAdminExamQuestions: (examId: string) => apiFetch(`/admin/exams/${examId}/questions`),
  createAdminExamQuestion: (examId: string, data: Record<string, unknown>) => apiFetch(`/admin/exams/${examId}/questions`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateAdminExamQuestion: (questionId: string, data: Record<string, unknown>) => apiFetch(`/admin/exams/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAdminExamQuestion: (questionId: string) => apiFetch(`/admin/exams/questions/${questionId}`, {
    method: "DELETE",
  }),
  getAdminExamSubmissions: () => apiFetch("/admin/exams/submissions"),

  // Admin Cohorts & Batches
  getAdminBatches: () => apiFetch("/admin/batches"),
  createAdminBatch: (data: Record<string, unknown>) => apiFetch("/admin/batches", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateAdminBatch: (batchId: string, data: Record<string, unknown>) => apiFetch(`/admin/batches/${batchId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAdminBatch: (batchId: string) => apiFetch(`/admin/batches/${batchId}`, {
    method: "DELETE",
  }),
  getAdminBatchStudents: (batchId: string) => apiFetch(`/admin/batches/${batchId}/students`),
  enrollAdminBatchStudent: (batchId: string, data: { user_id?: string; email?: string }) => apiFetch(`/admin/batches/${batchId}/enroll`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  removeAdminBatchStudent: (batchId: string, userId: string) => apiFetch(`/admin/batches/${batchId}/students/${userId}`, {
    method: "DELETE",
  }),

  // Admin Labs & Sandboxes
  getAdminLabs: () => apiFetch("/admin/labs"),
  createAdminLab: (data: Record<string, unknown>) => apiFetch("/admin/labs", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateAdminLab: (labId: string, data: Record<string, unknown>) => apiFetch(`/admin/labs/${labId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteAdminLab: (labId: string) => apiFetch(`/admin/labs/${labId}`, {
    method: "DELETE",
  }),
  getAdminLabSessions: (statusFilter?: string) => apiFetch(`/admin/lab-sessions${statusFilter ? `?status_filter=${statusFilter}` : ""}`),
  terminateAdminLabSession: (sessionId: string) => apiFetch(`/admin/lab-sessions/${sessionId}/terminate`, {
    method: "POST",
  }),

  // Admin Certificates
  getAdminCertificates: () => apiFetch("/admin/certificates"),
  issueAdminCertificate: (data: { user_id: string; course_id?: string; exam_id?: string; score_pct?: number; certificate_type?: string }) => apiFetch("/admin/certificates/issue", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  revokeAdminCertificate: (certId: string) => apiFetch(`/admin/certificates/${certId}`, {
    method: "DELETE",
  }),

  // Admin Community Moderation
  getAdminPosts: () => apiFetch("/admin/posts"),
  deleteAdminPost: (postId: string) => apiFetch(`/admin/posts/${postId}`, {
    method: "DELETE",
  }),
  deleteAdminComment: (commentId: string) => apiFetch(`/admin/comments/${commentId}`, {
    method: "DELETE",
  }),

  // Admin Financials & Invoices
  getAdminFinancials: () => apiFetch("/admin/financials"),
  getAdminInvoices: () => apiFetch("/admin/invoices"),
  updateAdminInvoiceStatus: (invoiceId: string, status: string) => apiFetch(`/admin/invoices/${invoiceId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  }),

  // Profile Updates & Details
  updateProfile: (data: Record<string, unknown>) => apiFetch("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  updatePassword: (data: Record<string, unknown>) => apiFetch("/users/me/password", {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  uploadAvatar: (avatarUrlOrBase64: string) => apiFetch("/users/me/avatar", {
    method: "POST",
    body: JSON.stringify({ avatar_url: avatarUrlOrBase64 }),
  }),
  removeAvatar: () => apiFetch("/users/me/avatar", {
    method: "DELETE",
  }),
  deleteAccount: () => apiFetch("/users/me", {
    method: "DELETE",
  }),
  getProfileDetails: () => apiFetch("/users/me/profile"),

  // Public Recruiter Portfolio & Certificate Verification
  getPublicProfile: (username: string) => apiFetch(`/users/${username}/public-profile`),
  getCertificates: () => apiFetch("/certificates"),
  verifyCertificate: (token: string) => apiFetch(`/certificates/verify/${token}`),
  getLeaderboard: () => apiFetch("/leaderboard"),
  getLabFlag: (labId: string) => apiFetch(`/labs/${labId}/flag`),

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
  validatePromoCode: (params: {
    promo_code: string;
    purchase_type?: string;
    plan_name?: string;
    billing_period?: string;
    duration_months?: number;
    course_id?: string;
  }) => apiFetch("/billing/validate-promo", {
    method: "POST",
    body: JSON.stringify({
      promo_code: params.promo_code,
      purchase_type: params.purchase_type || "subscription",
      plan_name: params.plan_name || "Pro",
      billing_period: params.billing_period || "monthly",
      duration_months: params.duration_months || 1,
      course_id: params.course_id,
    }),
  }),
  processPayment: (payload: {
    purchase_type?: string;
    plan_name?: string;
    billing_period?: string;
    duration_months?: number;
    course_id?: string;
    payment_method: string;
    card_number?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    card_cvc?: string;
    cardholder_name?: string;
    billing_country?: string;
    billing_zip?: string;
    promo_code?: string;
  }) => apiFetch("/billing/process-payment", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  getInvoices: () => apiFetch("/billing/invoices"),
  getInvoice: (invoiceId: string) => apiFetch(`/billing/invoices/${invoiceId}`),
  getMyPurchasedCourses: () => apiFetch("/billing/my-courses"),
  getSubscriptionStatus: () => apiFetch("/billing/status"),
  cancelSubscription: () => apiFetch("/billing/cancel", {
    method: "POST",
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

  // Onboarding & Unique Username
  checkUsernameAvailability: (username: string) => apiFetch(`/auth/check-username?username=${encodeURIComponent(username)}`),
  completeOnboarding: (data: {
    username: string;
    full_name?: string;
    primary_focus?: string;
    experience_level?: string;
    bio?: string;
    avatar_url?: string;
  }) => apiFetch("/auth/complete-onboarding", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

