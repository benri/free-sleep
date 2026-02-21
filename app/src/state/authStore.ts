import { create } from 'zustand';

const TOKEN_KEY = 'auth_token';

type TokenPayload = { userId: number; username: string; role: string };

function decodePayload(token: string | null): TokenPayload | null {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

type AuthState = {
  token: string | null;
  user: TokenPayload | null;
  setToken: (token: string) => void;
  clearToken: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: decodePayload(localStorage.getItem(TOKEN_KEY)),
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, user: decodePayload(token) });
  },
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null });
  },
}));
