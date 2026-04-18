import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Métricas de Extração IA (RAG)
    const extractionStats = await prisma.projectExtractionLog.aggregate({
      _count: { id: true },
      _avg: { latencyMs: true },
      _sum: { piiRedactions: true },
    });

    // 2. Métricas de Exportação (PDF)
    const exportStats = await prisma.projectExport.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const pdfCounts = {
      total: exportStats.reduce((acc, curr) => acc + curr._count.id, 0),
      done: exportStats.find((s) => s.status === 'done')?._count.id || 0,
      failed: exportStats.find((s) => s.status === 'failed')?._count.id || 0,
      processing: exportStats.find((s) => s.status === 'processing' || s.status === 'queued')?._count.id || 0,
    };

    // 3. Feed de Atividades Recentes
    const recentLogs = await prisma.projectExtractionLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { title: true },
        },
      },
    });

    // 4. Transformar média para segundos amigáveis
    const avgLatencySec = extractionStats._avg.latencyMs 
      ? (extractionStats._avg.latencyMs / 1000).toFixed(2) 
      : "0";

    return NextResponse.json({
      success: true,
      data: {
        ai: {
          totalExtractions: extractionStats._count.id,
          avgLatencySec,
          totalPiiRedactions: extractionStats._sum.piiRedactions || 0,
        },
        pdf: pdfCounts,
        recent: recentLogs.map((log) => ({
          id: log.id,
          project: log.project.title,
          status: log.status,
          latency: log.latencyMs ? (log.latencyMs / 1000).toFixed(2) : null,
          date: log.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json({ success: false, error: 'Erro ao consolidar métricas' }, { status: 500 });
  }
}
