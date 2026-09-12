import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: jest.fn(), update: jest.fn() },
    projectExtractionLog: { create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('@/lib/extraction-queue', () => ({
  enqueueExtractionJob: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { enqueueExtractionJob } from '@/lib/extraction-queue';
import { GET, POST } from '@/app/api/projects/[id]/extract/route';

const mockProject = { id: 1, title: 'ESP32 Weather Station', description: '', creator: { language: 'pt-BR' } };
const mockLog = {
  id: 10, projectId: 1, status: 'queued', webhookId: 'webhook_1', piiRedactions: 0,
  keywords: '[]', language: 'pt-BR', createdAt: new Date(),
};

const params = Promise.resolve({ id: '1' });
const originalFetch = global.fetch;
const originalEngine = process.env.EXTRACTION_ENGINE;
const originalWebhook = process.env.N8N_EXTRACTION_WEBHOOK_URL;

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/projects/1/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  jest.clearAllMocks();
  global.fetch = originalFetch;
  process.env.EXTRACTION_ENGINE = originalEngine;
  process.env.N8N_EXTRACTION_WEBHOOK_URL = originalWebhook;
});

describe('POST /api/projects/[id]/extract', () => {
  it('retorna 400 quando input tem menos de 20 caracteres', async () => {
    const res = await POST(makeRequest({ input: 'curto' }), { params });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando o projeto nao existe', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest({ input: 'a'.repeat(30) }), { params });
    expect(res.status).toBe(404);
  });

  describe('EXTRACTION_ENGINE=bullmq', () => {
    beforeEach(() => {
      process.env.EXTRACTION_ENGINE = 'bullmq';
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.projectExtractionLog.create as jest.Mock).mockResolvedValue(mockLog);
      (prisma.project.update as jest.Mock).mockResolvedValue({});
    });

    it('enfileira o job e responde 201 sem chamar o n8n', async () => {
      (enqueueExtractionJob as jest.Mock).mockResolvedValue({ id: 'extract-10' });
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy as unknown as typeof fetch;

      const res = await POST(makeRequest({ input: 'a'.repeat(30) }), { params });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.status).toBe('queued');
      expect(enqueueExtractionJob).toHaveBeenCalledWith({ logId: 10, projectId: 1 });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('marca o log como failed e retorna 502 quando o enqueue falha', async () => {
      (enqueueExtractionJob as jest.Mock).mockRejectedValue(new Error('redis down'));

      const res = await POST(makeRequest({ input: 'a'.repeat(30) }), { params });
      expect(res.status).toBe(502);
      expect(prisma.projectExtractionLog.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) })
      );
    });
  });

  describe('EXTRACTION_ENGINE=n8n (padrão)', () => {
    beforeEach(() => {
      delete process.env.EXTRACTION_ENGINE;
      process.env.N8N_EXTRACTION_WEBHOOK_URL = 'http://localhost:5678/webhook/extraction';
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.projectExtractionLog.create as jest.Mock).mockResolvedValue(mockLog);
      (prisma.project.update as jest.Mock).mockResolvedValue({});
      (prisma.projectExtractionLog.update as jest.Mock).mockResolvedValue({});
    });

    it('dispara o webhook n8n e responde 201, sem usar a fila BullMQ', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => 'ok' }) as unknown as typeof fetch;

      const res = await POST(makeRequest({ input: 'a'.repeat(30) }), { params });
      expect(res.status).toBe(201);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5678/webhook/extraction',
        expect.objectContaining({ method: 'POST' })
      );
      expect(enqueueExtractionJob).not.toHaveBeenCalled();
    });
  });
});

describe('GET /api/projects/[id]/extract', () => {
  function makeGetRequest() {
    return new NextRequest('http://localhost:3000/api/projects/1/extract');
  }

  it('retorna 404 quando o projeto nao existe', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest(), { params });
    expect(res.status).toBe(404);
  });

  it('inclui e faz parse dos campos da Fase 5 (ml-pipeline)', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.projectExtractionLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 24,
        status: 'done',
        keywords: '["esp32"]',
        output: JSON.stringify({ confidenceScore: 90 }),
        predictedCategory: 'IoT',
        predictedDifficulty: 'expert',
        predictedDomains: JSON.stringify(['MCU', 'Sensor']),
        missingComponents: JSON.stringify([{ item: 'bateria', reason: 'x', confidence: 0.6 }]),
        bomClusterLabel: 'esp32-sensor',
        auditScore: 88,
        auditFlags: JSON.stringify(['Possivel peca esquecida: bateria']),
      },
    ]);

    const res = await GET(makeGetRequest(), { params });
    const payload = await res.json();

    expect(res.status).toBe(200);
    const log = payload.data[0];
    expect(log.predictedCategory).toBe('IoT');
    expect(log.predictedDifficulty).toBe('expert');
    expect(log.predictedDomains).toEqual(['MCU', 'Sensor']);
    expect(log.missingComponents).toEqual([{ item: 'bateria', reason: 'x', confidence: 0.6 }]);
    expect(log.bomClusterLabel).toBe('esp32-sensor');
    expect(log.auditScore).toBe(88);
    expect(log.auditFlags).toEqual(['Possivel peca esquecida: bateria']);
  });

  it('usa defaults vazios quando os campos da Fase 5 sao null', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.projectExtractionLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 23,
        status: 'done',
        keywords: null,
        output: null,
        predictedCategory: null,
        predictedDifficulty: null,
        predictedDomains: null,
        missingComponents: null,
        bomClusterLabel: null,
        auditScore: null,
        auditFlags: null,
      },
    ]);

    const res = await GET(makeGetRequest(), { params });
    const payload = await res.json();
    const log = payload.data[0];

    expect(log.predictedDomains).toEqual([]);
    expect(log.missingComponents).toEqual([]);
    expect(log.auditFlags).toEqual([]);
    expect(log.output).toBeNull();
  });
});
