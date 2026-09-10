import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const teams = await prisma.team.findMany({
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isPublic = true } = body as {
      name: string;
      description?: string;
      isPublic?: boolean;
    };

    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic,
        ownerId: session.userId,
        members: {
          create: { userId: session.userId, role: 'owner' },
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
