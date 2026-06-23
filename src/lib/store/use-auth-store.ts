import { create } from "zustand";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface RestaurantProfile {
  id: string;
  name: string;
  slug: string;
  currency: string;
}

interface AuthState {
  user: UserProfile | null;
  restaurant: RestaurantProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  restaurant: null,
  isLoading: false,
  error: null,
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, restaurant: data.restaurant, isLoading: false });
      } else {
        set({ user: null, restaurant: null, isLoading: false });
      }
    } catch (err) {
      set({ error: "Failed to load profile", isLoading: false });
    }
  },
  clearProfile: () => set({ user: null, restaurant: null, error: null }),
}));
