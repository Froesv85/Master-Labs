import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
