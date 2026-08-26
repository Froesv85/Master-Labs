import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const robotId = parseInt(id);
  if (isNaN(robotId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const robot = await prisma.robot.findUnique({
    where: { id: robotId },
    include: {
      owner: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      matches: { orderBy: { matchDate: 'desc' } },
      awards: {
        include: { event: { select: { name: true, location: true } } },
        orderBy: { year: 'desc' },
      },
      participations: {
        include: { event: true },
        orderBy: { createdAt: 'desc' },
      },
      images: { orderBy: { position: 'asc' } },
      components: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!robot) return NextResponse.json({ error: 'Robot not found' }, { status: 404 });
  return NextResponse.json(robot);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const robotId = parseInt(id);
  if (isNaN(robotId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const existing = await prisma.robot.findUnique({ where: { id: robotId }, select: { ownerId: true } });
  if (!existing) return NextResponse.json({ error: 'Robot not found' }, { status: 404 });
  if (existing.ownerId !== session.userId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await req.json() as {
    name?: string;
    description?: string;
    category?: string;
    status?: string;
    teamId?: number | null;
    weightKg?: number | null;
    lengthCm?: number | null;
    widthCm?: number | null;
    heightCm?: number | null;
  };

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.description !== undefined) data.description = body.description.trim() || null;
  if (body.category !== undefined) data.category = body.category as never;
  if (body.status !== undefined) data.status = body.status;
  if (body.teamId !== undefined) data.teamId = body.teamId;
  if (body.weightKg !== undefined) data.weightKg = body.weightKg;
  if (body.lengthCm !== undefined) data.lengthCm = body.lengthCm;
  if (body.widthCm !== undefined) data.widthCm = body.widthCm;
  if (body.heightCm !== undefined) data.heightCm = body.heightCm;

  const robot = await prisma.robot.update({
    where: { id: robotId },
    data,
    include: {
      owner: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      matches: { orderBy: { matchDate: 'desc' } },
      awards: { include: { event: { select: { name: true, location: true } } }, orderBy: { year: 'desc' } },
      participations: { include: { event: true }, orderBy: { createdAt: 'desc' } },
      images: { orderBy: { position: 'asc' } },
      components: { orderBy: { createdAt: 'asc' } },
    },
  });

  return NextResponse.json(robot);
}
