import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessProject } from '@/lib/project-access';

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
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tags: { select: { tag: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const allowed = await canAccessProject(project, session.userId);
    if (!allowed) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const fork = await prisma.project.create({
      data: {
        title: `${project.title} (Fork)`,
        description: project.description,
        objective: project.objective,
        visibility: 'public',
        creatorId: session.userId,
        parentId: project.id,
        content: project.content,
        tags: { create: project.tags.map((t) => ({ tag: t.tag })) },
      },
      select: {
        id: true,
        title: true,
        parentId: true,
        creatorId: true,
        createdAt: true,
        tags: { select: { tag: true } },
      },
    });

    return NextResponse.json({ data: { ...fork, tags: fork.tags.map((t) => t.tag) } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/fork failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
