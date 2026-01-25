import { createContext, useContext, useEffect, ReactNode } from "react";
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
    logout: clearAuth,
  } = useAuthStore();

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<User>("/auth/me");
      setUser(response.data);
    } catch (error) {
      // Clear any stale authenticated state
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get<User>("/auth/me");
      setUser(response.data);
    } catch {
      // Ignore refresh errors
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<{ user: User }>(
        "/auth/login",
        credentials,
      );
      setUser(response.data.user);
      toast.success("Welcome back!");
      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 0);
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      navigate("/login");
      toast.success("Logged out successfully");
    }
  };

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
  // Only super_admin and admin can edit, visitors are read-only
  const canEdit = user?.role === "super_admin" || user?.role === "admin";

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
