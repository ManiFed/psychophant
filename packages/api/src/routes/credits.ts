import { FastifyInstance, FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { redisHelpers } from '../lib/redis.js';
import {
  DAILY_FREE_CREDITS_CENTS,
  CREDIT_PACKAGES,
  CreditPackageId,
} from '@psychophant/shared';

interface TransactionsQuery extends RouteGenericInterface {
  Querystring: { limit?: string; offset?: string };
}

type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const purchaseSchema = z.object({
  packageId: z.enum(['pack_100', 'pack_500', 'pack_2000', 'pack_5000'] as const),
});

export async function creditRoutes(server: FastifyInstance) {
  // Get balance
  server.get(
    '/balance',
    { preHandler: [authenticate] },
    async (request: FastifyRequest) => {
      const userId = request.user.id;

      // Check cache first
      const cached = await redisHelpers.getCachedCredits(userId);

      // Get or create balance
      let balance = await prisma.creditBalance.findUnique({
        where: { userId },
      });

      if (!balance) {
        balance = await prisma.creditBalance.create({
          data: {
            userId,
            freeCreditsCents: DAILY_FREE_CREDITS_CENTS,
            purchasedCreditsCents: 0,
          },
        });
      }

      // Check if daily reset is needed
      const now = new Date();
      const lastReset = new Date(balance.lastFreeReset);
      const todayMidnightUTC = new Date(now);
      todayMidnightUTC.setUTCHours(0, 0, 0, 0);

      const lastResetDay = new Date(lastReset);
      lastResetDay.setUTCHours(0, 0, 0, 0);

      if (todayMidnightUTC > lastResetDay) {
        // Reset free credits
        balance = await prisma.creditBalance.update({
          where: { userId },
          data: {
            freeCreditsCents: DAILY_FREE_CREDITS_CENTS,
            lastFreeReset: now,
          },
        });

        // Log the reset
        await prisma.creditTransaction.create({
          data: {
            userId,
            amountCents: DAILY_FREE_CREDITS_CENTS,
            transactionType: 'daily_reset',
            sourceType: 'free',
            description: 'Daily free credit reset',
            balanceAfterCents:
              balance.freeCreditsCents + balance.purchasedCreditsCents,
          },
        });
      }

      // Update cache
      await redisHelpers.setCachedCredits(
        userId,
        balance.freeCreditsCents,
        balance.purchasedCreditsCents,
        balance.lastFreeReset
      );

      return {
        freeCents: balance.freeCreditsCents,
        purchasedCents: balance.purchasedCreditsCents,
        totalCents: balance.freeCreditsCents + balance.purchasedCreditsCents,
        lastFreeReset: balance.lastFreeReset.toISOString(),
      };
    }
  );

  // Get transactions
  server.get<TransactionsQuery>(
    '/transactions',
    { preHandler: [authenticate] },
    async (request) => {
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
      const offset = parseInt(request.query.offset || '0', 10);

      const [transactions, total] = await Promise.all([
        prisma.creditTransaction.findMany({
          where: { userId: request.user.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.creditTransaction.count({
          where: { userId: request.user.id },
        }),
      ]);

      return { transactions, total };
    }
  );

  // Purchase credits (returns Stripe client secret)
  // Note: Stripe integration would need additional setup
  server.post(
    '/purchase',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = purchaseSchema.parse(request.body);
        const pack = CREDIT_PACKAGES[body.packageId];

        if (!pack) {
          return reply.status(400).send({ error: 'Invalid package' });
        }

        // TODO: Integrate with Stripe
        // For now, return a placeholder response
        // In production, this would create a Stripe PaymentIntent

        return reply.status(501).send({
          error: 'Stripe integration not yet implemented',
          package: pack,
        });

        // Production implementation would be:
        // 1. Get or create Stripe customer
        // 2. Create PaymentIntent
        // 3. Return client secret
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: err.errors,
          });
        }
        throw err;
      }
    }
  );

  // Stripe webhook (for payment confirmation)
  server.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implement Stripe webhook handling
    // This would:
    // 1. Verify webhook signature
    // 2. Handle payment_intent.succeeded event
    // 3. Add credits to user's balance
    // 4. Create credit transaction record

    return reply.status(501).send({
      error: 'Stripe webhook not yet implemented',
    });
  });

  // Get available packages
  server.get('/packages', async () => {
    const packages = Object.entries(CREDIT_PACKAGES).map(([id, pack]) => ({
      id,
      ...pack,
    }));

    return { packages };
  });
}

// Helper function for deducting credits (used by orchestration)
export async function deductCredits(
  userId: string,
  amountCents: number,
  referenceId: string
): Promise<{
  freeCents: number;
  purchasedCents: number;
  totalCents: number;
}> {
  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    const balance = await tx.creditBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      throw new Error('Balance not found');
    }

    const totalAvailable =
      balance.freeCreditsCents + balance.purchasedCreditsCents;

    if (totalAvailable < amountCents) {
      throw new Error('Insufficient credits');
    }

    // Deduct from free credits first, then purchased
    let newFree = balance.freeCreditsCents;
    let newPurchased = balance.purchasedCreditsCents;
    let remaining = amountCents;
    let sourceType: string;

    if (newFree >= remaining) {
      newFree -= remaining;
      sourceType = 'free';
    } else {
      remaining -= newFree;
      newFree = 0;
      newPurchased -= remaining;
      sourceType = balance.freeCreditsCents > 0 ? 'mixed' : 'purchased';
    }

    const updated = await tx.creditBalance.update({
      where: { userId },
      data: {
        freeCreditsCents: newFree,
        purchasedCreditsCents: newPurchased,
      },
    });

    // Record transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        amountCents: -amountCents,
        transactionType: 'usage',
        sourceType,
        referenceId,
        description: 'Message generation',
        balanceAfterCents: newFree + newPurchased,
      },
    });

    return updated;
  });

  // Invalidate cache
  await redisHelpers.invalidateCreditCache(userId);

  return {
    freeCents: result.freeCreditsCents,
    purchasedCents: result.purchasedCreditsCents,
    totalCents: result.freeCreditsCents + result.purchasedCreditsCents,
  };
}

// Helper to check if user has sufficient credits
export async function checkSufficientCredits(
  userId: string,
  minimumCents: number = 1
): Promise<boolean> {
  const cached = await redisHelpers.getCachedCredits(userId);

  if (cached) {
    return cached.freeCents + cached.purchasedCents >= minimumCents;
  }

  const balance = await prisma.creditBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    return false;
  }

  return (
    balance.freeCreditsCents + balance.purchasedCreditsCents >= minimumCents
  );
}
