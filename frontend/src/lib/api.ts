const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

// Base Fetch Wrapper
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  
  login: (data: Record<string, unknown>) => apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  
  logout: () => {
    removeAuthToken();
    return Promise.resolve({ detail: "Logged out locally" });
  },
  
  socialLogin: (provider: string, email?: string, fullName?: string, token?: string) => apiFetch("/auth/social-login", {
    method: "POST",
    body: JSON.stringify({
      provider,
      email: email || `demo_${provider}_user@cyberlearn.io`,
      full_name: fullName || `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      provider_token: token || "mock_provider_token_12345"
    }),
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

  // Admin
  getAdminMetrics: () => apiFetch("/admin/metrics"),

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
  getProfileDetails: () => apiFetch("/users/me/profile"),
};
