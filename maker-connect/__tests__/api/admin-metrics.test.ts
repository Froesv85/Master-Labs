jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectExtractionLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/admin/metrics/route';

const makeLogs = (latencies: number[], extras: Partial<{ anonymizeMs: number; n8nTriggerMs: number }> = {}) =>
  latencies.map((ms, i) => ({
    latencyMs: ms,
    anonymizeMs: extras.anonymizeMs ?? null,
    n8nTriggerMs: extras.n8nTriggerMs ?? null,
    updatedAt: new Date(`2026-05-${String(i + 1).padStart(2, '0')}`),
  }));

describe('GET /api/admin/metrics', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna 200 com p50 e p95 calculados', async () => {
    const logs = makeLogs([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    (prisma.projectExtractionLog.findMany as jest.Mock).mockResolvedValue(logs);
    (prisma.projectExtractionLog.count as jest.Mock).mockResolvedValue(10);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.totalRuns).toBe(10);
    expect(body.sampleSize).toBe(10);
    expect(body.p50).toBe(500);
    expect(body.p95).toBe(1000);
  });

  it('retorna zeros quando não há logs com latencyMs', async () => {
    (prisma.projectExtractionLog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.projectExtractionLog.count as jest.Mock).mockResolvedValue(0);

    const res = await GET();
    const body = await res.json();

    expect(body.p50).toBe(0);
    expect(body.p95).toBe(0);
    expect(body.avgLatencyMs).toBe(0);
    expect(body.totalRuns).toBe(0);
    expect(body.lastRunAt).toBeNull();
  });

  it('calcula avgAnonymizeMs e avgN8nTriggerMs quando presentes', async () => {
    const logs = makeLogs([500, 1000], { anonymizeMs: 10, n8nTriggerMs: 200 });
    (prisma.projectExtractionLog.findMany as jest.Mock).mockResolvedValue(logs);
    (prisma.projectExtractionLog.count as jest.Mock).mockResolvedValue(2);

    const res = await GET();
    const body = await res.json();

    expect(body.avgAnonymizeMs).toBe(10);
    expect(body.avgN8nTriggerMs).toBe(200);
  });

  it('retorna null para avgAnonymizeMs quando campos não estão preenchidos', async () => {
    (prisma.projectExtractionLog.findMany as jest.Mock).mockResolvedValue(makeLogs([300]));
    (prisma.projectExtractionLog.count as jest.Mock).mockResolvedValue(1);

    const res = await GET();
    const body = await res.json();

    expect(body.avgAnonymizeMs).toBeNull();
    expect(body.avgN8nTriggerMs).toBeNull();
  });

  it('expõe lastRunAt como a data do log mais recente', async () => {
    const logs = makeLogs([400, 800]);
    (prisma.projectExtractionLog.findMany as jest.Mock).mockResolvedValue(logs);
    (prisma.projectExtractionLog.count as jest.Mock).mockResolvedValue(2);

    const res = await GET();
    const body = await res.json();

    expect(body.lastRunAt).toBe(logs[0].updatedAt.toISOString());
  });
});
