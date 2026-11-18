import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS, tooManyRequests } from '@/lib/rate-limit';
import { syncReputation } from '@/lib/reputation';

type Ctx = { params: Promise<{ id: string }> };

// Quem segue e sempre o usuario da sessao (nunca um id vindo do corpo).
async function resolve(ctx: Ctx) {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) };

  const { id } = await ctx.params;
  const targetId = Number(id);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return { error: NextResponse.json({ error: 'ID inválido.' }, { status: 400 }) };
  }
  if (targetId === session.userId) {
    return { error: NextResponse.json({ error: 'Você não pode seguir a si mesmo.' }, { status: 400 }) };
  }

  const limit = await checkRateLimit(RATE_LIMITS.followByUser, String(session.userId));
  if (!limit.allowed) return { error: tooManyRequests(limit.retryAfterSeconds) };

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) return { error: NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 }) };

  return { followerId: session.userId, followingId: targetId };
}

async function respond(followingId: number, following: boolean) {
  const [followers, rep] = await Promise.all([
    prisma.userFollow.count({ where: { followingId } }),
    syncReputation(followingId),
  ]);
  return NextResponse.json({ following, followers, reputation: rep.total, makerLevel: rep.level });
}

export async function POST(_req: NextRequest, ctx: Ctx) {
  const r = await resolve(ctx);
  if ('error' in r) return r.error;
  // upsert: seguir duas vezes e idempotente (sem erro de unique)
  await prisma.userFollow.upsert({
    where: { followerId_followingId: { followerId: r.followerId, followingId: r.followingId } },
    create: { followerId: r.followerId, followingId: r.followingId },
    update: {},
  });
  return respond(r.followingId, true);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const r = await resolve(ctx);
  if ('error' in r) return r.error;
  await prisma.userFollow.deleteMany({ where: { followerId: r.followerId, followingId: r.followingId } });
  return respond(r.followingId, false);
}
