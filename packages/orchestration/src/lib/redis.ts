import RedisLib from 'ioredis';

const Redis = RedisLib.default || RedisLib;

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Publisher instance for events
export const publisher = new Redis(redisUrl);

// Helper functions
export const redisHelpers = {
  async getSessionState(conversationId: string) {
    const data = await redis.hgetall(`session:${conversationId}`);
    if (!data.status) return null;
    return {
      status: data.status as 'active' | 'paused' | 'generating' | 'force_agreement',
      currentAgentId: data.currentAgentId || null,
      currentRound: parseInt(data.currentRound || '1', 10),
      pendingInterjection: data.pendingInterjection || null,
      forceAgreementPhase: data.forceAgreementPhase
        ? parseInt(data.forceAgreementPhase, 10)
        : null,
      lockedAt: data.lockedAt || null,
    };
  },

  async setSessionState(
    conversationId: string,
    state: {
      status?: string;
      currentAgentId?: string | null;
      currentRound?: number;
      pendingInterjection?: string | null;
      forceAgreementPhase?: number | null;
    }
  ) {
    const data: Record<string, string> = {};
    if (state.status !== undefined) data.status = state.status;
    if (state.currentAgentId !== undefined) data.currentAgentId = state.currentAgentId || '';
    if (state.currentRound !== undefined) data.currentRound = state.currentRound.toString();
    if (state.pendingInterjection !== undefined) data.pendingInterjection = state.pendingInterjection || '';
    if (state.forceAgreementPhase !== undefined) data.forceAgreementPhase = state.forceAgreementPhase?.toString() || '';

    await redis.hset(`session:${conversationId}`, data);
    await redis.expire(`session:${conversationId}`, 86400);
  },

  async acquireLock(key: string, ttlSeconds: number = 60): Promise<boolean> {
    const result = await redis.set(`lock:${key}`, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  },

  async releaseLock(key: string): Promise<void> {
    await redis.del(`lock:${key}`);
  },

  async invalidateCreditCache(userId: string) {
    await redis.del(`credits:${userId}`);
  },
};
