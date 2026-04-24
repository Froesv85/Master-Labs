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
