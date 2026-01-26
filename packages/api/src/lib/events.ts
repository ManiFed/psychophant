import { redis } from './redis.js';
import { SSEEventType } from '../shared/index.js';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: string;
}

// Publish events to Redis pub/sub for SSE distribution
export async function publishEvent<T>(
  conversationId: string,
  event: Omit<SSEEvent<T>, 'timestamp'>
): Promise<void> {
  const channel = `conversation:${conversationId}`;
  const fullEvent: SSEEvent<T> = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  await redis.publish(channel, JSON.stringify(fullEvent));
}

// Publish credit update to all user's active conversations
export async function publishCreditUpdate(
  userId: string,
  credits: { freeCents: number; purchasedCents: number; totalCents: number }
): Promise<void> {
  const channel = `user:${userId}:credits`;
  const event: SSEEvent = {
    type: SSEEventType.CREDIT_UPDATE,
    data: credits,
    timestamp: new Date().toISOString(),
  };
  await redis.publish(channel, JSON.stringify(event));
}

// Helper to create common events
export const events = {
  messageStart(agentId: string, messageId: string) {
    return {
      type: SSEEventType.MESSAGE_START as const,
      data: { agentId, messageId },
    };
  },

  messageToken(messageId: string, token: string, tokenIndex: number) {
    return {
      type: SSEEventType.MESSAGE_TOKEN as const,
      data: { messageId, token, tokenIndex },
    };
  },

  messageComplete(
    messageId: string,
    fullContent: string,
    inputTokens: number,
    outputTokens: number,
    costCents: number
  ) {
    return {
      type: SSEEventType.MESSAGE_COMPLETE as const,
      data: { messageId, fullContent, inputTokens, outputTokens, costCents },
    };
  },

  turnChange(nextAgentId: string, agentName: string, round: number) {
    return {
      type: SSEEventType.TURN_CHANGE as const,
      data: { nextAgentId, agentName, round },
    };
  },

  roundComplete(roundNumber: number) {
    return {
      type: SSEEventType.ROUND_COMPLETE as const,
      data: { roundNumber },
    };
  },

  conversationComplete(totalCostCents: number, summary?: string) {
    return {
      type: SSEEventType.CONVERSATION_COMPLETE as const,
      data: { totalCostCents, summary },
    };
  },

  forceAgreementPhase(
    phase: number,
    phaseLabel: string,
    description: string,
    extraData?: Record<string, unknown>
  ) {
    return {
      type: SSEEventType.FORCE_AGREEMENT_PHASE as const,
      data: { phase, phaseLabel, description, ...extraData },
    };
  },

  coalitionDetected(agentIds: string[], topic: string) {
    return {
      type: SSEEventType.COALITION_DETECTED as const,
      data: { agentIds, topic },
    };
  },

  creditUpdate(freeCents: number, purchasedCents: number) {
    return {
      type: SSEEventType.CREDIT_UPDATE as const,
      data: { freeCents, purchasedCents, totalCents: freeCents + purchasedCents },
    };
  },

  error(code: string, message: string) {
    return {
      type: SSEEventType.ERROR as const,
      data: { code, message },
    };
  },
};
