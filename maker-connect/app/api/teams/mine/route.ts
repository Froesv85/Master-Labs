import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — teams the current session's user is an approved member of
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.userId, status: 'approved' },
    select: { team: { select: { id: true, name: true } } },
    orderBy: { team: { name: 'asc' } },
  });

  return NextResponse.json({ data: memberships.map((m) => m.team) });
}
