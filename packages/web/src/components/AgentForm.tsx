'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateAgentData, Agent } from '@/lib/api';

// Available models
const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash', provider: 'Google' },
];

// Preset colors for avatars
const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#f97316', // Orange
  '#22c55e', // Green
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

interface AgentFormProps {
  agent?: Agent;
  onSubmit: (data: CreateAgentData) => Promise<unknown>;
  isLoading?: boolean;
}

export function AgentForm({ agent, onSubmit, isLoading }: AgentFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAgentData>({
    name: agent?.name || '',
    model: agent?.model || 'anthropic/claude-3.5-sonnet',
    role: agent?.role || '',
    systemPrompt: agent?.systemPrompt || '',
    avatarColor: agent?.avatarColor || AVATAR_COLORS[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.role.trim()) {
      setError('Role is required');
      return;
    }

    try {
      await onSubmit(formData);
      router.push('/agents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Avatar Color */}
      <div className="space-y-3">
        <label className="text-xs text-white/70">avatar color</label>
        <div className="flex gap-2">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, avatarColor: color })}
              className={`w-10 h-10 transition-all ${
                formData.avatarColor === color
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-xs text-white/70">
          name *
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Skeptical Scientist"
          maxLength={100}
          className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      {/* Model */}
      <div className="space-y-2">
        <label htmlFor="model" className="text-xs text-white/70">
          ai model *
        </label>
        <select
          id="model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors appearance-none"
        >
          {AVAILABLE_MODELS.map((model) => (
            <option key={model.id} value={model.id} className="bg-black">
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label htmlFor="role" className="text-xs text-white/70">
          role / personality *
        </label>
        <textarea
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="e.g., You are a skeptical scientist who demands evidence and rigorous methodology. You challenge assumptions and point out logical fallacies."
          rows={3}
          maxLength={500}
          className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
        />
        <p className="text-xs text-white/30">{formData.role.length}/500 characters</p>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <label htmlFor="systemPrompt" className="text-xs text-white/70">
          hidden system prompt (optional)
        </label>
        <textarea
          id="systemPrompt"
          value={formData.systemPrompt || ''}
          onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
          placeholder="Additional instructions that other agents won't see. Use this for secret biases, hidden agendas, or specific debate tactics."
          rows={5}
          maxLength={10000}
          className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors resize-none font-mono"
        />
        <p className="text-xs text-white/30">
          other agents won&apos;t see this prompt - use it for hidden instructions
        </p>
      </div>

      {/* Preview */}
      <div className="border border-white/10 p-4 space-y-3">
        <p className="text-xs text-white/50">preview</p>
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: formData.avatarColor }}
          >
            {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h3 className="font-medium">{formData.name || 'Unnamed Agent'}</h3>
            <p className="text-xs text-white/50 mt-1">
              {formData.role || 'No role defined'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-orange-500 text-black py-3 text-sm font-medium hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'saving...' : agent ? 'save changes' : 'create agent'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 text-sm border border-white/10 hover:border-white/30 transition-colors"
        >
          cancel
        </button>
      </div>
    </form>
  );
}
