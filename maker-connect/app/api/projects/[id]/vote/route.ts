import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const DEFAULT_VOTE_USER_EMAIL = 'test@example.com';

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
    const [project, user] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: DEFAULT_VOTE_USER_EMAIL }, select: { id: true } }),
    ]);

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Default vote user not found. Run seed first.' },
        { status: 400 }
      );
    }

    const existingVote = await prisma.projectVote.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId,
        },
      },
      select: { id: true },
    });

    if (!existingVote) {
      await prisma.projectVote.create({
        data: {
          userId: user.id,
          projectId,
        },
      });
    }

    const votes = await prisma.projectVote.count({
      where: { projectId },
    });

    return NextResponse.json({
      data: {
        projectId,
        votes,
        alreadyVoted: Boolean(existingVote),
      },
    });
  } catch (error) {
    console.error('POST /api/projects/[id]/vote failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
