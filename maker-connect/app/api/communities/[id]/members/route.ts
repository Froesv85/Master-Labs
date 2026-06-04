import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

function parseCommunityId(value: string) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// POST — join community (auto-approved for public, pending for private)
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  const communityId = parseCommunityId(id);
  if (!communityId) {
    return NextResponse.json({ error: 'Invalid community id.' }, { status: 400 });
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, isPublic: true },
  });
  if (!community) {
    return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
  }

  const existing = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: session.userId } },
    select: { id: true, status: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Already a member or request pending.', status: existing.status },
      { status: 409 }
    );
  }

  const status = community.isPublic ? 'approved' : 'pending';

  const membership = await prisma.communityMember.create({
    data: {
      communityId,
      userId: session.userId,
      role: 'member',
      status,
    },
    select: {
      id: true,
      communityId: true,
      userId: true,
      role: true,
      status: true,
      joinedAt: true,
    },
  });

  return NextResponse.json({ data: membership }, { status: 201 });
}

// GET — list members (approved by default; founder/mod can filter by ?status=pending)
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const communityId = parseCommunityId(id);
  if (!communityId) {
    return NextResponse.json({ error: 'Invalid community id.' }, { status: 400 });
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true },
  });
  if (!community) {
    return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
  }

  const requestedStatus = req.nextUrl.searchParams.get('status');
  const filterPending = requestedStatus === 'pending';

  if (filterPending) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    const callerMembership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: session.userId } },
      select: { role: true },
    });
    if (!callerMembership || !['founder', 'moderator'].includes(callerMembership.role)) {
      return NextResponse.json(
        { error: 'Only founders and moderators can view pending requests.' },
        { status: 403 }
      );
    }
  }

  const whereStatus = filterPending ? 'pending' : 'approved';

  const members = await prisma.communityMember.findMany({
    where: { communityId, status: whereStatus },
    orderBy: { joinedAt: 'asc' },
    select: {
      id: true,
      userId: true,
      role: true,
      status: true,
      joinedAt: true,
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: members, total: members.length });
}
