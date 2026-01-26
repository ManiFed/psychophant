import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// @ts-expect-error - ioredis types are complex with ESM
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('error', (err: Error) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

// Helper functions for common Redis operations
export const redisHelpers = {
  // Credit cache
  async getCachedCredits(userId: string) {
    const data = await redis.hgetall(`credits:${userId}`);
    if (!data.free) return null;
    return {
      freeCents: parseInt(data.free, 10),
      purchasedCents: parseInt(data.purchased, 10),
      lastFreeReset: new Date(data.lastReset),
    };
  },

  async setCachedCredits(
    userId: string,
    freeCents: number,
    purchasedCents: number,
    lastFreeReset: Date
  ) {
    await redis.hset(`credits:${userId}`, {
      free: freeCents.toString(),
      purchased: purchasedCents.toString(),
      lastReset: lastFreeReset.toISOString(),
    });
    await redis.expire(`credits:${userId}`, 60); // 60 second TTL
  },

  async invalidateCreditCache(userId: string) {
    await redis.del(`credits:${userId}`);
  },

  // Session state
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
      status: string;
      currentAgentId?: string | null;
      currentRound?: number;
      pendingInterjection?: string | null;
      forceAgreementPhase?: number | null;
    }
  ) {
    const data: Record<string, string> = {
      status: state.status,
    };
    if (state.currentAgentId !== undefined) {
      data.currentAgentId = state.currentAgentId || '';
    }
    if (state.currentRound !== undefined) {
      data.currentRound = state.currentRound.toString();
    }
    if (state.pendingInterjection !== undefined) {
      data.pendingInterjection = state.pendingInterjection || '';
    }
    if (state.forceAgreementPhase !== undefined) {
      data.forceAgreementPhase = state.forceAgreementPhase?.toString() || '';
    }

    await redis.hset(`session:${conversationId}`, data);
    await redis.expire(`session:${conversationId}`, 86400); // 24 hour TTL
  },

  async deleteSessionState(conversationId: string) {
    await redis.del(`session:${conversationId}`);
  },

  // Distributed locking
  async acquireLock(key: string, ttlSeconds: number = 60): Promise<boolean> {
    const result = await redis.set(`lock:${key}`, '1', 'NX', 'EX', ttlSeconds);
    return result === 'OK';
  },

  async releaseLock(key: string): Promise<void> {
    await redis.del(`lock:${key}`);
  },
};
