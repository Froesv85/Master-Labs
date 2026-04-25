import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const teams = await prisma.team.findMany({
    where: { isPublic: true },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, isPublic = true, ownerId = 1 } = body as {
      name: string;
      description?: string;
      isPublic?: boolean;
      ownerId?: number;
    };

    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic,
        ownerId,
        members: {
          create: { userId: ownerId, role: 'owner' },
        },
      },
      include: {
        owner: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('POST /api/teams failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
