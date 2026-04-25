jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectExtractionLog: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    projectExport: {
      groupBy: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/metrics/route';

describe('GET /api/metrics', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna métricas consolidadas com status 200', async () => {
    (prisma.projectExtractionLog.aggregate as jest.Mock).mockResolvedValue({
      _count: { id: 5 },
      _avg: { latencyMs: 1200 },
      _sum: { piiRedactions: 3 },
    });
    (prisma.projectExport.groupBy as jest.Mock).mockResolvedValue([
      { status: 'done', _count: { id: 4 } },
      { status: 'failed', _count: { id: 1 } },
    ]);
    (prisma.projectExtractionLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        project: { title: 'RoboSumo v2' },
        status: 'success',
        latencyMs: 1200,
        createdAt: new Date(),
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.ai.totalExtractions).toBe(5);
    expect(body.data.pdf.total).toBe(5);
    expect(body.data.pdf.done).toBe(4);
    expect(body.data.recent).toHaveLength(1);
    expect(body.data.recent[0].project).toBe('RoboSumo v2');
  });

  it('calcula avgLatencySec corretamente', async () => {
    (prisma.projectExtractionLog.aggregate as jest.Mock).mockResolvedValue({
      _count: { id: 2 },
      _avg: { latencyMs: 2500 },
      _sum: { piiRedactions: 0 },
    });
    (prisma.projectExport.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.projectExtractionLog.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();
    expect(body.data.ai.avgLatencySec).toBe('2.50');
  });

  it('retorna 500 quando Prisma lança exceção', async () => {
    (prisma.projectExtractionLog.aggregate as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
