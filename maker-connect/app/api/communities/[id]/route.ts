import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const communityId = parseInt(id);
  if (isNaN(communityId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      creator: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: 'asc' },
        take: 20,
      },
      posts: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });
  return NextResponse.json(community);
}
