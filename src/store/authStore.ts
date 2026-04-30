import { create } from 'zustand';

const TOKEN_KEY = 'studio_master_token';

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),

  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },

  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null });
  },

  getToken: () => get().token,
}));
