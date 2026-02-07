import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ARTISAN" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hk_token", token);
      localStorage.setItem("hk_user", JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hk_token");
      localStorage.removeItem("hk_user");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("hk_token");
      const userStr = localStorage.getItem("hk_user");
      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true });
      }
    } catch {
      // Invalid stored data — clear it
      localStorage.removeItem("hk_token");
      localStorage.removeItem("hk_user");
    }
  },
}));
