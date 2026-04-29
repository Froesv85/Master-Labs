import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    lgpdAuditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET } from '@/app/api/lgpd/audit/route';

function makeRequest(qs = '') {
  return new NextRequest(`http://localhost:3000/api/lgpd/audit${qs ? `?${qs}` : ''}`);
}

const mockSession = { userId: 1, email: 'admin@test.com', name: 'Admin' };

const mockLogs = [
  { id: 1, createdAt: new Date('2026-04-29'), action: 'extract', projectId: 10, userId: 1, piiTypes: '["EMAIL"]', redactions: 1, context: 'webhookId=wh_1' },
  { id: 2, createdAt: new Date('2026-04-28'), action: 'extract', projectId: 11, userId: 2, piiTypes: null, redactions: 0, context: null },
];

describe('GET /api/lgpd/audit', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('retorna lista paginada de logs', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.lgpdAuditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
    (prisma.lgpdAuditLog.count as jest.Mock).mockResolvedValue(2);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.total).toBe(2);
    expect(body.data).toHaveLength(2);
    expect(body.page).toBe(1);
    expect(body.hasMore).toBe(false);
  });

  it('filtra por projectId', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.lgpdAuditLog.findMany as jest.Mock).mockResolvedValue([mockLogs[0]]);
    (prisma.lgpdAuditLog.count as jest.Mock).mockResolvedValue(1);

    await GET(makeRequest('projectId=10'));

    expect(prisma.lgpdAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId: 10 } })
    );
  });

  it('filtra por userId', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.lgpdAuditLog.findMany as jest.Mock).mockResolvedValue([mockLogs[1]]);
    (prisma.lgpdAuditLog.count as jest.Mock).mockResolvedValue(1);

    await GET(makeRequest('userId=2'));

    expect(prisma.lgpdAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 2 } })
    );
  });

  it('retorna 400 para projectId inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const res = await GET(makeRequest('projectId=abc'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/projectId/i);
  });

  it('respeita paginação — page e limit', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.lgpdAuditLog.findMany as jest.Mock).mockResolvedValue([mockLogs[0]]);
    (prisma.lgpdAuditLog.count as jest.Mock).mockResolvedValue(10);

    const res = await GET(makeRequest('page=2&limit=1'));
    const body = await res.json();

    expect(body.page).toBe(2);
    expect(body.limit).toBe(1);
    expect(body.hasMore).toBe(true);
    expect(prisma.lgpdAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 })
    );
  });
});
