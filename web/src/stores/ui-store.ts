import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  soundEnabled: boolean;
  toggleSidebar: () => void;
  setSound: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      soundEnabled: true,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSound: (soundEnabled) => set({ soundEnabled }),
    }),
    { name: 'pg-ui' },
  ),
);
