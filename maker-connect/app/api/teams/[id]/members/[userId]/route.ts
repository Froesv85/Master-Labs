import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string; userId: string }> };

function parseId(value: string) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// PATCH — approve or reject a pending membership request (owner/admin only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id, userId: userIdStr } = await params;
  const teamId = parseId(id);
  const targetUserId = parseId(userIdStr);

  if (!teamId || !targetUserId) {
    return NextResponse.json({ error: 'Invalid team or user id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { action } = body;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json(
      { error: 'action must be "approve" or "reject".' },
      { status: 400 }
    );
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });
  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
  }

  const callerMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.userId } },
    select: { role: true },
  });
  if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
    return NextResponse.json(
      { error: 'Only owners and admins can approve or reject membership requests.' },
      { status: 403 }
    );
  }

  const targetMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUserId } },
    select: { id: true, status: true },
  });
  if (!targetMembership) {
    return NextResponse.json({ error: 'Membership request not found.' }, { status: 404 });
  }
  if (targetMembership.status !== 'pending') {
    return NextResponse.json(
      { error: `Cannot ${action} a membership that is already ${targetMembership.status}.` },
      { status: 409 }
    );
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const updated = await prisma.teamMember.update({
    where: { id: targetMembership.id },
    data: { status: newStatus },
    select: { id: true, teamId: true, userId: true, role: true, status: true },
  });

  return NextResponse.json({ data: updated });
}
