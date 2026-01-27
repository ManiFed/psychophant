'use client';

import { Message, Participant } from '@/lib/api';

interface MessageBubbleProps {
  message: Message;
  participants: Participant[];
  isStreaming?: boolean;
}

export function MessageBubble({ message, participants, isStreaming }: MessageBubbleProps) {
  // Find the agent for this message
  const participant = participants.find((p) => p.agentId === message.agentId);
  const agent = participant?.agent;

  // Determine message type styling
  const isUserMessage = message.role === 'user';
  const isSystemMessage = message.role === 'system';
  const isAgentMessage = message.role === 'agent';

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-white/5 border border-white/10 px-4 py-2 max-w-2xl">
          <p className="text-xs text-white/50 text-center">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isUserMessage) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-orange-500/10 border border-orange-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-orange-500 flex items-center justify-center text-xs font-bold text-black">
              U
            </div>
            <span className="text-xs text-orange-400">You</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isAgentMessage && agent) {
    return (
      <div className="flex mb-4">
        <div className="max-w-[80%] bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 flex items-center justify-center text-xs font-bold overflow-hidden"
              style={{ backgroundColor: agent.avatarUrl ? 'transparent' : agent.avatarColor }}
            >
              {agent.avatarUrl ? (
                <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
              ) : (
                agent.name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-xs text-white/70">{agent.name}</span>
            {message.modelUsed && (
              <span className="text-xs text-white/30 ml-auto">
                {message.modelUsed.split('/').pop()}
              </span>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-orange-500 animate-pulse" />
            )}
          </p>
          {message.costCents > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-4 text-xs text-white/30">
              {message.inputTokens && message.outputTokens && (
                <span>
                  {message.inputTokens} in / {message.outputTokens} out
                </span>
              )}
              <span>${(message.costCents / 100).toFixed(4)}</span>
              {message.generationTimeMs && <span>{(message.generationTimeMs / 1000).toFixed(1)}s</span>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for other message types
  return (
    <div className="flex mb-4">
      <div className="max-w-[80%] bg-white/5 border border-white/10 p-4">
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
    <div className="space-y-2">
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
