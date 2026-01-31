import { prisma } from './prisma.js';

export async function getAgentWinLoss(agentId: string) {
  const [conversationWins, conversationLosses, arenaWins, arenaLosses] = await Promise.all([
    prisma.conversationVote.count({ where: { winnerAgentId: agentId } }),
    prisma.conversationVote.count({
      where: {
        winnerAgentId: { not: agentId },
        conversation: { participants: { some: { agentId } } },
      },
    }),
    prisma.arenaVote.count({ where: { winnerAgentId: agentId } }),
    prisma.arenaVote.count({
      where: {
        winnerAgentId: { not: agentId },
        arenaRoom: { participants: { some: { agentId } } },
      },
    }),
  ]);

  return {
    wins: conversationWins + arenaWins,
    losses: conversationLosses + arenaLosses,
  };
}

export async function getUserArenaWinLoss(userId: string) {
  const [wins, losses] = await Promise.all([
    prisma.arenaVote.count({
      where: { winnerAgent: { userId } },
    }),
    prisma.arenaVote.count({
      where: {
        arenaRoom: { participants: { some: { userId } } },
        winnerAgent: { userId: { not: userId } },
      },
    }),
  ]);

  return { wins, losses };
}
