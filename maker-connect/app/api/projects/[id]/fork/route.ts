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
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const fork = await prisma.project.create({
      data: {
        title: `${project.title} (Fork)`,
        description: project.description,
        category: project.category,
        creatorId: session.userId,
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
