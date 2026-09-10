import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    team: { findUnique: jest.fn() },
    teamMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { POST, GET } from '@/app/api/teams/[id]/members/route';

const mockSession = { userId: 5, email: 'maker@test.com', name: 'Maker' };
const mockPublicTeam = { id: 1, isPublic: true };
const mockPrivateTeam = { id: 2, isPublic: false };

const params = (id: string) => Promise.resolve({ id });

function makePostRequest(id: string, body?: unknown) {
  return new NextRequest(`http://localhost:3000/api/teams/${id}/members`, {
    method: 'POST',
    ...(body !== undefined
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  });
}

function makeGetRequest(id: string, qs = '') {
  return new NextRequest(new URL(`http://localhost:3000/api/teams/${id}/members${qs}`));
}

afterEach(() => jest.clearAllMocks());

// ─── POST (self-affiliation) ───────────────────────────────────────────────

describe('POST /api/teams/[id]/members — auto-afiliação', () => {
  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makePostRequest('1'), { params: params('1') });
    expect(res.status).toBe(401);
  });

  it('retorna 400 para teamId inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const res = await POST(makePostRequest('abc'), { params: params('abc') });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando equipe não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(makePostRequest('1'), { params: params('1') });
    expect(res.status).toBe(404);
  });

  it('retorna 409 quando já é membro', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockPublicTeam);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ id: 10, status: 'approved' });
    const res = await POST(makePostRequest('1'), { params: params('1') });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.status).toBe('approved');
  });

  it('cria membro com status approved em equipe pública', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockPublicTeam);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.teamMember.create as jest.Mock).mockResolvedValue({
      id: 20, teamId: 1, userId: 5, role: 'member', status: 'approved', joinedAt: new Date(),
    });

    const res = await POST(makePostRequest('1'), { params: params('1') });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe('approved');
    expect(prisma.teamMember.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 5, status: 'approved' }) })
    );
  });

  it('cria solicitação com status pending em equipe privada', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockPrivateTeam);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.teamMember.create as jest.Mock).mockResolvedValue({
      id: 21, teamId: 2, userId: 5, role: 'member', status: 'pending', joinedAt: new Date(),
    });

    const res = await POST(makePostRequest('2'), { params: params('2') });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe('pending');
    expect(prisma.teamMember.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'pending' }) })
    );
  });
});

// ─── POST (adicionar membro direto) ────────────────────────────────────────

describe('POST /api/teams/[id]/members — adicionar membro direto', () => {
  it('retorna 403 quando quem chama não é owner/admin', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockPrivateTeam);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });
    const res = await POST(makePostRequest('2', { userId: 42 }), { params: params('2') });
    expect(res.status).toBe(403);
  });

  it('owner adiciona membro direto com status approved, mesmo em equipe privada', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockPrivateTeam);
    (prisma.teamMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ role: 'owner' }) // caller membership check
      .mockResolvedValueOnce(null); // existing membership for target
    (prisma.teamMember.create as jest.Mock).mockResolvedValue({
      id: 30, teamId: 2, userId: 42, role: 'member', status: 'approved', joinedAt: new Date(),
      user: { id: 42, name: 'Bob' },
    });

    const res = await POST(makePostRequest('2', { userId: 42 }), { params: params('2') });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe('approved');
    expect(prisma.teamMember.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 42, status: 'approved' }) })
    );
  });
});

// ─── GET ─────────────────────────────────────────────────────────────────────

describe('GET /api/teams/[id]/members', () => {
  it('retorna 400 para teamId inválido', async () => {
    const res = await GET(makeGetRequest('xyz'), { params: params('xyz') });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando equipe não existe', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest('1'), { params: params('1') });
    expect(res.status).toBe(404);
  });

  it('lista membros aprovados sem auth', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockPublicTeam);
    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([
      { id: 1, userId: 3, role: 'owner', status: 'approved', joinedAt: new Date(), user: { id: 3, name: 'Alice' } },
    ]);

    const res = await GET(makeGetRequest('1'), { params: params('1') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'approved' }) })
    );
  });

  it('retorna 403 para membro comum que tenta ver pendentes', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockPublicTeam);
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });
    const res = await GET(makeGetRequest('1', '?status=pending'), { params: params('1') });
    expect(res.status).toBe(403);
  });

  it('admin vê solicitações pendentes com ?status=pending', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockPrivateTeam);
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'admin' });
    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([
      { id: 30, userId: 9, role: 'member', status: 'pending', joinedAt: new Date(), user: { id: 9, name: 'Bob' } },
    ]);

    const res = await GET(makeGetRequest('2', '?status=pending'), { params: params('2') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].status).toBe('pending');
  });
});
