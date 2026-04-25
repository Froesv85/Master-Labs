import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = 12;

  const where = category ? { category: category as never } : {};
  const [robots, total] = await Promise.all([
    prisma.robot.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        awards: { orderBy: { year: 'desc' }, take: 3 },
        _count: { select: { matches: true } },
      },
      orderBy: { eloScore: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.robot.count({ where }),
  ]);

  return NextResponse.json({ robots, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, category, ownerId = 1 } = body as {
      name: string;
      description?: string;
      category: string;
      ownerId?: number;
    };

    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    if (!category) return NextResponse.json({ error: 'Categoria obrigatória' }, { status: 400 });

    const robot = await prisma.robot.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category as never,
        ownerId,
      },
      include: { owner: { select: { id: true, name: true } }, awards: true, _count: { select: { matches: true } } },
    });

    return NextResponse.json(robot, { status: 201 });
  } catch (error) {
    console.error('POST /api/robots failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
