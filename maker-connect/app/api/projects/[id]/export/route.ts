import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enqueuePdfExportJob } from '@/lib/pdf-export-queue';
import { canAccessProject, requireOwnedProject } from '@/lib/project-access';
import { RATE_LIMITS, checkRateLimit, tooManyRequests } from '@/lib/rate-limit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // a lista de PDFs segue a visibilidade do projeto (quem nao e dono ve, mas nao gera)
    const session = await getSession();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { visibility: true, creatorId: true, teamId: true },
    });
    if (!project || !(await canAccessProject(project, session?.userId ?? null))) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    const exportsList = await prisma.projectExport.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: exportsList }, { status: 200 });
  } catch (error) {
    console.error('GET /api/projects/[id]/export failed', error);
    return NextResponse.json({ error: 'Erro ao buscar exportações' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = Number(id);

    // gerar PDF consome CPU do worker: so o dono, com limite por hora
    const session = await getSession();
    const guard = await requireOwnedProject(projectId, session?.userId ?? null);
    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    const limit = await checkRateLimit(RATE_LIMITS.exportByUser, String(session!.userId));
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    // Cria registro de log assincrono no banco como queued.
    const exportRecord = await prisma.projectExport.create({
      data: {
        projectId,
        status: 'queued',
      },
    });

    const job = await enqueuePdfExportJob({
      exportId: exportRecord.id,
      projectId,
    });

    // Responde imediatamente para UI; processamento segue no worker BullMQ.
    return NextResponse.json({
        message: 'Geração de PDF enfileirada com sucesso.',
        exportId: exportRecord.id,
        queueJobId: job.id,
    }, { status: 202 });

  } catch (error) {
    console.error('POST /api/projects/[id]/export failed', error);
    return NextResponse.json({ error: 'Falha grave ao engatilhar a exportação' }, { status: 500 });
  }
}
