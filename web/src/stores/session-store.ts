import { create } from 'zustand';

interface SessionState {
  accessToken: string | null;
  restaurantId: string | null;
  restaurantName: string;
  setSession: (s: { accessToken: string; restaurantId: string; restaurantName: string }) => void;
  refresh: () => Promise<boolean>;
  logout: () => void;
}

/**
 * Sessão do painel. O access token fica só em memória; o refresh token vive
 * em cookie HttpOnly gerenciado pelo route handler /api/auth (BFF), fora do alcance de JS.
 */
export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  restaurantId: 'demo-restaurant',
  restaurantName: 'Burger do Zé',
  setSession: (s) => set(s),
  refresh: async () => {
    const res = await fetch('/api/auth/refresh', { method: 'POST' }).catch(() => null);
    if (!res?.ok) {
      set({ accessToken: null });
      return false;
    }
    const { accessToken } = (await res.json()) as { accessToken: string };
    set({ accessToken });
    return true;
  },
  logout: () => set({ accessToken: null, restaurantId: null }),
}));
