import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

function parseProjectId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseProjectId(id);

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

    const logs = await prisma.projectExtractionLog.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        status: true,
        webhookId: true,
        source: true,
        piiRedactions: true,
        keywords: true,
        embeddingId: true,
        latencyMs: true,
        n8nExecutionId: true,
        output: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const parsedLogs = logs.map((log) => ({
      ...log,
      keywords: log.keywords ? JSON.parse(log.keywords) : [],
      output: log.output ? JSON.parse(log.output) : null,
    }));

    return NextResponse.json({
      data: parsedLogs,
    });
  } catch (error) {
    console.error('GET /api/projects/[id]/extract failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
