import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id]/connections?type=followers|following
// Lista quem segue / quem e seguido por esse maker. Select explicito: so dados publicos
// de perfil (sem e-mail, role, ids de OAuth). `followedByMe` diz se quem esta vendo
// ja segue cada pessoa da lista, para o botao Seguir na propria lista.
const USER_CARD = {
  id: true,
  name: true,
  profile: { select: { avatarUrl: true, makerLevel: true, reputation: true } },
} as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }
  const type = req.nextUrl.searchParams.get('type');
  if (type !== 'followers' && type !== 'following') {
    return NextResponse.json({ error: 'type deve ser followers ou following.' }, { status: 400 });
  }

  const rows = type === 'followers'
    ? (await prisma.userFollow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { createdAt: true, follower: { select: USER_CARD } },
      })).map((r) => ({ since: r.createdAt, user: r.follower }))
    : (await prisma.userFollow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { createdAt: true, following: { select: USER_CARD } },
      })).map((r) => ({ since: r.createdAt, user: r.following }));

  const mine = rows.length
    ? await prisma.userFollow.findMany({
        where: { followerId: session.userId, followingId: { in: rows.map((r) => r.user.id) } },
        select: { followingId: true },
      })
    : [];
  const mineSet = new Set(mine.map((m) => m.followingId));

  return NextResponse.json(
    rows.map((r) => ({ ...r, followedByMe: mineSet.has(r.user.id), isMe: r.user.id === session.userId })),
  );
}
