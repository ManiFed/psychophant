import { create } from 'zustand';
import { creditsApi } from '@/lib/api';
import { useAuthStore } from './auth';

interface SubscriptionInfo {
  plan: string;
  planName: string;
  budgetCents: number;
  usageCents: number;
  extraUsageCents: number;
  totalBudgetCents: number;
  remainingCents: number;
  usagePercent: number;
  currentPeriodEnd: string;
  autoReloadCents: number;
}

interface CreditsState {
  freeCents: number;
  purchasedCents: number;
  totalCents: number;
  lastFreeReset: string | null;
  subscription: SubscriptionInfo | null;
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
  subscription: null,
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
        subscription: response.subscription || null,
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

// Format credits display for header
export const formatCreditsDisplay = (state: { subscription: SubscriptionInfo | null; freeCents: number }): string => {
  if (state.subscription) {
    return `${state.subscription.usagePercent}% used`;
  }
  // Free users: show credits (freeCents = credits for now)
  return `${state.freeCents} credits`;
};
