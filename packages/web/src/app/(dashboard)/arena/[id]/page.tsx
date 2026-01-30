'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useArenaStore } from '@/stores/arena';
import { useAuthStore } from '@/stores/auth';
import { useAgentsStore } from '@/stores/agents';
import { useArenaStream } from '@/hooks/useArenaStream';
import type { Message, Participant } from '@/lib/api';

interface StreamingMessage extends Message {
  isStreaming?: boolean;
}

export default function ArenaRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { currentRoom, fetchRoom, joinRoom, leaveRoom, toggleReady, startRoom, sendInstruction, isLoading } = useArenaStore();
  const user = useAuthStore((s) => s.user);
  const { agents, fetchAgents } = useAgentsStore();

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [instruction, setInstruction] = useState('');
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myParticipant = currentRoom?.participants.find((p) => p.userId === user?.id);
  const isCreator = currentRoom?.createdById === user?.id;
  const isWaiting = currentRoom?.status === 'waiting';
  const isActive = currentRoom?.status === 'active';

  useEffect(() => {
    fetchRoom(id);
    fetchAgents();
  }, [id, fetchRoom, fetchAgents]);

  // Load conversation messages when room has a conversation
  useEffect(() => {
    if (currentRoom?.conversation) {
      setMessages(currentRoom.conversation.messages || []);
      setParticipants(currentRoom.conversation.participants || []);
    }
  }, [currentRoom?.conversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Arena stream callbacks
  const onParticipantJoined = useCallback(() => {
    fetchRoom(id);
  }, [id, fetchRoom]);

  const onParticipantReady = useCallback(() => {
    fetchRoom(id);
  }, [id, fetchRoom]);

  const onArenaStarted = useCallback(() => {
    fetchRoom(id);
  }, [id, fetchRoom]);

  const onMessageStart = useCallback((data: { agentId: string; messageId: string }) => {
    setCurrentAgent(data.agentId);
    setMessages((prev) => [
      ...prev,
      {
        id: data.messageId,
        conversationId: '',
        agentId: data.agentId,
        userId: null,
        content: '',
        role: 'agent' as const,
        roundNumber: currentRound,
        modelUsed: null,
        inputTokens: null,
        outputTokens: null,
        costCents: 0,
        generationTimeMs: null,
        messageType: 'standard',
        createdAt: new Date().toISOString(),
        isStreaming: true,
      },
    ]);
  }, [currentRound]);

  const onMessageToken = useCallback((data: { messageId: string; token: string }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === data.messageId ? { ...m, content: m.content + data.token } : m
      )
    );
  }, []);

  const onMessageComplete = useCallback(
    (data: { messageId: string; fullContent: string; inputTokens: number; outputTokens: number; costCents: number }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? {
                ...m,
                content: data.fullContent,
                inputTokens: data.inputTokens,
                outputTokens: data.outputTokens,
                costCents: data.costCents,
                isStreaming: false,
              }
            : m
        )
      );
      setCurrentAgent(null);
    },
    []
  );

  const onTurnChange = useCallback((data: { round: number }) => {
    setCurrentRound(data.round);
  }, []);

  const onRoundComplete = useCallback(() => {
    // Round complete - in arena, auto-resume after short pause
  }, []);

  const onConversationComplete = useCallback(() => {
    setIsComplete(true);
    setCurrentAgent(null);
    fetchRoom(id);
  }, [id, fetchRoom]);

  useArenaStream(id, {
    onParticipantJoined,
    onParticipantReady,
    onArenaStarted,
    onMessageStart,
    onMessageToken,
    onMessageComplete,
    onTurnChange,
    onRoundComplete,
    onConversationComplete,
  });

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'System';
    const p = participants.find((p) => p.agentId === agentId);
    return p?.agent?.name || 'Unknown';
  };

  const getAgentColor = (agentId: string | null) => {
    if (!agentId) return '#6b7280';
    const p = participants.find((p) => p.agentId === agentId);
    return p?.agent?.avatarColor || '#6366f1';
  };

  const handleJoin = async () => {
    if (!selectedAgentId) return;
    setActionLoading(true);
    setError(null);
    try {
      await joinRoom(id, selectedAgentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await leaveRoom(id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReady = async () => {
    setActionLoading(true);
    try {
      await toggleReady(id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await startRoom(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;
    try {
      await sendInstruction(id, instruction);
      setInstruction('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send instruction');
    }
  };

  if (isLoading && !currentRoom) {
    return <div className="text-center py-20 text-white/40 text-sm">Loading arena...</div>;
  }

  if (!currentRoom) {
    return <div className="text-center py-20 text-white/40 text-sm">Arena not found</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b border-white/10 pb-4 mb-4">
        <Link href="/arena" className="text-xs text-white/40 hover:text-white transition-colors">
          &larr; back to arena
        </Link>
        <div className="flex items-center justify-between mt-3">
          <div>
            <h1 className="text-lg font-medium">{currentRoom.title}</h1>
            <p className="text-xs text-white/40 mt-0.5">{currentRoom.topic}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30 font-mono">
              {currentRoom.totalRounds} rounds
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 border font-mono ${
                isWaiting
                  ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
                  : isActive
                  ? 'text-green-400 border-green-400/30 bg-green-400/10'
                  : 'text-white/40 border-white/10 bg-white/5'
              }`}
            >
              {currentRoom.status}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 p-3 mb-4 text-sm text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-red-200">
            dismiss
          </button>
        </div>
      )}

      {/* Waiting/Lobby State */}
      {isWaiting && (
        <div className="flex-1 flex flex-col">
          {/* Participants */}
          <div className="border border-white/10 p-4 mb-4">
            <h2 className="text-xs text-white/60 font-medium mb-3">
              Participants ({currentRoom.participants.length}/{currentRoom.maxParticipants})
            </h2>
            <div className="space-y-2">
              {currentRoom.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border border-white/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.agent.avatarColor }}
                    />
                    <div>
                      <span className="text-sm">{p.agent.name}</span>
                      <span className="text-xs text-white/30 ml-2">
                        by {p.user.username || p.user.email}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 border font-mono ${
                      p.isReady
                        ? 'text-green-400 border-green-400/30 bg-green-400/10'
                        : 'text-white/30 border-white/10'
                    }`}
                  >
                    {p.isReady ? 'ready' : 'not ready'}
                  </span>
                </div>
              ))}

              {Array.from({
                length: currentRoom.maxParticipants - currentRoom.participants.length,
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center border border-dashed border-white/10 p-3 text-xs text-white/20"
                >
                  waiting for player...
                </div>
              ))}
            </div>
          </div>

          {/* Join / Ready / Start controls */}
          <div className="border border-white/10 p-4">
            {!myParticipant ? (
              <div>
                <h3 className="text-xs text-white/60 mb-3">Join this arena</h3>
                <div className="flex gap-3">
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="">Select your agent...</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleJoin}
                    disabled={!selectedAgentId || actionLoading}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/30 text-black text-sm font-medium px-6 py-2 transition-colors"
                  >
                    {actionLoading ? '...' : 'Join'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleReady}
                    disabled={actionLoading}
                    className={`text-sm font-medium px-6 py-2 transition-colors ${
                      myParticipant.isReady
                        ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                        : 'bg-orange-500 hover:bg-orange-600 text-black'
                    }`}
                  >
                    {myParticipant.isReady ? 'Ready!' : 'Mark Ready'}
                  </button>
                  <button
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className="text-xs text-white/30 hover:text-red-400 transition-colors"
                  >
                    leave
                  </button>
                </div>

                {isCreator && (
                  <button
                    onClick={handleStart}
                    disabled={
                      actionLoading ||
                      currentRoom.participants.length < 2 ||
                      !currentRoom.participants.every((p) => p.isReady)
                    }
                    className="bg-green-500 hover:bg-green-600 disabled:bg-green-500/30 disabled:cursor-not-allowed text-black text-sm font-medium px-6 py-2 transition-colors"
                  >
                    {actionLoading ? 'Starting...' : 'Start Arena'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active/Completed State - Live Debate */}
      {(isActive || currentRoom.status === 'completed') && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Status bar */}
          <div className="flex items-center gap-4 mb-3 text-[10px] text-white/30">
            <span>Round {currentRound}/{currentRoom.totalRounds}</span>
            {currentAgent && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {getAgentName(currentAgent)} is speaking...
              </span>
            )}
            {isComplete && <span className="text-white/50">Debate complete</span>}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto border border-white/10 p-4 space-y-4 min-h-0">
            {messages.map((msg) => {
              if (msg.role === 'system') {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-[10px] text-white/30 font-mono uppercase">topic</span>
                    <p className="text-sm text-white/60 mt-1 bg-white/5 border border-white/10 p-3 inline-block">
                      {msg.content}
                    </p>
                  </div>
                );
              }

              const agentColor = getAgentColor(msg.agentId);
              const agentName = getAgentName(msg.agentId);

              return (
                <div key={msg.id} className="flex gap-3">
                  <div
                    className="w-1 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: agentColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium" style={{ color: agentColor }}>
                        {agentName}
                      </span>
                      {msg.roundNumber && (
                        <span className="text-[10px] text-white/20">R{msg.roundNumber}</span>
                      )}
                    </div>
                    <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
                      {msg.content}
                      {(msg as StreamingMessage).isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-orange-500 animate-pulse ml-0.5 align-text-bottom" />
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Instruction input (only for active arena participants) */}
          {isActive && myParticipant && !isComplete && (
            <form onSubmit={handleInstruction} className="mt-3 flex gap-2">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Give your agent instructions..."
                className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={!instruction.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/30 text-black text-xs font-medium px-4 py-2 transition-colors"
              >
                Instruct
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
