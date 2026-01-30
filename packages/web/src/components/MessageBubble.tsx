'use client';

import { Message, Participant } from '@/lib/api';

interface MessageBubbleProps {
  message: Message;
  participants: Participant[];
  isStreaming?: boolean;
}

export function MessageBubble({ message, participants, isStreaming }: MessageBubbleProps) {
  const participant = participants.find((p) => p.agentId === message.agentId);
  const agent = participant?.agent;

  const isUserMessage = message.role === 'user';
  const isSystemMessage = message.role === 'system';
  const isAgentMessage = message.role === 'agent';

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-6">
        <div className="relative bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/10 px-6 py-3 max-w-2xl">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black px-2 text-[10px] text-white/30 uppercase tracking-widest">
            topic
          </div>
          <p className="text-sm text-white/70 text-center leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isUserMessage) {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[75%] relative">
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-orange-500 flex items-center justify-center text-xs font-bold text-black rounded-full">
                U
              </div>
              <span className="text-xs font-medium text-orange-400">You</span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <div className="absolute top-3 -right-2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-orange-500/20" />
        </div>
      </div>
    );
  }

  if (isAgentMessage && agent) {
    const agentColor = agent.avatarColor || '#f97316';

    return (
      <div className="flex mb-5 group">
        <div className="max-w-[80%] relative">
          {/* Colored accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
            style={{ backgroundColor: agentColor }}
          />
          <div className="pl-4">
            {/* Agent header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-8 h-8 flex items-center justify-center text-sm font-bold rounded-full overflow-hidden flex-shrink-0 shadow-lg"
                style={{ backgroundColor: agent.avatarUrl ? 'transparent' : agentColor }}
              >
                {agent.avatarUrl ? (
                  <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-black/80">{agent.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold" style={{ color: agentColor }}>
                  {agent.name}
                </span>
                {message.modelUsed && (
                  <span className="text-[10px] text-white/30">
                    {message.modelUsed.split('/').pop()}
                  </span>
                )}
              </div>
            </div>

            {/* Message content */}
            <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-sm">
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-white/90">
                {message.content}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-orange-500 animate-pulse rounded-sm" />
                )}
              </p>
            </div>

            {/* Token stats - show on hover */}
            {message.costCents > 0 && (
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                {message.inputTokens && message.outputTokens && (
                  <span>{message.inputTokens.toLocaleString()} in / {message.outputTokens.toLocaleString()} out</span>
                )}
                <span>${(message.costCents / 100).toFixed(4)}</span>
                {message.generationTimeMs && <span>{(message.generationTimeMs / 1000).toFixed(1)}s</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex mb-4">
      <div className="max-w-[80%] bg-white/5 border border-white/10 p-4 rounded-sm">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: Message[];
  participants: Participant[];
  streamingMessageId?: string | null;
}

export function MessageList({ messages, participants, streamingMessageId }: MessageListProps) {
  return (
    <div className="space-y-1">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          participants={participants}
          isStreaming={message.id === streamingMessageId}
        />
      ))}
    </div>
  );
}
