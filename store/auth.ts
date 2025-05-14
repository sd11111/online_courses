import { create } from 'zustand';
import { Role } from '@prisma/client';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  authChecked: boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  authChecked: false,

  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  setIsLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка входа');
      }

      const { user } = await response.json();
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  checkAuth: async () => {
    // Проверяем, была ли уже выполнена проверка аутентификации
    const { authChecked } = get();
    if (authChecked) return;
    
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/me');
      
      if (!response.ok) {
        set({ user: null, isLoading: false, authChecked: true });
        return;
      }

      const { user } = await response.json();
      set({ user, isLoading: false, authChecked: true });
    } catch (error) {
      console.error('Auth check error:', error);
      set({ user: null, isLoading: false, authChecked: true });
    }
  },
}));