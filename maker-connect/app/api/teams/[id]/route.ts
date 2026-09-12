import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = parseInt(id);
  if (isNaN(teamId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: { select: { makerLevel: true, reputation: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      robots: {
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          eloScore: true,
          imageUrl: true,
          images: { take: 1, orderBy: { position: 'asc' }, select: { imageUrl: true } },
          _count: { select: { matches: true } },
        },
        orderBy: { eloScore: 'desc' },
      },
    },
  });

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  return NextResponse.json(team);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
  if (!team) return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 });
  if (team.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Apenas o dono pode excluir a equipe' }, { status: 403 });
  }

  await prisma.$transaction([
    // Robos e projetos ficam soltos (sem equipe) em vez de serem apagados junto.
    // Projetos de visibilidade "so a equipe" perderiam todo acesso sem a equipe,
    // entao viram "so eu" pra continuarem acessiveis pelo dono.
    prisma.project.updateMany({ where: { teamId, visibility: 'private_team' }, data: { teamId: null, visibility: 'private_owner' } }),
    prisma.project.updateMany({ where: { teamId }, data: { teamId: null } }),
    prisma.robot.updateMany({ where: { teamId }, data: { teamId: null } }),
    prisma.competition.deleteMany({ where: { teamId } }),
    prisma.teamMember.deleteMany({ where: { teamId } }),
    prisma.team.delete({ where: { id: teamId } }),
  ]);

  return NextResponse.json({ ok: true });
}
