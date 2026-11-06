import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    siteVisitDaily: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));
jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/admin', () => ({ getAdminSession: jest.fn() }));
jest.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS: { visitByIp: { name: 'visit-ip', limit: 60, windowSeconds: 3600 } },
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
  clientIp: () => '1.2.3.4',
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { POST } from '@/app/api/visits/route';
import { GET as GET_ADMIN } from '@/app/api/admin/visits/route';
import { getVisitSummary, visitDay } from '@/lib/visits';

function post() {
  return new NextRequest(new URL('/api/visits', 'http://localhost:3000'), { method: 'POST' });
}

afterEach(() => jest.clearAllMocks());

describe('POST /api/visits', () => {
  it('conta visita de convidado quando não há sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(post());
    expect(await res.json()).toEqual({ counted: true, authenticated: false });
    const args = (prisma.siteVisitDaily.upsert as jest.Mock).mock.calls[0][0];
    expect(args.create).toMatchObject({ authenticated: false, count: 1 });
    expect(args.update).toEqual({ count: { increment: 1 } });
  });

  it('conta visita autenticada quando há sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1, email: 'a@b.c', name: 'A' });
    const res = await POST(post());
    expect(await res.json()).toEqual({ counted: true, authenticated: true });
    const args = (prisma.siteVisitDaily.upsert as jest.Mock).mock.calls[0][0];
    expect(args.create.authenticated).toBe(true);
  });

  it('acima do limite por IP responde sem contar', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    (checkRateLimit as jest.Mock).mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 60 });
    const res = await POST(post());
    expect(await res.json()).toEqual({ counted: false, authenticated: false });
    expect(prisma.siteVisitDaily.upsert).not.toHaveBeenCalled();
  });

  it('falha no banco não quebra a página (responde sem contar)', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    (prisma.siteVisitDaily.upsert as jest.Mock).mockRejectedValueOnce(new Error('db down'));
    jest.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await POST(post());
    expect(res.status).toBe(200);
    expect((await res.json()).counted).toBe(false);
  });
});

describe('visitDay', () => {
  it('usa o dia de São Paulo (01:00 UTC ainda é o dia anterior)', () => {
    expect(visitDay(new Date('2026-11-06T01:00:00Z')).toISOString()).toBe('2026-11-05T00:00:00.000Z');
    expect(visitDay(new Date('2026-11-06T15:00:00Z')).toISOString()).toBe('2026-11-06T00:00:00.000Z');
  });
});

describe('GET /api/admin/visits', () => {
  it('retorna 403 para quem não é admin', async () => {
    (getAdminSession as jest.Mock).mockResolvedValue(null);
    const res = await GET_ADMIN();
    expect(res.status).toBe(403);
  });

  it('separa autenticadas e convidados por período', async () => {
    const now = new Date('2026-11-06T15:00:00Z');
    const day = (d: string) => new Date(`${d}T00:00:00.000Z`);
    (prisma.siteVisitDaily.findMany as jest.Mock).mockResolvedValue([
      { day: day('2026-11-06'), authenticated: true, count: 3 },
      { day: day('2026-11-06'), authenticated: false, count: 5 },
      { day: day('2026-11-02'), authenticated: false, count: 2 },
      { day: day('2026-10-20'), authenticated: true, count: 10 },
    ]);
    (prisma.siteVisitDaily.groupBy as jest.Mock).mockResolvedValue([
      { authenticated: true, _sum: { count: 40 } },
      { authenticated: false, _sum: { count: 70 } },
    ]);

    const s = await getVisitSummary(now);
    expect(s.today).toEqual({ authenticated: 3, guest: 5 });
    expect(s.last7Days).toEqual({ authenticated: 3, guest: 7 });
    expect(s.last30Days).toEqual({ authenticated: 13, guest: 7 });
    expect(s.total).toEqual({ authenticated: 40, guest: 70 });
    expect(s.daily).toHaveLength(14);
    expect(s.daily[13]).toEqual({ day: '2026-11-06', authenticated: 3, guest: 5 });
  });
});
