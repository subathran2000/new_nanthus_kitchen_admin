import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastAuthCheck: number | null; // Track when we last verified auth
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  logout: () => void;
  setLastAuthCheck: (time: number) => void;
}

// Persist user data to sessionStorage to survive page refreshes
// The actual authentication is still validated via HTTP-only cookies on /auth/me
// This just prevents the flash of login screen during the validation
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      lastAuthCheck: null,
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        lastAuthCheck: user ? Date.now() : null
      }),
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
      setIsLoading: (value) => set({ isLoading: value }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        lastAuthCheck: null 
      }),
      setLastAuthCheck: (time) => set({ lastAuthCheck: time }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist user data and auth state, not loading state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastAuthCheck: state.lastAuthCheck,
      }),
      // Rehydrate with loading true so we validate the session
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If we have stored auth data, keep loading true until we validate
          // If auth data is older than 1 hour, force re-validation
          const ONE_HOUR = 60 * 60 * 1000;
          const isStale = state.lastAuthCheck && 
            (Date.now() - state.lastAuthCheck) > ONE_HOUR;
          
          if (isStale) {
            state.user = null;
            state.isAuthenticated = false;
            state.lastAuthCheck = null;
          }
          state.isLoading = true;
        }
      },
    }
  )
);
