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

async function processPdfExportJob(jobData: PdfExportJobData) {
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
      difficulties: { orderBy: { createdAt: 'desc' } },
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

  let techReqs: string[] = [];
  let bom: Array<{ quantity: string; item: string; notes: string }> = [];
  let suggestedCode = '';
  const latestExtraction = project.extractionLogs[0];

  if (latestExtraction?.output) {
    try {
      const parsed =
        typeof latestExtraction.output === 'string'
          ? JSON.parse(latestExtraction.output)
          : latestExtraction.output;

      techReqs = (parsed.technicalRequirements || []).map((r: Record<string, unknown> | string) => {
        if (typeof r === 'string') return r;
        return String(r.detail || r.description || r.name || JSON.stringify(r));
      });

      bom = parsed.suggestedBOM || [];
      suggestedCode = parsed.suggestedCode || '';
    } catch (error) {
      console.error('Falha ao parsear extracao AI:', error);
    }
  }

  const exportData: ExportData = {
    projectTitle: project.title,
    projectDescription: project.description || '',
    creator: project.creator.name || project.creator.email,
    category: project.category,
    difficulties: project.difficulties.map((difficulty) => ({
      date: new Date(difficulty.createdAt).toLocaleDateString('pt-BR'),
      description: difficulty.description,
    })),
    technicalRequirements: techReqs,
    suggestedBom: bom,
    suggestedCode,
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
