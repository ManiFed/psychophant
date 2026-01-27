import { create } from 'zustand';
import { agentsApi, Agent, CreateAgentData } from '@/lib/api';
import { useAuthStore } from './auth';

interface AgentsState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAgents: () => Promise<void>;
  createAgent: (data: CreateAgentData) => Promise<Agent>;
  updateAgent: (id: string, data: Partial<CreateAgentData>) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAgentsStore = create<AgentsState>()((set, get) => ({
  agents: [],
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await agentsApi.list(token);
      set({ agents: response.agents, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch agents';
      set({ error: message, isLoading: false });
    }
  },

  createAgent: async (data: CreateAgentData) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Not authenticated');
    }

    set({ isLoading: true, error: null });
    try {
      const response = await agentsApi.create(token, data);
      set((state) => ({
        agents: [response.agent, ...state.agents],
        isLoading: false,
      }));
      return response.agent;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create agent';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateAgent: async (id: string, data: Partial<CreateAgentData>) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Not authenticated');
    }

    set({ isLoading: true, error: null });
    try {
      const response = await agentsApi.update(token, id, data);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? response.agent : a)),
        isLoading: false,
      }));
      return response.agent;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update agent';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteAgent: async (id: string) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Not authenticated');
    }

    set({ isLoading: true, error: null });
    try {
      await agentsApi.delete(token, id);
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete agent';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
