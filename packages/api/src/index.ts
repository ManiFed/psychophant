import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { agentRoutes } from './routes/agents.js';
import { conversationRoutes } from './routes/conversations.js';
import { creditRoutes } from './routes/credits.js';
import { streamRoutes } from './routes/stream.js';

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  },
});

// CORS configuration
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Production web URL
  if (process.env.WEB_URL) {
    origins.push(process.env.WEB_URL);
  }

  // Legacy APP_URL support
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

  return [...new Set(origins)]; // Deduplicate
};

// Register plugins
await server.register(cors, {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await server.register(jwt, {
  secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  sign: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
});

// Declare JWT user type
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
    };
  }
}

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await server.register(authRoutes, { prefix: '/api/auth' });
await server.register(agentRoutes, { prefix: '/api/agents' });
await server.register(conversationRoutes, { prefix: '/api/conversations' });
await server.register(creditRoutes, { prefix: '/api/credits' });
await server.register(streamRoutes, { prefix: '/api/conversations' });

// Start server
const port = parseInt(process.env.PORT || '3001', 10);
const host = process.env.HOST || '0.0.0.0';

try {
  await server.listen({ port, host });
  console.log(`Server running at http://${host}:${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    await server.close();
    process.exit(0);
  });
}
