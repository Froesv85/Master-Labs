import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    userFollow: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

jest.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS: { followByUser: { name: 'follow-user', limit: 60, windowSeconds: 3600 } },
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
  tooManyRequests: jest.fn(() => new Response(JSON.stringify({ error: 'Muitas tentativas' }), { status: 429 })),
}));

jest.mock('@/lib/reputation', () => ({
  syncReputation: jest.fn().mockResolvedValue({ total: 5, level: 'apprentice', nextLevel: null, breakdown: [] }),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { syncReputation } from '@/lib/reputation';
import { POST, DELETE } from '@/app/api/users/[id]/follow/route';
import { GET as CONNECTIONS } from '@/app/api/users/[id]/connections/route';

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (url = 'http://localhost:3000/api/users/2/follow', method = 'POST') =>
  new NextRequest(new URL(url), { method });

beforeEach(() => {
  jest.clearAllMocks();
  (checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
});

describe('POST/DELETE /api/users/[id]/follow', () => {
  it('401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    expect((await POST(req(), ctx('2'))).status).toBe(401);
    expect((await DELETE(req(undefined, 'DELETE'), ctx('2'))).status).toBe(401);
    expect(prisma.userFollow.upsert).not.toHaveBeenCalled();
  });

  it('400 ao tentar seguir a si mesmo', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 2 });
    expect((await POST(req(), ctx('2'))).status).toBe(400);
    expect(prisma.userFollow.upsert).not.toHaveBeenCalled();
  });

  it('400 para id inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    expect((await POST(req(), ctx('abc'))).status).toBe(400);
  });

  it('404 quando o usuário alvo não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    expect((await POST(req(), ctx('99'))).status).toBe(404);
  });

  it('429 quando estoura o limite', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (checkRateLimit as jest.Mock).mockResolvedValue({ allowed: false, retryAfterSeconds: 60 });
    expect((await POST(req(), ctx('2'))).status).toBe(429);
    expect(prisma.userFollow.upsert).not.toHaveBeenCalled();
  });

  it('segue usando o usuário da sessão e recalcula a reputação do alvo', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 2 });
    (prisma.userFollow.count as jest.Mock).mockResolvedValue(1);

    const res = await POST(req(), ctx('2'));
    expect(res.status).toBe(200);
    expect(prisma.userFollow.upsert).toHaveBeenCalledWith({
      where: { followerId_followingId: { followerId: 1, followingId: 2 } },
      create: { followerId: 1, followingId: 2 },
      update: {},
    });
    expect(syncReputation).toHaveBeenCalledWith(2);
    expect(await res.json()).toEqual({ following: true, followers: 1, reputation: 5, makerLevel: 'apprentice' });
  });

  it('deixa de seguir', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 2 });
    (prisma.userFollow.count as jest.Mock).mockResolvedValue(0);

    const res = await DELETE(req(undefined, 'DELETE'), ctx('2'));
    expect(res.status).toBe(200);
    expect(prisma.userFollow.deleteMany).toHaveBeenCalledWith({ where: { followerId: 1, followingId: 2 } });
    expect((await res.json()).following).toBe(false);
  });
});

describe('GET /api/users/[id]/connections', () => {
  const url = (type: string) => `http://localhost:3000/api/users/2/connections?type=${type}`;

  it('401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    expect((await CONNECTIONS(req(url('followers'), 'GET'), ctx('2'))).status).toBe(401);
  });

  it('400 para type inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    expect((await CONNECTIONS(req(url('tudo'), 'GET'), ctx('2'))).status).toBe(400);
  });

  it('lista seguidores sem dados sensíveis e marca quem eu já sigo', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.userFollow.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { createdAt: new Date('2026-11-01'), follower: { id: 3, name: 'Bia', profile: null } },
        { createdAt: new Date('2026-11-02'), follower: { id: 1, name: 'Eu', profile: null } },
      ])
      .mockResolvedValueOnce([{ followingId: 3 }]);

    const res = await CONNECTIONS(req(url('followers'), 'GET'), ctx('2'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((r: { user: { id: number }; followedByMe: boolean; isMe: boolean }) => [r.user.id, r.followedByMe, r.isMe]))
      .toEqual([[3, true, false], [1, false, true]]);

    // select explicito: nada de email/role/password no card do usuario
    const select = (prisma.userFollow.findMany as jest.Mock).mock.calls[0][0].select.follower.select;
    expect(Object.keys(select).sort()).toEqual(['id', 'name', 'profile']);
  });
});
