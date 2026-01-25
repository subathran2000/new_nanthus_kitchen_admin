import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  logout: () => void;
}

// Use only HTTP-only cookies for auth, no localStorage persistence
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setIsLoading: (value) => set({ isLoading: value }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
