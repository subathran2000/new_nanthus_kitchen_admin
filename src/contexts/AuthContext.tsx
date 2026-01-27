import { createContext, useContext, useEffect, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { User, LoginCredentials } from "@/types";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  canEdit: boolean; // Whether user can perform create/edit/delete operations
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setIsLoading,
    setLastAuthCheck,
    logout: clearAuth,
  } = useAuthStore();

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<User>("/auth/me");
      if (response.data && response.data.id) {
        setUser(response.data);
        setLastAuthCheck(Date.now());
      } else {
        // Invalid response, clear auth
        clearAuth();
      }
    } catch (error: any) {
      // Only clear auth on 401 errors, not on network errors
      // This prevents logout on temporary network issues
      if (error.response?.status === 401) {
        clearAuth();
      } else if (!error.response) {
        // Network error - keep existing auth state if we have one
        // User will be validated on next successful request
        console.warn("[Auth] Network error during auth check, keeping existing state");
        if (!user) {
          clearAuth();
        }
      } else {
        clearAuth();
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setUser, setLastAuthCheck, clearAuth, user]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<User>("/auth/me");
      if (response.data && response.data.id) {
        setUser(response.data);
        setLastAuthCheck(Date.now());
      }
    } catch {
      // Ignore refresh errors
    }
  }, [setUser, setLastAuthCheck]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    // Validate credentials before sending
    if (!credentials.email || !credentials.password) {
      const errorMessage = "Email and password are required";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const response = await api.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>("/auth/login", credentials);

      // Validate the response has the expected data
      if (!response.data || !response.data.user || !response.data.user.id) {
        const errorMessage = "Invalid response from server";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      setUser(response.data.user);
      setLastAuthCheck(Date.now());
      toast.success("Welcome back!");
      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
    } catch (error: any) {
      // Don't show success for errors - ensure proper error handling
      clearAuth(); // Make sure we're not in authenticated state on error

      let message = "Login failed. Please try again.";

      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const serverMessage = error.response.data?.message;

        if (status === 401) {
          message = serverMessage || "Invalid email or password";
        } else if (status === 403) {
          message = serverMessage || "Your account has been deactivated";
        } else if (status === 429) {
          message = "Too many login attempts. Please try again later.";
        } else if (status >= 500) {
          message = "Server error. Please try again later.";
        } else if (serverMessage) {
          message = serverMessage;
        }
      } else if (error.request) {
        // Network error - no response received
        message = "Unable to connect to server. Please check your connection.";
      } else if (error.message) {
        message = error.message;
      }

      toast.error(message);
      throw error;
    }
  }, [setUser, setLastAuthCheck, clearAuth, navigate]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      navigate("/login");
      toast.success("Logged out successfully");
    }
  }, [clearAuth, navigate]);

  useEffect(() => {
    // Only check auth on mount, not on every render
    let mounted = true;

    const initAuth = async () => {
      if (mounted) {
        await checkAuth();
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if user can perform edit operations (create/update/delete)
  // super_admin, admin, and manager can edit, visitors are read-only
  const canEdit = user?.role === "super_admin" || user?.role === "admin" || user?.role === "manager";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        canEdit,
        login,
        logout,
        checkAuth,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
