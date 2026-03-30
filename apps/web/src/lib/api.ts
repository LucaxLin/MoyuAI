interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "网络错误",
        },
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async upload<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "上传失败",
        },
      };
    }
  }
}

export const api = new ApiClient();

export const authApi = {
  sendCode: (email: string, password: string) =>
    api.post("/api/auth/register/send-code", { email, password }),

  verifyCode: (email: string, code: string) =>
    api.post("/api/auth/register/verify", { email, code }),

  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),

  logout: () => api.post("/api/auth/logout"),

  getSession: () => api.get("/api/user/session"),
};

export const userApi = {
  getProfile: () => api.get("/api/user/profile"),

  updateProfile: (data: { name?: string; avatar?: string | null }) =>
    api.put("/api/user/profile", data),

  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.put("/api/user/password", data),

  updateTheme: (theme: "light" | "dark" | "system") =>
    api.put("/api/user/theme", { theme }),
};

export const sessionApi = {
  list: () => api.get("/api/sessions"),

  create: (title?: string) => api.post("/api/sessions", { title }),

  get: (id: string) => api.get(`/api/sessions/${id}`),

  update: (id: string, title: string) =>
    api.put(`/api/sessions/${id}`, { title }),

  delete: (id: string) => api.delete(`/api/sessions/${id}`),
};

export const messageApi = {
  list: (sessionId: string, page = 1, limit = 50) =>
    api.get(`/api/sessions/${sessionId}/messages?page=${page}&limit=${limit}`),

  send: (
    sessionId: string,
    data: {
      content: string;
      imageUrl?: string | null;
      editRegion?: {
        x: number;
        y: number;
        width: number;
        height: number;
      } | null;
    }
  ) => api.post(`/api/sessions/${sessionId}/messages`, data),

  delete: (id: string) => api.delete(`/api/messages/${id}`),
};

export const imageApi = {
  list: (params?: { page?: number; limit?: number; sort?: string; filter?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.filter) searchParams.set("filter", params.filter);
    const query = searchParams.toString();
    return api.get(`/api/images${query ? `?${query}` : ""}`);
  },

  get: (id: string) => api.get(`/api/images/${id}`),

  update: (id: string, data: { prompt?: string }) =>
    api.put(`/api/images/${id}`, data),

  delete: (id: string) => api.delete(`/api/images/${id}`),

  toggleFavorite: (id: string) => api.put(`/api/images/${id}/favorite`),

  upload: (file: File) => api.upload<File>("/api/upload", file),
};
