import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string; competitionId: string }> };

function parseId(value: string) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function requireManager(teamId: number, userId: number) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  return !!membership && ['owner', 'admin'].includes(membership.role);
}

// PATCH — update a competition and/or publish its result (owner/admin only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id, competitionId: competitionIdStr } = await params;
  const teamId = parseId(id);
  const competitionId = parseId(competitionIdStr);
  if (!teamId || !competitionId) {
    return NextResponse.json({ error: 'Invalid team or competition id.' }, { status: 400 });
  }

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { id: true, teamId: true },
  });
  if (!competition || competition.teamId !== teamId) {
    return NextResponse.json({ error: 'Competition not found.' }, { status: 404 });
  }

  if (!(await requireManager(teamId, session.userId))) {
    return NextResponse.json(
      { error: 'Only owners and admins can update competitions.' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, location, eventDate, result, placement, robotIds } = body as {
    name?: string;
    description?: string;
    location?: string;
    eventDate?: string;
    result?: string;
    placement?: number;
    robotIds?: number[];
  };

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    data.name = name.trim();
  }
  if (description !== undefined) data.description = description.trim() || null;
  if (location !== undefined) data.location = location.trim() || null;
  if (eventDate !== undefined) {
    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Data do evento inválida' }, { status: 400 });
    }
    data.eventDate = parsedDate;
  }
  if (result !== undefined) {
    data.result = result.trim() || null;
    data.publishedAt = new Date();
  }
  if (placement !== undefined) {
    data.placement = Number.isInteger(placement) ? placement : null;
  }

  if (robotIds !== undefined) {
    const ids = Array.isArray(robotIds) ? robotIds.filter((n) => Number.isInteger(n)) : [];
    if (ids.length > 0) {
      const count = await prisma.robot.count({ where: { id: { in: ids }, teamId } });
      if (count !== ids.length) {
        return NextResponse.json({ error: 'Um ou mais robôs não pertencem a esta equipe.' }, { status: 400 });
      }
    }
    data.robots = { set: ids.map((robotId) => ({ id: robotId })) };
  }

  const updated = await prisma.competition.update({
    where: { id: competitionId },
    data,
    include: {
      createdBy: { select: { id: true, name: true } },
      robots: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  return NextResponse.json({ data: updated });
}
