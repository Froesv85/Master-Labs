import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

function parseProjectId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function getProjectId(params: { id: string }) {
  return parseProjectId(params.id);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = getProjectId({ id });

  if (!projectId) {
    return NextResponse.json({ error: 'Invalid project id.' }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const difficulties = await prisma.projectDifficulty.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: difficulties,
    });
  } catch (error) {
    console.error('GET /api/projects/[id]/difficulties failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = getProjectId({ id });

  if (!projectId) {
    return NextResponse.json({ error: 'Invalid project id.' }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as { description?: string } | null;
    const description = body?.description?.trim();

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required.' },
        { status: 400 }
      );
    }

    const difficulty = await prisma.projectDifficulty.create({
      data: {
        projectId,
        description,
      },
      select: {
        id: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: difficulty }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/difficulties failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
