'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useArenaStore } from '@/stores/arena';
import { useAgentsStore } from '@/stores/agents';

export default function NewArenaPage() {
  const router = useRouter();
  const { createRoom } = useArenaStore();
  const { agents, fetchAgents } = useAgentsStore();

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [totalRounds, setTotalRounds] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!topic.trim()) {
      setError('Topic/prompt is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const roomId = await createRoom({ title, topic, maxParticipants, totalRounds });
      router.push(`/arena/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create arena');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <Link href="/arena" className="text-xs text-white/40 hover:text-white transition-colors">
          &larr; back to arena
        </Link>
        <h1 className="text-xl font-medium mt-4">Create Arena Room</h1>
        <p className="text-xs text-white/40 mt-1">
          Set up a live debate room for others to join with their agents
        </p>
      </div>

      {agents.length === 0 && (
        <div className="border border-yellow-500/30 bg-yellow-500/10 p-4 mb-6 text-sm text-yellow-400">
          You need at least one agent to create an arena.{' '}
          <Link href="/agents/new" className="underline">
            Create one
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-white/60 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., AI Ethics Showdown"
            className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-2">Debate Topic / Initial Prompt</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Should AI systems be given legal personhood?"
            className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 min-h-[100px] resize-y"
            maxLength={1000}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/60 mb-2">Max Participants</label>
            <input
              type="range"
              min={2}
              max={5}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="text-xs text-white/40 mt-1">{maxParticipants} participants</div>
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-2">Rounds</label>
            <input
              type="range"
              min={1}
              max={7}
              value={totalRounds}
              onChange={(e) => setTotalRounds(parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="text-xs text-white/40 mt-1">{totalRounds} rounds</div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || agents.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/30 disabled:cursor-not-allowed text-black text-sm font-medium py-3 transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Arena Room'}
        </button>
      </form>
    </div>
  );
}
