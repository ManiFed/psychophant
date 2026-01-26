import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AVAILABLE_MODELS, MAX_AGENTS_PER_CONVERSATION } from '../shared/index.js';

const validModels = AVAILABLE_MODELS.map((m) => m.id);

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  model: z.string().refine((m) => validModels.includes(m as any), {
    message: 'Invalid model',
  }),
  role: z.string().min(1, 'Role is required').max(500),
  systemPrompt: z.string().max(10000).optional(),
  avatarColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
});

const updateAgentSchema = createAgentSchema.partial();

export async function agentRoutes(server: FastifyInstance) {
  // List user's agents
  server.get(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest) => {
      const agents = await prisma.agent.findMany({
        where: { userId: request.user.id },
        orderBy: { createdAt: 'desc' },
      });

      return { agents };
    }
  );

  // Get single agent
  server.get(
    '/:agentId',
    { preHandler: [authenticate] },
    async (
      request: FastifyRequest<{ Params: { agentId: string } }>,
      reply: FastifyReply
    ) => {
      const agent = await prisma.agent.findFirst({
        where: {
          id: request.params.agentId,
          userId: request.user.id,
        },
      });

      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      return { agent };
    }
  );

  // Create agent
  server.post(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createAgentSchema.parse(request.body);

        // Check agent limit (soft limit for now)
        const agentCount = await prisma.agent.count({
          where: { userId: request.user.id },
        });

        if (agentCount >= 50) {
          return reply.status(400).send({
            error: 'Agent limit reached. Please delete some agents.',
          });
        }

        const agent = await prisma.agent.create({
          data: {
            userId: request.user.id,
            name: body.name,
            model: body.model,
            role: body.role,
            systemPrompt: body.systemPrompt,
            avatarColor: body.avatarColor || '#6366f1',
          },
        });

        return { agent };
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

  // Update agent
  server.put(
    '/:agentId',
    { preHandler: [authenticate] },
    async (
      request: FastifyRequest<{ Params: { agentId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const body = updateAgentSchema.parse(request.body);

        // Verify ownership
        const existingAgent = await prisma.agent.findFirst({
          where: {
            id: request.params.agentId,
            userId: request.user.id,
          },
        });

        if (!existingAgent) {
          return reply.status(404).send({ error: 'Agent not found' });
        }

        const agent = await prisma.agent.update({
          where: { id: request.params.agentId },
          data: body,
        });

        return { agent };
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

  // Delete agent
  server.delete(
    '/:agentId',
    { preHandler: [authenticate] },
    async (
      request: FastifyRequest<{ Params: { agentId: string } }>,
      reply: FastifyReply
    ) => {
      // Verify ownership
      const existingAgent = await prisma.agent.findFirst({
        where: {
          id: request.params.agentId,
          userId: request.user.id,
        },
      });

      if (!existingAgent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      // Check if agent is in any active conversations
      const activeParticipation = await prisma.conversationParticipant.findFirst({
        where: {
          agentId: request.params.agentId,
          conversation: {
            status: { in: ['active', 'paused', 'force_agreement'] },
          },
        },
      });

      if (activeParticipation) {
        return reply.status(400).send({
          error: 'Cannot delete agent that is in an active conversation',
        });
      }

      await prisma.agent.delete({
        where: { id: request.params.agentId },
      });

      return { success: true };
    }
  );

  // Clone agent from template
  server.post(
    '/:agentId/clone',
    { preHandler: [authenticate] },
    async (
      request: FastifyRequest<{ Params: { agentId: string } }>,
      reply: FastifyReply
    ) => {
      // Find the source agent (must be a template or user's own)
      const sourceAgent = await prisma.agent.findFirst({
        where: {
          id: request.params.agentId,
          OR: [{ userId: request.user.id }, { isTemplate: true }],
        },
      });

      if (!sourceAgent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      // Create the clone
      const agent = await prisma.agent.create({
        data: {
          userId: request.user.id,
          name: `${sourceAgent.name} (Copy)`,
          model: sourceAgent.model,
          role: sourceAgent.role,
          systemPrompt: sourceAgent.systemPrompt,
          avatarColor: sourceAgent.avatarColor,
        },
      });

      // Increment template uses if applicable
      if (sourceAgent.isTemplate) {
        await prisma.agent.update({
          where: { id: sourceAgent.id },
          data: { templateUses: { increment: 1 } },
        });
      }

      return { agent };
    }
  );
}
