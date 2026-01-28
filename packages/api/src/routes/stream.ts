import { FastifyInstance, RouteGenericInterface } from 'fastify';
import Redis from 'ioredis';
import { prisma } from '../lib/prisma.js';

interface StreamParams extends RouteGenericInterface {
  Params: { conversationId: string };
  Querystring: { token?: string };
}

// Get allowed origins for CORS
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  if (process.env.WEB_URL) {
    origins.push(process.env.WEB_URL);
  }
  if (process.env.APP_URL) {
    origins.push(process.env.APP_URL);
  }

  // Always allow the Railway production web domain
  origins.push('https://psychophantweb-production.up.railway.app');

  // Development origins
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
  }

  return origins;
}

function getCorsOrigin(requestOrigin: string | undefined): string | null {
  const allowed = getAllowedOrigins();
  if (requestOrigin && allowed.includes(requestOrigin)) {
    return requestOrigin;
  }
  // Return first allowed origin as fallback for SSE (no Origin header in EventSource)
  return allowed[0] || null;
}

export async function streamRoutes(server: FastifyInstance) {
  // SSE streaming endpoint for conversation updates
  // Note: EventSource doesn't support custom headers, so we accept token via query param
  server.get<StreamParams>(
    '/:conversationId/stream',
    async (request, reply) => {
      const { conversationId } = request.params;
      const { token } = request.query;

      // Authenticate via query param token (since EventSource can't send headers)
      let userId: string;
      try {
        if (!token) {
          return reply.status(401).send({ error: 'Token required' });
        }
        const decoded = server.jwt.verify<{ id: string }>(token);
        userId = decoded.id;
      } catch {
        return reply.status(401).send({ error: 'Invalid token' });
      }

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

      // Get CORS origin
      const origin = request.headers.origin;
      const corsOrigin = getCorsOrigin(origin);

      // Check if Redis is available
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        // Fall back to polling mode - just send connected event
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          'Access-Control-Allow-Origin': corsOrigin || '*',
          'Access-Control-Allow-Credentials': 'true',
        });

        reply.raw.write(
          `data: ${JSON.stringify({ type: 'connected', conversationId, mode: 'polling' })}\n\n`
        );

        // Heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          reply.raw.write(': heartbeat\n\n');
        }, 30000);

        request.raw.on('close', () => {
          clearInterval(heartbeat);
        });

        return;
      }

      // Set up SSE headers with CORS
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Access-Control-Allow-Origin': corsOrigin || '*',
        'Access-Control-Allow-Credentials': 'true',
      });

      // Subscribe to Redis pub/sub for this conversation
      // @ts-expect-error - ioredis types are complex with ESM
      const subscriber = new Redis(redisUrl);
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
