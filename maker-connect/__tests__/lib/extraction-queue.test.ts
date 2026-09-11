const mockQueueAdd = jest.fn().mockResolvedValue({ id: 'extract-1' });

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({ add: mockQueueAdd })),
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
}));

jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({})));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectExtractionLog: { findUnique: jest.fn(), update: jest.fn() },
    project: { findUnique: jest.fn() },
  },
}));

jest.mock('@/lib/ollama', () => ({
  generateEmbedding: jest.fn(),
  generateCompletion: jest.fn(),
}));

jest.mock('@/lib/pinecone', () => ({
  queryByEmbedding: jest.fn(),
}));

jest.mock('@/lib/lgpd', () => ({
  anonymizePii: jest.fn(),
}));

jest.mock('@/lib/lgpd-audit', () => ({
  createLgpdAuditLog: jest.fn(),
}));

jest.mock('@/lib/ml-pipeline', () => ({
  classifyProject: jest.fn(),
  validateBom: jest.fn(),
  auditOutput: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { generateEmbedding, generateCompletion } from '@/lib/ollama';
import { queryByEmbedding } from '@/lib/pinecone';
import { anonymizePii } from '@/lib/lgpd';
import { createLgpdAuditLog } from '@/lib/lgpd-audit';
import { classifyProject, validateBom, auditOutput } from '@/lib/ml-pipeline';
import { enqueueExtractionJob, processExtractionJob } from '@/lib/extraction-queue';

function makeJob(overrides: Partial<{ id: string; timestamp: number }> = {}) {
  return {
    id: overrides.id ?? 'extract-1',
    timestamp: overrides.timestamp ?? Date.now() - 250,
    data: { logId: 1, projectId: 2 },
  } as never;
}

afterEach(() => jest.clearAllMocks());

describe('enqueueExtractionJob', () => {
  it('enfileira com jobId idempotente baseado no logId', async () => {
    await enqueueExtractionJob({ logId: 42, projectId: 7 });
    expect(mockQueueAdd).toHaveBeenCalledWith(
      'extract',
      { logId: 42, projectId: 7 },
      { jobId: 'extract-42' }
    );
  });
});

describe('processExtractionJob', () => {
  const mockLog = { id: 1, keywords: JSON.stringify(['esp32', 'wifi']), language: 'pt-BR', embeddingId: 'emb_1' };
  const mockProject = { id: 2, title: 'ESP32 Weather Station', content: 'sensor de temperatura com esp32' };

  it('lança erro quando o log ou o projeto não existem', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

    await expect(processExtractionJob(makeJob())).rejects.toThrow(/nao encontrado/);
  });

  it('roda o pipeline completo e marca o log como done', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});
    (generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
    (queryByEmbedding as jest.Mock).mockResolvedValue([{ id: 'm1', score: 0.9, metadata: { text: 'evidencia' } }]);
    (generateCompletion as jest.Mock).mockResolvedValue(JSON.stringify({ confidenceScore: 90 }));
    (anonymizePii as jest.Mock).mockImplementation((text: string) => ({ sanitized: text, redactions: 0, piiTypes: [] }));
    (classifyProject as jest.Mock).mockResolvedValue(null);
    (validateBom as jest.Mock).mockResolvedValue(null);
    (auditOutput as jest.Mock).mockResolvedValue(null);

    await processExtractionJob(makeJob());

    expect(generateEmbedding).toHaveBeenCalledWith('esp32, wifi');
    expect(queryByEmbedding).toHaveBeenCalledWith([0.1, 0.2, 0.3], 3);
    expect(generateCompletion).toHaveBeenCalled();
    expect(createLgpdAuditLog).not.toHaveBeenCalled();

    const calls = (prisma.projectExtractionLog.update as jest.Mock).mock.calls;
    expect(calls[0][0]).toEqual(
      expect.objectContaining({ where: { id: 1 }, data: expect.objectContaining({ status: 'processing', jobId: 'extract-1' }) })
    );
    expect(calls[1][0]).toEqual(
      expect.objectContaining({ where: { id: 1 }, data: expect.objectContaining({ status: 'done' }) })
    );
  });

  it('grava audit log LGPD quando o output gerado contém PII', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});
    (generateEmbedding as jest.Mock).mockResolvedValue([0.1]);
    (queryByEmbedding as jest.Mock).mockResolvedValue([]);
    (generateCompletion as jest.Mock).mockResolvedValue(JSON.stringify({ suggestedCode: 'contato: maker@example.com' }));
    (anonymizePii as jest.Mock).mockReturnValue({ sanitized: '[EMAIL_REDACTED]', redactions: 1, piiTypes: ['EMAIL'] });
    (classifyProject as jest.Mock).mockResolvedValue(null);
    (validateBom as jest.Mock).mockResolvedValue(null);
    (auditOutput as jest.Mock).mockResolvedValue(null);

    await processExtractionJob(makeJob());

    expect(createLgpdAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'extract', projectId: 2, redactions: 1 })
    );
  });

  it('Fase 5: grava previsoes do ml-pipeline e filtra a busca vetorial pelos dominios previstos', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});
    (generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
    (queryByEmbedding as jest.Mock).mockResolvedValue([{ id: 'm1', score: 0.9, metadata: { text: 'evidencia' } }]);
    (generateCompletion as jest.Mock).mockResolvedValue(
      JSON.stringify({ confidenceScore: 90, suggestedBOM: [{ item: 'ESP32' }], technicalRequirements: [{ name: 'TR' }] })
    );
    (anonymizePii as jest.Mock).mockImplementation((text: string) => ({ sanitized: text, redactions: 0, piiTypes: [] }));
    (classifyProject as jest.Mock).mockResolvedValue({
      category: 'IoT',
      categoryConfidence: 0.9,
      categorySource: 'heuristic',
      difficulty: 'advanced',
      difficultyScore: 0.7,
      domains: ['MCU', 'Sensor'],
    });
    (validateBom as jest.Mock).mockResolvedValue({
      missingSuggestions: [{ item: 'regulador de tensao', reason: 'ESP32 sem fonte dedicada', confidence: 0.6 }],
      clusterLabel: 'esp32-sensor',
    });
    (auditOutput as jest.Mock).mockResolvedValue({ auditScore: 85, flags: ['Possivel peca esquecida: regulador de tensao'] });

    await processExtractionJob(makeJob());

    expect(queryByEmbedding).toHaveBeenCalledWith([0.1, 0.2, 0.3], 3, { category: { $in: ['MCU', 'Sensor'] } });

    const calls = (prisma.projectExtractionLog.update as jest.Mock).mock.calls;
    expect(calls[1][0]).toEqual(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          predictedCategory: 'IoT',
          predictedDifficulty: 'advanced',
          predictedDomains: JSON.stringify(['MCU', 'Sensor']),
          bomClusterLabel: 'esp32-sensor',
          auditScore: 85,
          auditFlags: JSON.stringify(['Possivel peca esquecida: regulador de tensao']),
          missingComponents: JSON.stringify([
            { item: 'regulador de tensao', reason: 'ESP32 sem fonte dedicada', confidence: 0.6 },
          ]),
        }),
      })
    );
  });

  it('Fase 5: cai pro fallback sem filtro quando a busca filtrada nao retorna evidencia', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});
    (generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
    (queryByEmbedding as jest.Mock)
      .mockResolvedValueOnce([]) // busca filtrada sem cobertura no KB
      .mockResolvedValueOnce([{ id: 'm1', score: 0.8, metadata: { text: 'evidencia' } }]); // fallback sem filtro
    (generateCompletion as jest.Mock).mockResolvedValue(JSON.stringify({ confidenceScore: 80 }));
    (anonymizePii as jest.Mock).mockImplementation((text: string) => ({ sanitized: text, redactions: 0, piiTypes: [] }));
    (classifyProject as jest.Mock).mockResolvedValue({
      category: 'Robotics',
      categoryConfidence: 1,
      categorySource: 'heuristic',
      difficulty: 'beginner',
      difficultyScore: 0.1,
      domains: ['Actuator'],
    });
    (validateBom as jest.Mock).mockResolvedValue(null);
    (auditOutput as jest.Mock).mockResolvedValue(null);

    await processExtractionJob(makeJob());

    expect(queryByEmbedding).toHaveBeenNthCalledWith(1, [0.1, 0.2, 0.3], 3, { category: { $in: ['Actuator'] } });
    expect(queryByEmbedding).toHaveBeenNthCalledWith(2, [0.1, 0.2, 0.3], 3);
  });

  it('Fase 5: completa o pipeline normalmente quando o ml-pipeline esta fora do ar', async () => {
    (prisma.projectExtractionLog.findUnique as jest.Mock).mockResolvedValue(mockLog);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});
    (generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
    (queryByEmbedding as jest.Mock).mockResolvedValue([{ id: 'm1', score: 0.9, metadata: { text: 'evidencia' } }]);
    (generateCompletion as jest.Mock).mockResolvedValue(JSON.stringify({ confidenceScore: 90 }));
    (anonymizePii as jest.Mock).mockImplementation((text: string) => ({ sanitized: text, redactions: 0, piiTypes: [] }));
    (classifyProject as jest.Mock).mockResolvedValue(null);
    (validateBom as jest.Mock).mockResolvedValue(null);
    (auditOutput as jest.Mock).mockResolvedValue(null);

    await processExtractionJob(makeJob());

    // sem classificacao, a busca vetorial nunca tenta filtro - vai direto sem filtro
    expect(queryByEmbedding).toHaveBeenCalledTimes(1);
    expect(queryByEmbedding).toHaveBeenCalledWith([0.1, 0.2, 0.3], 3);

    const calls = (prisma.projectExtractionLog.update as jest.Mock).mock.calls;
    expect(calls[1][0]).toEqual(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'done',
          predictedCategory: null,
          predictedDifficulty: null,
          predictedDomains: null,
          missingComponents: null,
          bomClusterLabel: null,
          auditScore: null,
          auditFlags: null,
        }),
      })
    );
  });
});
