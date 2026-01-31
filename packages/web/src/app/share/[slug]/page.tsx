'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { conversationsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface SharedMessage {
  id: string;
  content: string;
  role: string;
  agentId: string | null;
  roundNumber: number | null;
  messageType: string;
  createdAt: string;
}

interface SharedParticipant {
  id: string;
  agentId: string;
  turnOrder: number;
  agent: {
    id: string;
    name: string;
    avatarColor: string;
    avatarUrl: string | null;
    model: string;
    role: string;
  };
}

interface SharedConversation {
  id: string;
  title: string | null;
  mode: string;
  status: string;
  currentRound: number;
  totalRounds: number | null;
  createdAt: string;
  user: { id: string; username: string | null };
}

export default function SharePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { token } = useAuthStore();

  const [conversation, setConversation] = useState<SharedConversation | null>(null);
  const [messages, setMessages] = useState<SharedMessage[]>([]);
  const [participants, setParticipants] = useState<SharedParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remixing, setRemixing] = useState(false);

  useEffect(() => {
    conversationsApi
      .getShared(slug)
      .then((data) => {
        setConversation(data.conversation as unknown as SharedConversation);
        setMessages(data.messages as unknown as SharedMessage[]);
        setParticipants(data.participants as unknown as SharedParticipant[]);
      })
      .catch(() => setError('Shared conversation not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleRemix = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    setRemixing(true);
    try {
      const result = await conversationsApi.remixShared(token, slug);
      router.push(`/conversations/${result.conversation.id}`);
    } catch {
      setError('Failed to remix conversation');
      setRemixing(false);
    }
  };

  const getAgent = (agentId: string | null) =>
    participants.find((p) => p.agentId === agentId)?.agent;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <p className="text-xs text-white/40">loading shared conversation...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">not found</h1>
          <p className="text-xs text-white/40 mb-4">{error || 'This shared link is no longer available.'}</p>
          <Link href="/" className="text-xs text-orange-500 hover:text-orange-400">
            go to psychophant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
                <div className="bg-orange-500 rounded-sm" />
                <div className="bg-orange-500/60 rounded-sm" />
                <div className="bg-orange-500/30 rounded-sm" />
                <div className="bg-orange-500 rounded-sm" />
              </div>
            </div>
            <span className="font-mono text-sm font-medium tracking-tight">psychophant</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30 border border-white/10 px-2 py-0.5">READ-ONLY</span>
            <button
              onClick={handleRemix}
              disabled={remixing}
              className="bg-orange-500 hover:bg-orange-400 text-black text-xs font-medium px-4 py-1.5 transition-colors disabled:opacity-50"
            >
              {remixing ? 'remixing...' : 'remix'}
            </button>
          </div>
        </div>
      </header>

      {/* Conversation Info */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="border-b border-white/10 pb-4 mb-6">
          <h1 className="text-xl font-bold">{conversation.title || 'Untitled Conversation'}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-white/40">{conversation.mode}</span>
            {conversation.user.username && (
              <span className="text-xs text-white/40">
                by{' '}
                <Link href={`/u/${conversation.user.username}`} className="text-orange-400 hover:text-orange-300">
                  {conversation.user.username}
                </Link>
              </span>
            )}
            <span className="text-xs text-white/30">
              {new Date(conversation.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3 mt-3">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 flex items-center justify-center text-[9px] font-bold rounded-full overflow-hidden"
                  style={{ backgroundColor: p.agent.avatarUrl ? 'transparent' : p.agent.avatarColor }}
                >
                  {p.agent.avatarUrl ? (
                    <img src={p.agent.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-black/80">{p.agent.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="text-xs text-white/60">{p.agent.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((msg) => {
            const agent = getAgent(msg.agentId);
            const isSystem = msg.role === 'system' || msg.role === 'synthesizer';
            const isUser = msg.role === 'user';

            return (
              <div key={msg.id} className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  {agent ? (
                    <div
                      className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full overflow-hidden"
                      style={{ backgroundColor: agent.avatarUrl ? 'transparent' : agent.avatarColor }}
                    >
                      {agent.avatarUrl ? (
                        <img src={agent.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-black/80">{agent.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  ) : isUser ? (
                    <div className="w-7 h-7 flex items-center justify-center text-xs font-bold bg-blue-500/20 text-blue-400 rounded-full">
                      U
                    </div>
                  ) : (
                    <div className="w-7 h-7 flex items-center justify-center text-xs font-bold bg-white/10 text-white/50 rounded-full">
                      S
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${isSystem ? 'text-white/40' : isUser ? 'text-blue-400' : 'text-white/80'}`}>
                      {agent?.name || (isUser ? 'User' : 'System')}
                    </span>
                    {msg.roundNumber && (
                      <span className="text-[10px] text-white/20">round {msg.roundNumber}</span>
                    )}
                  </div>
                  <div className="text-sm text-white/70 whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 mt-8 pt-6 text-center">
          <p className="text-xs text-white/30 mb-3">
            this is a read-only view of a shared conversation
          </p>
          <button
            onClick={handleRemix}
            disabled={remixing}
            className="bg-orange-500 hover:bg-orange-400 text-black text-xs font-medium px-6 py-2 transition-colors disabled:opacity-50"
          >
            {remixing ? 'remixing...' : 'remix this conversation'}
          </button>
        </div>
      </div>
    </div>
  );
}
