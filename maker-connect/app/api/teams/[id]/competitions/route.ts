import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

function parseTeamId(value: string) {
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

// GET — list a team's competitions (same access level as the team page itself: no gate)
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const teamId = parseTeamId(id);
  if (!teamId) {
    return NextResponse.json({ error: 'Invalid team id.' }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
  }

  const competitions = await prisma.competition.findMany({
    where: { teamId },
    orderBy: { eventDate: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true } },
      robots: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  return NextResponse.json({ data: competitions });
}

// POST — create a competition entry (owner/admin only)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  const teamId = parseTeamId(id);
  if (!teamId) {
    return NextResponse.json({ error: 'Invalid team id.' }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
  }

  if (!(await requireManager(teamId, session.userId))) {
    return NextResponse.json(
      { error: 'Only owners and admins can create competitions.' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, location, eventDate, robotIds } = body as {
    name?: string;
    description?: string;
    location?: string;
    eventDate?: string;
    robotIds?: number[];
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  }
  const parsedDate = eventDate ? new Date(eventDate) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Data do evento inválida' }, { status: 400 });
  }

  const ids = Array.isArray(robotIds) ? robotIds.filter((n) => Number.isInteger(n)) : [];
  if (ids.length > 0) {
    const count = await prisma.robot.count({ where: { id: { in: ids }, teamId } });
    if (count !== ids.length) {
      return NextResponse.json({ error: 'Um ou mais robôs não pertencem a esta equipe.' }, { status: 400 });
    }
  }

  const competition = await prisma.competition.create({
    data: {
      teamId,
      createdById: session.userId,
      name: name.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      eventDate: parsedDate,
      robots: ids.length > 0 ? { connect: ids.map((robotId) => ({ id: robotId })) } : undefined,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      robots: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  return NextResponse.json({ data: competition }, { status: 201 });
}
