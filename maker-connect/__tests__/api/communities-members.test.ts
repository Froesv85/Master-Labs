import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: { findUnique: jest.fn() },
    communityMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { POST, GET } from '@/app/api/communities/[id]/members/route';

const mockSession = { userId: 5, email: 'maker@test.com', name: 'Maker' };
const mockPublicCommunity = { id: 1, isPublic: true };
const mockPrivateCommunity = { id: 2, isPublic: false };

const params = (id: string) => Promise.resolve({ id });

function makePostRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/communities/${id}/members`, {
    method: 'POST',
  });
}

function makeGetRequest(id: string, qs = '') {
  return new NextRequest(new URL(`http://localhost:3000/api/communities/${id}/members${qs}`));
}

afterEach(() => jest.clearAllMocks());

// ─── POST ────────────────────────────────────────────────────────────────────

describe('POST /api/communities/[id]/members', () => {
  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makePostRequest('1'), { params: params('1') });
    expect(res.status).toBe(401);
  });

  it('retorna 400 para communityId inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const res = await POST(makePostRequest('abc'), { params: params('abc') });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando comunidade não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(makePostRequest('1'), { params: params('1') });
    expect(res.status).toBe(404);
  });

  it('retorna 409 quando já é membro', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      status: 'approved',
    });
    const res = await POST(makePostRequest('1'), { params: params('1') });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.status).toBe('approved');
  });

  it('retorna 409 com status pending quando solicitação já existe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPrivateCommunity);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue({
      id: 11,
      status: 'pending',
    });
    const res = await POST(makePostRequest('2'), { params: params('2') });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.status).toBe('pending');
  });

  it('cria membro com status approved em comunidade pública', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.communityMember.create as jest.Mock).mockResolvedValue({
      id: 20,
      communityId: 1,
      userId: 5,
      role: 'member',
      status: 'approved',
      joinedAt: new Date(),
    });

    const res = await POST(makePostRequest('1'), { params: params('1') });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe('approved');
    expect(prisma.communityMember.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'approved' }) })
    );
  });

  it('cria solicitação com status pending em comunidade privada', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPrivateCommunity);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.communityMember.create as jest.Mock).mockResolvedValue({
      id: 21,
      communityId: 2,
      userId: 5,
      role: 'member',
      status: 'pending',
      joinedAt: new Date(),
    });

    const res = await POST(makePostRequest('2'), { params: params('2') });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe('pending');
    expect(prisma.communityMember.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'pending' }) })
    );
  });
});

// ─── GET ─────────────────────────────────────────────────────────────────────

describe('GET /api/communities/[id]/members', () => {
  it('retorna 400 para communityId inválido', async () => {
    const res = await GET(makeGetRequest('xyz'), { params: params('xyz') });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando comunidade não existe', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest('1'), { params: params('1') });
    expect(res.status).toBe(404);
  });

  it('lista membros aprovados sem auth para comunidade pública', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (prisma.communityMember.findMany as jest.Mock).mockResolvedValue([
      { id: 1, userId: 3, role: 'founder', status: 'approved', joinedAt: new Date(), user: { id: 3, name: 'Alice' } },
    ]);

    const res = await GET(makeGetRequest('1'), { params: params('1') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(prisma.communityMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'approved' }) })
    );
  });

  it('retorna 401 para ?status=pending sem auth', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest('1', '?status=pending'), { params: params('1') });
    expect(res.status).toBe(401);
  });

  it('retorna 403 para membro comum que tenta ver pendentes', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });
    const res = await GET(makeGetRequest('1', '?status=pending'), { params: params('1') });
    expect(res.status).toBe(403);
  });

  it('founder vê solicitações pendentes com ?status=pending', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPrivateCommunity);
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue({ role: 'founder' });
    (prisma.communityMember.findMany as jest.Mock).mockResolvedValue([
      { id: 30, userId: 9, role: 'member', status: 'pending', joinedAt: new Date(), user: { id: 9, name: 'Bob' } },
    ]);

    const res = await GET(makeGetRequest('2', '?status=pending'), { params: params('2') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].status).toBe('pending');
    expect(prisma.communityMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'pending' }) })
    );
  });
});
