import { Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

import { prisma } from '@/lib/prisma';
import { generateEmbedding, generateCompletion } from '@/lib/ollama';
import { queryByEmbedding } from '@/lib/pinecone';
import { anonymizePii } from '@/lib/lgpd';
import { createLgpdAuditLog } from '@/lib/lgpd-audit';
import { buildRagPrompt, normalizeExtractionOutput } from '@/lib/rag-output';
import { classifyProject, validateBom, auditOutput } from '@/lib/ml-pipeline';

export type ExtractionJobData = {
  logId: number;
  projectId: number;
};

const QUEUE_NAME = 'extraction-jobs';

type QueueGlobals = {
  extractionRedis?: IORedis;
  extractionQueue?: Queue<ExtractionJobData>;
  extractionWorker?: Worker<ExtractionJobData>;
};

const queueGlobals = globalThis as typeof globalThis & QueueGlobals;

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function getRedisConnection() {
  if (queueGlobals.extractionRedis) return queueGlobals.extractionRedis;

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  queueGlobals.extractionRedis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  return queueGlobals.extractionRedis;
}

function getQueue() {
  if (queueGlobals.extractionQueue) return queueGlobals.extractionQueue;

  queueGlobals.extractionQueue = new Queue<ExtractionJobData>(QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1500 },
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  });

  return queueGlobals.extractionQueue;
}

// Same rule as the n8n "Process Input1" node: top-12 keywords joined, or the
// sanitized input truncated, capped at 600 chars either way.
function buildEmbeddingPrompt(keywords: string[], input: string): string {
  const safeKeywords = keywords.filter(Boolean).slice(0, 12);
  const base = safeKeywords.length > 0 ? safeKeywords.join(', ') : input;
  return base.slice(0, 600);
}

export async function processExtractionJob(job: Job<ExtractionJobData>) {
  const { logId, projectId } = job.data;
  const queueWaitMs = job.timestamp ? Date.now() - job.timestamp : null;
  const processingStart = Date.now();

  const log = await prisma.projectExtractionLog.findUnique({
    where: { id: logId },
    select: { id: true, keywords: true, language: true, embeddingId: true },
  });
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, description: true, content: true },
  });

  if (!log || !project) {
    throw new Error(`Extraction log ${logId} ou projeto ${projectId} nao encontrado.`);
  }

  await prisma.projectExtractionLog.update({
    where: { id: logId },
    data: { status: 'processing', jobId: job.id ?? null, queueWaitMs },
  });

  const keywords: string[] = log.keywords ? JSON.parse(log.keywords) : [];
  const input = project.content ?? '';
  const language = log.language || 'pt-BR';

  // Fase 5, estagio 1 - classificacao previa. Nunca lanca: se o ml-pipeline estiver
  // fora do ar, `classification` fica null e o resto do pipeline segue normalmente.
  const classification = await classifyProject({
    title: project.title,
    description: project.description ?? '',
    content: input,
  });

  const embeddingPrompt = buildEmbeddingPrompt(keywords, input);
  const embedding = await generateEmbedding(embeddingPrompt);

  // Fase 5, estagio 3 - tenta restringir a busca vetorial pelos dominios previstos no
  // estagio 1. Se a base Pinecone nao tiver cobertura pra esses dominios (filtro vazio),
  // refaz sem filtro - a relevancia validada em 98% no rag-eval.mjs nao pode regredir.
  let evidence = classification?.domains.length
    ? await queryByEmbedding(embedding, 3, { category: { $in: classification.domains } })
    : [];
  if (evidence.length === 0) {
    evidence = await queryByEmbedding(embedding, 3);
  }

  const prompt = buildRagPrompt({ language, projectTitle: project.title, input, evidence });
  const rawResponse = await generateCompletion(prompt);
  const normalized = normalizeExtractionOutput(rawResponse, evidence.length, log.embeddingId);

  // Fase 5, estagios 2 e 4 - validacao de BOM e auditoria pos-geracao, em paralelo.
  // Cada chamada ja e defensiva (retorna null em qualquer falha).
  const [bomCheck, audit] = await Promise.all([
    validateBom(normalized.suggestedBOM),
    auditOutput({
      bom: normalized.suggestedBOM,
      technicalRequirementsCount: normalized.technicalRequirements.length,
      confidenceScore: normalized.confidenceScore,
      groundingCount: normalized.groundingCount,
    }),
  ]);

  const outputText = JSON.stringify(normalized);
  const { sanitized, redactions, piiTypes } = anonymizePii(outputText);
  if (redactions > 0) {
    await createLgpdAuditLog({
      action: 'extract',
      projectId,
      piiTypes,
      redactions,
      context: `logId=${logId} engine=bullmq`,
    });
  }

  const latencyMs = Date.now() - processingStart;

  await prisma.projectExtractionLog.update({
    where: { id: logId },
    data: {
      status: 'done',
      output: sanitized,
      latencyMs,
      piiRedactions: redactions,
      piiTypes: piiTypes.length > 0 ? JSON.stringify(piiTypes) : null,
      predictedCategory: classification?.category ?? null,
      predictedDifficulty: classification?.difficulty ?? null,
      predictedDomains: classification?.domains.length ? JSON.stringify(classification.domains) : null,
      missingComponents: bomCheck?.missingSuggestions.length ? JSON.stringify(bomCheck.missingSuggestions) : null,
      bomClusterLabel: bomCheck?.clusterLabel ?? null,
      auditScore: audit?.auditScore ?? null,
      auditFlags: audit?.flags.length ? JSON.stringify(audit.flags) : null,
    },
  });
}

export function startExtractionWorker() {
  if (queueGlobals.extractionWorker) return queueGlobals.extractionWorker;

  const concurrency = Math.max(1, Number(process.env.EXTRACTION_WORKER_CONCURRENCY || 1));

  queueGlobals.extractionWorker = new Worker<ExtractionJobData>(
    QUEUE_NAME,
    processExtractionJob,
    {
      connection: getRedisConnection(),
      concurrency,
    }
  );

  queueGlobals.extractionWorker.on('failed', async (job, error) => {
    const logId = job?.data?.logId;
    if (!logId) return;

    console.error('Extraction Worker failed:', error);

    await prisma.projectExtractionLog.update({
      where: { id: logId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown extraction error',
      },
    });
  });

  return queueGlobals.extractionWorker;
}

export async function enqueueExtractionJob(data: ExtractionJobData) {
  const queue = getQueue();
  return queue.add('extract', data, { jobId: `extract-${data.logId}` });
}

if (toBoolean(process.env.EXTRACTION_INLINE_WORKER, true)) {
  startExtractionWorker();
}
