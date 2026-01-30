import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ArenaStreamCallbacks {
  onParticipantJoined?: (data: { participant: unknown }) => void;
  onParticipantReady?: (data: { participantId: string; userId: string; isReady: boolean }) => void;
  onArenaStarted?: (data: { conversationId: string }) => void;
  onInstruction?: (data: { userId: string; agentId: string; content: string }) => void;
  // Conversation events (once arena starts)
  onMessageStart?: (data: { agentId: string; messageId: string }) => void;
  onMessageToken?: (data: { messageId: string; token: string; tokenIndex: number }) => void;
  onMessageComplete?: (data: { messageId: string; fullContent: string; inputTokens: number; outputTokens: number; costCents: number }) => void;
  onTurnChange?: (data: { nextAgentId: string; agentName: string; round: number }) => void;
  onRoundComplete?: (data: { roundNumber: number }) => void;
  onConversationComplete?: (data: { totalCostCents: number }) => void;
  onWaitingForInput?: (data: { roundNumber: number }) => void;
  onError?: (data: { code: string; message: string }) => void;
}

export function useArenaStream(
  arenaId: string | null,
  callbacks: ArenaStreamCallbacks
) {
  const token = useAuthStore((s) => s.token);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!arenaId || !token) return;

    const url = `${API_URL}/api/arena/${arenaId}/stream?token=${token}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const cb = callbacksRef.current;

        switch (parsed.type) {
          case 'arena:participant_joined':
            cb.onParticipantJoined?.(parsed.data);
            break;
          case 'arena:participant_ready':
            cb.onParticipantReady?.(parsed.data);
            break;
          case 'arena:started':
            cb.onArenaStarted?.(parsed.data);
            break;
          case 'arena:instruction':
            cb.onInstruction?.(parsed.data);
            break;
          case 'message:start':
            cb.onMessageStart?.(parsed.data);
            break;
          case 'message:token':
            cb.onMessageToken?.(parsed.data);
            break;
          case 'message:complete':
            cb.onMessageComplete?.(parsed.data);
            break;
          case 'turn:change':
            cb.onTurnChange?.(parsed.data);
            break;
          case 'round:complete':
            cb.onRoundComplete?.(parsed.data);
            break;
          case 'conversation:complete':
            cb.onConversationComplete?.(parsed.data);
            break;
          case 'waiting:input':
            cb.onWaitingForInput?.(parsed.data);
            break;
          case 'error':
            cb.onError?.(parsed.data);
            break;
        }
      } catch {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    eventSource.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [arenaId, token]);
}
