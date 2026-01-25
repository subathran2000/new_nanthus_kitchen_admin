import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Base URL without /api for static files
const BASE_URL = API_URL.replace(/\/api$/, "");

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Get the full URL for an image/file path
 * Handles both relative paths like '/uploads/events/file.jpg'
 * and full URLs that might already include the domain
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  // If it's already a full URL (http/https), return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // If it's a data URL (base64 preview), return as-is
  if (path.startsWith("data:")) {
    return path;
  }
  // Otherwise, prepend the base URL
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// Debug: Log API URL in development
if (import.meta.env.DEV) {
  console.log("[API] Base URL:", API_URL);
}

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    // Access token is stored in HTTP-only cookies, so nothing to add here
    return config;
  },
  (error) => {
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  },
);

// Track if a refresh is already in progress
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't try to refresh if:
    // 1. Original request was /auth/me (no session to refresh)
    // 2. Original request was /auth/refresh (already trying to refresh)
    // 3. Already retried this request
    const isAuthMeRequest = originalRequest.url?.includes("/auth/me");
    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthMeRequest &&
      !isRefreshRequest
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await api.post("/auth/refresh");
        processQueue();
        isRefreshing = false;
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        // Refresh failed, clear auth and let AuthContext handle redirect
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
