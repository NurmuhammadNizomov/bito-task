import { create } from 'zustand';
import { setAccessToken } from '../lib/axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setUser: (user: User | null, accessToken: string | null) => void;
  clearUser: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  setUser: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, isAuthenticated: !!user, isInitializing: false });
  },
  clearUser: () => {
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isInitializing: false });
  },
  setInitialized: () => set({ isInitializing: false }),
}));
