import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const communityId = parseInt(id);
  if (isNaN(communityId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      creator: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      posts: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });
  return NextResponse.json(community);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const communityId = Number(id);
  if (!Number.isInteger(communityId) || communityId <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const community = await prisma.community.findUnique({ where: { id: communityId }, select: { creatorId: true } });
  if (!community) return NextResponse.json({ error: 'Comunidade não encontrada' }, { status: 404 });
  if (community.creatorId !== session.userId) {
    return NextResponse.json({ error: 'Apenas o fundador pode excluir a comunidade' }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.communityPost.deleteMany({ where: { communityId } }),
    prisma.communityMember.deleteMany({ where: { communityId } }),
    prisma.community.delete({ where: { id: communityId } }),
  ]);

  return NextResponse.json({ ok: true });
}
