import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

function parseTeamId(value: string) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// POST — self-affiliate (auto-approved for public, pending for private) or,
// when `userId` is provided by an owner/admin, add a member directly (approved).
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

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, isPublic: true },
  });
  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const targetUserId = typeof body?.userId === 'number' ? body.userId : null;

  let memberUserId = session.userId;
  let status: 'approved' | 'pending' = team.isPublic ? 'approved' : 'pending';

  if (targetUserId && targetUserId !== session.userId) {
    const callerMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.userId } },
      select: { role: true },
    });
    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can add members directly.' },
        { status: 403 }
      );
    }
    memberUserId = targetUserId;
    status = 'approved';
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: memberUserId } },
    select: { id: true, status: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Already a member or request pending.', status: existing.status },
      { status: 409 }
    );
  }

  const membership = await prisma.teamMember.create({
    data: {
      teamId,
      userId: memberUserId,
      role: 'member',
      status,
    },
    select: {
      id: true,
      teamId: true,
      userId: true,
      role: true,
      status: true,
      joinedAt: true,
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: membership }, { status: 201 });
}

// GET — list members (approved by default; owner/admin can filter by ?status=pending)
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const teamId = parseTeamId(id);
  if (!teamId) {
    return NextResponse.json({ error: 'Invalid team id.' }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });
  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
  }

  const requestedStatus = req.nextUrl.searchParams.get('status');
  const filterPending = requestedStatus === 'pending';

  if (filterPending) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    const callerMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.userId } },
      select: { role: true },
    });
    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can view pending requests.' },
        { status: 403 }
      );
    }
  }

  const whereStatus = filterPending ? 'pending' : 'approved';

  const members = await prisma.teamMember.findMany({
    where: { teamId, status: whereStatus },
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
