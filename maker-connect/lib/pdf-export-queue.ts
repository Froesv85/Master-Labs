import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

import { buildPdf, ExportData } from '@/lib/pdf-service';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/s3-service';

type PdfExportJobData = {
  exportId: number;
  projectId: number;
};

const QUEUE_NAME = 'pdf-export-jobs';
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://makerconnect.com.br').replace(/\/$/, '');

type QueueGlobals = {
  redis?: IORedis;
  queue?: Queue<PdfExportJobData>;
  worker?: Worker<PdfExportJobData>;
};

const queueGlobals = globalThis as typeof globalThis & QueueGlobals;

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function getRedisConnection() {
  if (queueGlobals.redis) return queueGlobals.redis;

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  queueGlobals.redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  return queueGlobals.redis;
}

function getQueue() {
  if (queueGlobals.queue) return queueGlobals.queue;

  queueGlobals.queue = new Queue<PdfExportJobData>(QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1500,
      },
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  });

  return queueGlobals.queue;
}

export async function processPdfExportJob(jobData: PdfExportJobData) {
  const { exportId, projectId } = jobData;

  await prisma.projectExport.update({
    where: { id: exportId },
    data: {
      status: 'processing',
      error: null,
    },
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      creator: true,
      tags: { select: { tag: true } },
      difficulties: { orderBy: { createdAt: 'desc' } },
      dossier: true,
      extractionLogs: {
        where: { status: 'done' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!project) {
    throw new Error(`Projeto ${projectId} nao encontrado para exportacao ${exportId}.`);
  }

  let techReqsRaw: unknown[] = [];
  let bom: Array<{ quantity: string; item: string; notes: string }> = [];
  let assemblyStepsRaw: unknown[] = [];
  let suggestedCode = '';
  const latestExtraction = project.extractionLogs[0];

  // Prefer a saved ProjectDossier (o dono pode ter editado os dados) e cai para o
  // output bruto da extracao mais recente quando o dossie ainda nao foi gerado.
  if (project.dossier) {
    try {
      techReqsRaw = project.dossier.technicalRequirements ? JSON.parse(project.dossier.technicalRequirements) : [];
      bom = project.dossier.suggestedBOM ? JSON.parse(project.dossier.suggestedBOM) : [];
      assemblyStepsRaw = project.dossier.assemblySteps ? JSON.parse(project.dossier.assemblySteps) : [];
    } catch (error) {
      console.error('Falha ao parsear dossie do projeto:', error);
    }
  }

  if (latestExtraction?.output) {
    try {
      const parsed =
        typeof latestExtraction.output === 'string'
          ? JSON.parse(latestExtraction.output)
          : latestExtraction.output;

      if (!project.dossier) {
        techReqsRaw = parsed.technicalRequirements || [];
        bom = parsed.suggestedBOM || [];
        assemblyStepsRaw = parsed.assemblySteps || [];
      }
      suggestedCode = parsed.suggestedCode || '';
    } catch (error) {
      console.error('Falha ao parsear extracao AI:', error);
    }
  }

  const techReqs = techReqsRaw.map((r) => {
    if (typeof r === 'string') return r;
    const req = r as Record<string, unknown>;
    return String(req.detail || req.description || req.name || JSON.stringify(req));
  });

  const assemblySteps = assemblyStepsRaw.map((s, i) => {
    const step = s as Record<string, unknown>;
    return {
      step: Number.isFinite(Number(step.step)) ? Number(step.step) : i + 1,
      title: String(step.title || `Etapa ${i + 1}`),
      detail: String(step.detail || ''),
    };
  });

  const exportData: ExportData = {
    projectTitle: project.title,
    projectDescription: project.description || '',
    projectUrl: `${PUBLIC_SITE_URL}/projects/${project.id}`,
    creator: project.creator.name || project.creator.email,
    tags: project.tags.map((t) => t.tag),
    difficulties: project.difficulties.map((difficulty) => ({
      date: new Date(difficulty.createdAt).toLocaleDateString('pt-BR'),
      description: difficulty.description,
    })),
    technicalRequirements: techReqs,
    suggestedBom: bom,
    assemblySteps,
    suggestedCode,
    videoUrl: project.dossier?.videoUrl ?? null,
  };

  const pdfBuffer = await buildPdf(exportData);
  const randomHash = Math.random().toString(36).substring(2, 8);
  const filename = `docs/project-${project.id}-${Date.now()}-${randomHash}.pdf`;
  const fileUrl = await uploadFile(pdfBuffer, filename, 'application/pdf');

  await prisma.projectExport.update({
    where: { id: exportId },
    data: {
      status: 'done',
      fileUrl,
    },
  });
}

export function startPdfExportWorker() {
  if (queueGlobals.worker) return queueGlobals.worker;

  const concurrency = Math.max(1, Number(process.env.PDF_EXPORT_WORKER_CONCURRENCY || 1));

  queueGlobals.worker = new Worker<PdfExportJobData>(
    QUEUE_NAME,
    async (job) => {
      await processPdfExportJob(job.data);
    },
    {
      connection: getRedisConnection(),
      concurrency,
    }
  );

  queueGlobals.worker.on('failed', async (job, error) => {
    const exportId = job?.data?.exportId;
    if (!exportId) return;

    console.error('PDF Worker failed:', error);

    await prisma.projectExport.update({
      where: { id: exportId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown PDF build error',
      },
    });
  });

  return queueGlobals.worker;
}

export async function enqueuePdfExportJob(data: PdfExportJobData) {
  const queue = getQueue();
  const job = await queue.add('pdf-export', data, {
    jobId: `pdf-export-${data.exportId}`,
  });
  return job;
}

if (toBoolean(process.env.PDF_EXPORT_INLINE_WORKER, true)) {
  startPdfExportWorker();
}
