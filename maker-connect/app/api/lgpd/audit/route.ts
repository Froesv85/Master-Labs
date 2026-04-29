import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;

  const rawProjectId = searchParams.get('projectId');
  const rawUserId = searchParams.get('userId');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20));

  const projectId = rawProjectId ? parseInt(rawProjectId) : null;
  const userId = rawUserId ? parseInt(rawUserId) : null;

  if (rawProjectId && (!Number.isInteger(projectId) || (projectId as number) <= 0)) {
    return NextResponse.json({ error: 'Invalid projectId.' }, { status: 400 });
  }
  if (rawUserId && (!Number.isInteger(userId) || (userId as number) <= 0)) {
    return NextResponse.json({ error: 'Invalid userId.' }, { status: 400 });
  }

  const where = {
    ...(projectId ? { projectId } : {}),
    ...(userId ? { userId } : {}),
  };

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.lgpdAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        action: true,
        projectId: true,
        userId: true,
        piiTypes: true,
        redactions: true,
        context: true,
      },
    }),
    prisma.lgpdAuditLog.count({ where }),
  ]);

  return NextResponse.json({
    data: logs,
    total,
    page,
    limit,
    hasMore: skip + logs.length < total,
  });
}
