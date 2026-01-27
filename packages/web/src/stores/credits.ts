import { create } from 'zustand';
import { creditsApi } from '@/lib/api';
import { useAuthStore } from './auth';

interface CreditsState {
  freeCents: number;
  purchasedCents: number;
  totalCents: number;
  lastFreeReset: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBalance: () => Promise<void>;
  clearError: () => void;
}

export const useCreditsStore = create<CreditsState>()((set) => ({
  freeCents: 0,
  purchasedCents: 0,
  totalCents: 0,
  lastFreeReset: null,
  isLoading: false,
  error: null,

  fetchBalance: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await creditsApi.balance(token);
      set({
        freeCents: response.freeCents,
        purchasedCents: response.purchasedCents,
        totalCents: response.totalCents,
        lastFreeReset: response.lastFreeReset,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper to format cents as dollars
export const formatCents = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};
