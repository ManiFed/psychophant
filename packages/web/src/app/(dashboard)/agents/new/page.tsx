'use client';

import Link from 'next/link';
import { AgentForm } from '@/components/AgentForm';
import { useAgentsStore } from '@/stores/agents';

export default function NewAgentPage() {
  const { createAgent, isLoading } = useAgentsStore();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/agents" className="text-xs text-white/50 hover:text-white/70 transition-colors">
          &larr; back to agents
        </Link>
        <h1 className="text-2xl font-bold mt-4">create agent</h1>
        <p className="mt-1 text-xs text-white/50">
          define a unique ai personality with its own role and hidden instructions.
        </p>
      </div>

      {/* Form */}
      <AgentForm onSubmit={createAgent} isLoading={isLoading} />
    </div>
  );
}
