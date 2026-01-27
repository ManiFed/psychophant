'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AgentForm } from '@/components/AgentForm';
import { useAgentsStore } from '@/stores/agents';
import { Agent, CreateAgentData } from '@/lib/api';

export default function EditAgentPage() {
  const params = useParams();
  const agentId = params.id as string;

  const { agents, updateAgent, fetchAgents, isLoading } = useAgentsStore();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // First try to find in existing agents
    const found = agents.find((a) => a.id === agentId);
    if (found) {
      setAgent(found);
    } else {
      // Fetch agents if not loaded
      fetchAgents().then(() => {
        const agentsList = useAgentsStore.getState().agents;
        const foundAgent = agentsList.find((a) => a.id === agentId);
        if (foundAgent) {
          setAgent(foundAgent);
        } else {
          setNotFound(true);
        }
      });
    }
  }, [agentId, agents, fetchAgents]);

  const handleSubmit = async (data: CreateAgentData) => {
    await updateAgent(agentId, data);
  };

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/agents" className="text-xs text-white/50 hover:text-white/70 transition-colors">
            &larr; back to agents
          </Link>
        </div>
        <div className="border border-white/10 p-12 text-center">
          <h1 className="text-xl font-bold mb-2">agent not found</h1>
          <p className="text-sm text-white/50">
            this agent may have been deleted or doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/agents" className="text-xs text-white/50 hover:text-white/70 transition-colors">
            &larr; back to agents
          </Link>
        </div>
        <div className="border border-white/10 p-12 text-center">
          <p className="text-sm text-white/50">loading agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/agents" className="text-xs text-white/50 hover:text-white/70 transition-colors">
          &larr; back to agents
        </Link>
        <h1 className="text-2xl font-bold mt-4">edit agent</h1>
        <p className="mt-1 text-xs text-white/50">
          update {agent.name}&apos;s personality and instructions.
        </p>
      </div>

      {/* Form */}
      <AgentForm agent={agent} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
