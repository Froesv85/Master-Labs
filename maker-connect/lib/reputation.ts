import type { MakerLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Reputacao do maker: soma de sinais de que o trabalho dele foi util para OUTRAS pessoas.
// Acoes do proprio usuario sobre si mesmo (votar no proprio projeto, forkar o proprio)
// nao contam, para nao dar para inflar a nota sozinho.
export const REPUTATION_POINTS = {
  publicProject: 5,    // por projeto publico publicado
  voteReceived: 10,    // por voto recebido de outro usuario
  forkReceived: 15,    // por fork feito por outro usuario
  follower: 5,         // por seguidor
  robotAward: 20,      // por premiacao registrada em robo
} as const;

// Limiar minimo de pontos de cada nivel (do maior para o menor).
export const LEVEL_THRESHOLDS: { level: MakerLevel; min: number }[] = [
  { level: 'grandmaster', min: 1500 },
  { level: 'master', min: 500 },
  { level: 'journeyman', min: 100 },
  { level: 'apprentice', min: 0 },
];

export type ReputationItem = { key: keyof typeof REPUTATION_POINTS; count: number; each: number; points: number };
export type Reputation = {
  total: number;
  level: MakerLevel;
  nextLevel: { level: MakerLevel; min: number } | null;
  breakdown: ReputationItem[];
};

export function levelFor(total: number): MakerLevel {
  return (LEVEL_THRESHOLDS.find((t) => total >= t.min) ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]).level;
}

export async function computeReputation(userId: number): Promise<Reputation> {
  const [publicProject, voteReceived, forkReceived, follower, robotAward] = await Promise.all([
    prisma.project.count({ where: { creatorId: userId, visibility: 'public' } }),
    prisma.projectVote.count({ where: { project: { creatorId: userId }, userId: { not: userId } } }),
    prisma.project.count({ where: { parent: { creatorId: userId }, creatorId: { not: userId } } }),
    prisma.userFollow.count({ where: { followingId: userId } }),
    prisma.robotAward.count({ where: { robot: { ownerId: userId } } }),
  ]);
  const counts = { publicProject, voteReceived, forkReceived, follower, robotAward };

  const breakdown = (Object.keys(REPUTATION_POINTS) as (keyof typeof REPUTATION_POINTS)[]).map((key) => ({
    key,
    count: counts[key],
    each: REPUTATION_POINTS[key],
    points: counts[key] * REPUTATION_POINTS[key],
  }));
  const total = breakdown.reduce((s, b) => s + b.points, 0);
  const level = levelFor(total);
  const next = [...LEVEL_THRESHOLDS].reverse().find((t) => t.min > total) ?? null;

  return { total, level, nextLevel: next, breakdown };
}

// Recalcula e grava em UserProfile (reputation/makerLevel), que outras telas leem
// direto (ex.: lista de membros da equipe). So escreve se mudou.
export async function syncReputation(userId: number): Promise<Reputation> {
  const rep = await computeReputation(userId);
  const current = await prisma.userProfile.findUnique({
    where: { userId },
    select: { reputation: true, makerLevel: true },
  });
  if (!current || current.reputation !== rep.total || current.makerLevel !== rep.level) {
    await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, reputation: rep.total, makerLevel: rep.level },
      update: { reputation: rep.total, makerLevel: rep.level },
    });
  }
  return rep;
}
