import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseProjectId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseProjectId(id);

  if (!projectId) {
    return NextResponse.json({ error: 'Invalid project id.' }, { status: 400 });
  }

  try {
    const session = await getSession();
    const userId = session?.userId ?? 1;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const existingShare = await prisma.projectShare.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { id: true },
    });

    if (!existingShare) {
      await prisma.projectShare.create({ data: { userId, projectId } });
    }

    const shares = await prisma.projectShare.count({ where: { projectId } });

    return NextResponse.json({
      data: {
        projectId,
        shares,
        alreadyShared: Boolean(existingShare),
      },
    });
  } catch (error) {
    console.error('POST /api/projects/[id]/share failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
