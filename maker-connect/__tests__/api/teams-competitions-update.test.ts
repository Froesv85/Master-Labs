import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    teamMember: { findUnique: jest.fn() },
    robot: { count: jest.fn() },
    competition: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PATCH } from '@/app/api/teams/[id]/competitions/[competitionId]/route';

const mockOwnerSession = { userId: 1, email: 'owner@test.com', name: 'Owner' };
const mockMemberSession = { userId: 5, email: 'member@test.com', name: 'Member' };
const mockCompetition = { id: 10, teamId: 2 };

const params = (id: string, competitionId: string) => Promise.resolve({ id, competitionId });

function makeRequest(id: string, competitionId: string, body: unknown) {
  return new NextRequest(`http://localhost:3000/api/teams/${id}/competitions/${competitionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => jest.clearAllMocks());

describe('PATCH /api/teams/[id]/competitions/[competitionId]', () => {
  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(makeRequest('2', '10', { result: 'Campeão' }), { params: params('2', '10') });
    expect(res.status).toBe(401);
  });

  it('retorna 404 quando a competição não pertence à equipe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockOwnerSession);
    (prisma.competition.findUnique as jest.Mock).mockResolvedValue({ id: 10, teamId: 3 });
    const res = await PATCH(makeRequest('2', '10', { result: 'Campeão' }), { params: params('2', '10') });
    expect(res.status).toBe(404);
  });

  it('retorna 403 para membro comum', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockMemberSession);
    (prisma.competition.findUnique as jest.Mock).mockResolvedValue(mockCompetition);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });
    const res = await PATCH(makeRequest('2', '10', { result: 'Campeão' }), { params: params('2', '10') });
    expect(res.status).toBe(403);
  });

  it('owner publica resultado e seta publishedAt', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockOwnerSession);
    (prisma.competition.findUnique as jest.Mock).mockResolvedValue(mockCompetition);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'owner' });
    (prisma.competition.update as jest.Mock).mockResolvedValue({
      id: 10, result: 'Campeão', placement: 1, publishedAt: new Date(),
    });

    const res = await PATCH(makeRequest('2', '10', { result: 'Campeão', placement: 1 }), { params: params('2', '10') });
    expect(res.status).toBe(200);
    expect(prisma.competition.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ result: 'Campeão', placement: 1, publishedAt: expect.any(Date) }),
      })
    );
  });

  it('retorna 400 ao vincular robô de outra equipe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockOwnerSession);
    (prisma.competition.findUnique as jest.Mock).mockResolvedValue(mockCompetition);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ role: 'admin' });
    (prisma.robot.count as jest.Mock).mockResolvedValue(0);

    const res = await PATCH(makeRequest('2', '10', { robotIds: [99] }), { params: params('2', '10') });
    expect(res.status).toBe(400);
  });
});
