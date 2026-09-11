import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    team: { findUnique: jest.fn() },
    teamMember: { findUnique: jest.fn() },
    robot: { count: jest.fn() },
    competition: { findMany: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, POST } from '@/app/api/teams/[id]/competitions/route';

const mockSession = { userId: 1, email: 'owner@test.com', name: 'Owner' };
const mockTeam = { id: 2 };

const params = (id: string) => Promise.resolve({ id });

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/teams/${id}/competitions`);
}

function makePostRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost:3000/api/teams/${id}/competitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => jest.clearAllMocks());

describe('GET /api/teams/[id]/competitions', () => {
  it('retorna 400 para teamId inválido', async () => {
    const res = await GET(makeGetRequest('abc'), { params: params('abc') });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando equipe não existe', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest('2'), { params: params('2') });
    expect(res.status).toBe(404);
  });

  it('lista competições sem exigir sessão', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.competition.findMany as jest.Mock).mockResolvedValue([
      { id: 10, name: 'RobôChallenge', eventDate: new Date(), result: null },
    ]);
    const res = await GET(makeGetRequest('2'), { params: params('2') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(getSession).not.toHaveBeenCalled();
  });
});

describe('POST /api/teams/[id]/competitions', () => {
  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makePostRequest('2', { name: 'X', eventDate: '2026-10-01' }), { params: params('2') });
    expect(res.status).toBe(401);
  });

  it('retorna 403 para membro comum', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });
    const res = await POST(makePostRequest('2', { name: 'X', eventDate: '2026-10-01' }), { params: params('2') });
    expect(res.status).toBe(403);
  });

  it('retorna 400 quando falta nome', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'owner' });
    const res = await POST(makePostRequest('2', { name: '  ', eventDate: '2026-10-01' }), { params: params('2') });
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando um robô não pertence à equipe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'owner' });
    (prisma.robot.count as jest.Mock).mockResolvedValue(0);
    const res = await POST(
      makePostRequest('2', { name: 'RobôChallenge', eventDate: '2026-10-01', robotIds: [99] }),
      { params: params('2') }
    );
    expect(res.status).toBe(400);
  });

  it('owner cria competição com sucesso', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'owner' });
    (prisma.robot.count as jest.Mock).mockResolvedValue(1);
    (prisma.competition.create as jest.Mock).mockResolvedValue({
      id: 10, teamId: 2, name: 'RobôChallenge', eventDate: new Date('2026-10-01'), result: null,
    });

    const res = await POST(
      makePostRequest('2', { name: 'RobôChallenge', eventDate: '2026-10-01', robotIds: [5] }),
      { params: params('2') }
    );
    expect(res.status).toBe(201);
    expect(prisma.competition.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ teamId: 2, createdById: 1, robots: { connect: [{ id: 5 }] } }),
      })
    );
  });
});
