import { NextResponse } from 'next/server';
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
