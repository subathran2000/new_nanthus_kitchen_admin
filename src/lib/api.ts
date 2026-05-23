import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "@/types";

// In production, use relative URL to go through nginx proxy (same-origin)
// In development, use the configured API URL or default to localhost:3000
const isProduction = import.meta.env.PROD;
const API_URL = isProduction 
  ? "/api"  // Relative URL - goes through nginx proxy, enabling same-origin cookies
  : (import.meta.env.VITE_API_URL as string);

// Base URL without /api for static files
// In production, use relative path; in development, extract from API_URL
const BASE_URL = isProduction 
  ? "" 
  : API_URL.replace(/\/api$/, "");

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
  config: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Retry the request
      prom.resolve(api(prom.config));
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
      _retryCount?: number;
    };

    // Don't retry if no config
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Track retry count to prevent infinite loops
    originalRequest._retryCount = originalRequest._retryCount || 0;

    // Don't try to refresh if:
    // 1. Original request was /auth/me (checking session - no need to refresh)
    // 2. Original request was /auth/refresh (already trying to refresh)
    // 3. Original request was /auth/login (user credentials are wrong)
    // 4. Original request was /auth/logout
    // 5. Already retried this request multiple times
    const isAuthMeRequest = originalRequest.url?.includes("/auth/me");
    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
    const isLoginRequest = originalRequest.url?.includes("/auth/login");
    const isLogoutRequest = originalRequest.url?.includes("/auth/logout");
    const maxRetries = 1;

    const shouldNotRetry = 
      isAuthMeRequest || 
      isRefreshRequest || 
      isLoginRequest || 
      isLogoutRequest ||
      originalRequest._retryCount >= maxRetries;

    if (error.response?.status === 401 && !shouldNotRetry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      originalRequest._retryCount++;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await api.post("/auth/refresh");
        processQueue();
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh failed - session is invalid
        // Don't automatically redirect here - let AuthContext handle it
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

/**
 * Extract a user-friendly error message from an API error
 * Handles various error formats from the backend
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const response = axiosError.response?.data;
    
    if (response) {
      // Handle validation errors (array of messages)
      if (Array.isArray(response.message)) {
        return response.message.join(". ");
      }
      // Handle string message
      if (typeof response.message === "string") {
        return response.message;
      }
      // Handle error property
      if (response.error) {
        return response.error;
      }
    }
    
    // Handle network errors
    if (axiosError.code === "ERR_NETWORK") {
      return "Network error. Please check your connection and try again.";
    }
    
    // Handle timeout
    if (axiosError.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }
    
    // Fallback to axios message
    return axiosError.message || "An unexpected error occurred";
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === "string") {
    return error;
  }
  
  return "An unexpected error occurred";
}

/**
 * Check if an error is a specific HTTP status
 */
export function isHttpError(error: unknown, status: number): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === status;
  }
  return false;
}

/**
 * Check if an error is a 401 Unauthorized
 */
export function isUnauthorized(error: unknown): boolean {
  return isHttpError(error, 401);
}

/**
 * Check if an error is a 403 Forbidden
 */
export function isForbidden(error: unknown): boolean {
  return isHttpError(error, 403);
}

/**
 * Check if an error is a 404 Not Found
 */
export function isNotFound(error: unknown): boolean {
  return isHttpError(error, 404);
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.code === "ERR_NETWORK" || error.code === "ECONNABORTED";
  }
  return false;
}
