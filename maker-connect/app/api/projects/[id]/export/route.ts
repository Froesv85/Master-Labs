import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPdf, ExportData } from '@/lib/pdf-service';
import { uploadFile } from '@/lib/s3-service';

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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: true,
        difficulties: { orderBy: { createdAt: 'desc' } },
        extractionLogs: {
          where: { status: 'done' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // Cria registro de log assincrono no banco como "queued" ou "processing"
    const exportRecord = await prisma.projectExport.create({
      data: {
        projectId,
        status: 'processing',
      },
    });

    // Iniciar processo em background. Em Vercel/Produção real idealmente seria um Job Queue.
    // Como estamos no ambiente MVP auto-hospedado (Node.js), podemos soltar a Promise.
    Promise.resolve().then(async () => {
      try {
        let techReqs: string[] = [];
        let bom: any[] = [];
        let suggestedCode = '';
        const latestExtraction = project.extractionLogs[0];

        if (latestExtraction?.output) {
          try {
            const parsed = typeof latestExtraction.output === 'string' ? JSON.parse(latestExtraction.output) : latestExtraction.output;
            techReqs = (parsed.technicalRequirements || []).map((r: any) => 
              typeof r === 'string' ? r : (r.detail || r.description || r.name || JSON.stringify(r))
            );
            bom = parsed.suggestedBOM || [];
            suggestedCode = parsed.suggestedCode || '';
          } catch (e) {
             console.error('Falha ao parsear extracao AI:', e);
          }
        }

        const exportData: ExportData = {
          projectTitle: project.title,
          projectDescription: project.description || '',
          creator: project.creator.name || project.creator.email,
          category: project.category,
          difficulties: project.difficulties.map(d => ({
            date: new Date(d.createdAt).toLocaleDateString('pt-BR'),
            description: d.description
          })),
          technicalRequirements: techReqs,
          suggestedBom: bom,
          suggestedCode: suggestedCode
        };

        const pdfBuffer = await buildPdf(exportData);
        
        // Upload para MinIO/S3
        const randomHash = Math.random().toString(36).substring(2, 8);
        const filename = `docs/project-${project.id}-${Date.now()}-${randomHash}.pdf`;
        const fileUrl = await uploadFile(pdfBuffer, filename, 'application/pdf');

        await prisma.projectExport.update({
          where: { id: exportRecord.id },
          data: {
            status: 'done',
            fileUrl,
          },
        });
      } catch (workerError) {
        console.error('PDF Worker failed:', workerError);
        await prisma.projectExport.update({
          where: { id: exportRecord.id },
          data: {
            status: 'failed',
            error: workerError instanceof Error ? workerError.message : 'Unknown PDF build error',
          },
        });
      }
    });

    // Responder imediatamente à UI que iniciamos o processamento
    return NextResponse.json({ 
        message: 'Geração de PDF iniciada com sucesso.',
        exportId: exportRecord.id 
    }, { status: 202 });

  } catch (error) {
    console.error('POST /api/projects/[id]/export failed', error);
    return NextResponse.json({ error: 'Falha grave ao engatilhar a exportação' }, { status: 500 });
  }
}
