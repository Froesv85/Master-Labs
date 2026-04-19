import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueuePdfExportJob } from '@/lib/pdf-export-queue';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = Number(id);

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

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

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
