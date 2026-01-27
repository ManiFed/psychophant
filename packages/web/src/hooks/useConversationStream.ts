'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useConversationsStore } from '@/stores/conversations';
import { useCreditsStore } from '@/stores/credits';
import { Message } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface StreamEvent {
  type: string;
  [key: string]: unknown;
}

interface MessageStartEvent extends StreamEvent {
  type: 'message:start';
  agentId: string;
  messageId: string;
}

interface MessageTokenEvent extends StreamEvent {
  type: 'message:token';
  messageId: string;
  token: string;
  tokenIndex: number;
}

interface MessageCompleteEvent extends StreamEvent {
  type: 'message:complete';
  messageId: string;
  content: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
}

interface TurnChangeEvent extends StreamEvent {
  type: 'turn:change';
  agentId: string;
  agentName: string;
  round: number;
}

interface RoundCompleteEvent extends StreamEvent {
  type: 'round:complete';
  round: number;
}

interface ConversationCompleteEvent extends StreamEvent {
  type: 'conversation:complete';
  totalCostCents: number;
}

interface CreditUpdateEvent extends StreamEvent {
  type: 'credit:update';
  freeCents: number;
  purchasedCents: number;
  totalCents: number;
}

interface ErrorEvent extends StreamEvent {
  type: 'error';
  code: string;
  message: string;
}

type ConversationEvent =
  | MessageStartEvent
  | MessageTokenEvent
  | MessageCompleteEvent
  | TurnChangeEvent
  | RoundCompleteEvent
  | ConversationCompleteEvent
  | CreditUpdateEvent
  | ErrorEvent;

interface StreamingMessage {
  id: string;
  agentId: string;
  content: string;
  isStreaming: boolean;
}

interface UseConversationStreamOptions {
  conversationId: string | null;
  onMessageStart?: (agentId: string, messageId: string) => void;
  onMessageToken?: (messageId: string, token: string) => void;
  onMessageComplete?: (messageId: string, content: string) => void;
  onTurnChange?: (agentId: string, agentName: string, round: number) => void;
  onRoundComplete?: (round: number) => void;
  onConversationComplete?: (totalCostCents: number) => void;
  onError?: (code: string, message: string) => void;
}

export function useConversationStream({
  conversationId,
  onMessageStart,
  onMessageToken,
  onMessageComplete,
  onTurnChange,
  onRoundComplete,
  onConversationComplete,
  onError,
}: UseConversationStreamOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingMessageRef = useRef<StreamingMessage | null>(null);

  const { token } = useAuthStore();
  const { addMessage, updateMessage, updateConversationStatus, participants } = useConversationsStore();
  const { fetchBalance } = useCreditsStore();

  const handleEvent = useCallback(
    (event: ConversationEvent) => {
      switch (event.type) {
        case 'message:start': {
          const e = event as MessageStartEvent;
          // Create a placeholder message
          const participant = participants.find((p) => p.agentId === e.agentId);
          const newMessage: Message = {
            id: e.messageId,
            conversationId: conversationId!,
            agentId: e.agentId,
            userId: null,
            content: '',
            role: 'agent',
            roundNumber: null,
            modelUsed: participant?.agent.model || null,
            inputTokens: null,
            outputTokens: null,
            costCents: 0,
            generationTimeMs: null,
            messageType: 'standard',
            createdAt: new Date().toISOString(),
          };
          addMessage(newMessage);
          streamingMessageRef.current = {
            id: e.messageId,
            agentId: e.agentId,
            content: '',
            isStreaming: true,
          };
          onMessageStart?.(e.agentId, e.messageId);
          break;
        }

        case 'message:token': {
          const e = event as MessageTokenEvent;
          if (streamingMessageRef.current?.id === e.messageId) {
            streamingMessageRef.current.content += e.token;
            updateMessage(e.messageId, { content: streamingMessageRef.current.content });
          }
          onMessageToken?.(e.messageId, e.token);
          break;
        }

        case 'message:complete': {
          const e = event as MessageCompleteEvent;
          updateMessage(e.messageId, {
            content: e.content,
            inputTokens: e.inputTokens,
            outputTokens: e.outputTokens,
            costCents: e.costCents,
          });
          streamingMessageRef.current = null;
          onMessageComplete?.(e.messageId, e.content);
          break;
        }

        case 'turn:change': {
          const e = event as TurnChangeEvent;
          onTurnChange?.(e.agentId, e.agentName, e.round);
          break;
        }

        case 'round:complete': {
          const e = event as RoundCompleteEvent;
          onRoundComplete?.(e.round);
          break;
        }

        case 'conversation:complete': {
          const e = event as ConversationCompleteEvent;
          updateConversationStatus('completed');
          onConversationComplete?.(e.totalCostCents);
          break;
        }

        case 'credit:update': {
          // Refresh credit balance
          fetchBalance();
          break;
        }

        case 'error': {
          const e = event as ErrorEvent;
          onError?.(e.code, e.message);
          if (e.code === 'INSUFFICIENT_CREDITS') {
            updateConversationStatus('paused');
          }
          break;
        }
      }
    },
    [
      conversationId,
      participants,
      addMessage,
      updateMessage,
      updateConversationStatus,
      fetchBalance,
      onMessageStart,
      onMessageToken,
      onMessageComplete,
      onTurnChange,
      onRoundComplete,
      onConversationComplete,
      onError,
    ]
  );

  const connect = useCallback(() => {
    if (!conversationId || !token) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new EventSource with auth token in URL (SSE doesn't support headers)
    const url = `${API_URL}/api/conversations/${conversationId}/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ConversationEvent;
        handleEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
      // EventSource will automatically reconnect
    };

    eventSourceRef.current = eventSource;
  }, [conversationId, token, handleEvent]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Auto-connect when conversationId changes
  useEffect(() => {
    if (conversationId && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [conversationId, token, connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    streamingMessage: streamingMessageRef.current,
  };
}
