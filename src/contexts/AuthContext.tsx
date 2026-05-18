import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import api, { isUnauthorized, isNetworkError } from "@/lib/api";
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
    } catch (error: unknown) {
      // Only clear auth on 401 errors, not on network errors
      // This prevents logout on temporary network issues
      if (isUnauthorized(error)) {
        clearAuth();
      } else if (isNetworkError(error)) {
        // Network error - keep existing auth state if we have one
        // User will be validated on next successful request
        console.warn(
          "[Auth] Network error during auth check, keeping existing state",
        );
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

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      // Validate credentials before sending
      if (!credentials.email || !credentials.password) {
        throw new Error("Email and password are required");
      }

      try {
        const response = await api.post<{
          user: User;
          accessToken: string;
          refreshToken: string;
        }>("/auth/login", credentials);

        // Validate the response has the expected data
        if (!response.data || !response.data.user || !response.data.user.id) {
          throw new Error("Invalid response from server");
        }

        setUser(response.data.user);
        setLastAuthCheck(Date.now());
        toast.success("Welcome back!");
        navigate("/dashboard", { replace: true });
      } catch (error: unknown) {
        // Clear auth state on error
        clearAuth();
        // Re-throw so the calling component (LoginPage) can handle UI feedback
        throw error;
      }
    },
    [setUser, setLastAuthCheck, clearAuth, navigate],
  );

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
  const canEdit =
    user?.role === "super_admin" ||
    user?.role === "admin" ||
    user?.role === "manager";

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
