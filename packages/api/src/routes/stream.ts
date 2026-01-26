import { FastifyInstance, FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import Redis from 'ioredis';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

interface StreamParams extends RouteGenericInterface {
  Params: { conversationId: string };
}

export async function streamRoutes(server: FastifyInstance) {
  // SSE streaming endpoint for conversation updates
  server.get<StreamParams>(
    '/:conversationId/stream',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { conversationId } = request.params;
      const userId = request.user.id;

      // Verify user owns this conversation or it's public
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ userId }, { isPublic: true }],
        },
      });

      if (!conversation) {
        return reply.status(404).send({ error: 'Conversation not found' });
      }

      // Set up SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      });

      // Subscribe to Redis pub/sub for this conversation
      // @ts-expect-error - ioredis types are complex with ESM
      const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      const conversationChannel = `conversation:${conversationId}`;
      const userCreditsChannel = `user:${userId}:credits`;

      await subscriber.subscribe(conversationChannel, userCreditsChannel);

      // Send initial connection event
      reply.raw.write(
        `data: ${JSON.stringify({ type: 'connected', conversationId })}\n\n`
      );

      // Handle incoming messages from Redis
      subscriber.on('message', (channel: string, message: string) => {
        if (channel === conversationChannel || channel === userCreditsChannel) {
          reply.raw.write(`data: ${message}\n\n`);
        }
      });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        reply.raw.write(': heartbeat\n\n');
      }, 30000);

      // Cleanup on disconnect
      request.raw.on('close', () => {
        clearInterval(heartbeat);
        subscriber.unsubscribe(conversationChannel, userCreditsChannel);
        subscriber.quit();
      });

      // Don't end the response - keep it open for streaming
      // The reply will be ended when the client disconnects
    }
  );
}
