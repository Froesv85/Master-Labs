import { NextRequest, NextResponse } from 'next/server';

import { normalizeExtractionOutput } from '@/lib/extraction-output-schema';
import { prisma } from '@/lib/prisma';

type CallbackBody = {
  webhookId?: string;
  status?: 'done' | 'failed';
  n8nExecutionId?: string;
  latencyMs?: number;
  output?: Record<string, unknown>;
  error?: string;
};

function parseProjectId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseProjectId(id);

  if (!projectId) {
    return NextResponse.json({ error: 'Invalid project id.' }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as CallbackBody | null;

  if (!body?.webhookId) {
    return NextResponse.json({ error: 'Missing webhookId.' }, { status: 400 });
  }

  const status = body?.status ?? 'done';
  if (status !== 'done' && status !== 'failed') {
    return NextResponse.json(
      { error: 'Invalid status. Use one of: done, failed.' },
      { status: 400 }
    );
  }

  try {
    const log = await prisma.projectExtractionLog.findUnique({
      where: { webhookId: body.webhookId },
      select: { id: true, projectId: true },
    });

    if (!log) {
      return NextResponse.json({ error: 'Webhook not found.' }, { status: 404 });
    }

    if (log.projectId !== projectId) {
      return NextResponse.json({ error: 'Project ID mismatch.' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      status,
      n8nExecutionId: body.n8nExecutionId,
      latencyMs: body.latencyMs,
      updatedAt: new Date(),
    };

    if (body.output) {
      updateData.output = JSON.stringify(normalizeExtractionOutput(body.output));
    }

    if (body.error) {
      updateData.error = body.error;
    }

    const updatedLog = await prisma.projectExtractionLog.update({
      where: { id: log.id },
      data: updateData,
      select: {
        id: true,
        projectId: true,
        status: true,
        webhookId: true,
        latencyMs: true,
        n8nExecutionId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        data: updatedLog,
        message: `Extraction log updated to status: ${status}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/projects/[id]/extract/callback failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
