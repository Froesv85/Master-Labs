import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const DEFAULT_FORK_USER_EMAIL = 'test@example.com';

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
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.user.findUnique({ where: { email: DEFAULT_FORK_USER_EMAIL } }),
    ]);

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Default fork user not found. Run seed first.' },
        { status: 400 }
      );
    }

    const fork = await prisma.project.create({
      data: {
        title: `${project.title} (Fork)`,
        description: project.description,
        category: project.category,
        creatorId: user.id,
        parentId: project.id,
        content: project.content,
      },
      select: {
        id: true,
        title: true,
        parentId: true,
        creatorId: true,
        category: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: fork }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/fork failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
