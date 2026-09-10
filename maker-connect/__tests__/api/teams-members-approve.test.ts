import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    team: { findUnique: jest.fn() },
    teamMember: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PATCH } from '@/app/api/teams/[id]/members/[userId]/route';

const mockOwnerSession = { userId: 1, email: 'owner@test.com', name: 'Owner' };
const mockMemberSession = { userId: 5, email: 'member@test.com', name: 'Member' };

const mockTeam = { id: 2 };
const mockOwnerMembership = { role: 'owner' };
const mockAdminMembership = { role: 'admin' };
const mockMemberMembership = { role: 'member' };
const mockPendingTarget = { id: 99, status: 'pending' };
const mockApprovedTarget = { id: 100, status: 'approved' };

function makeRequest(teamId: string, userId: string, body: unknown) {
  return new NextRequest(
    `http://localhost:3000/api/teams/${teamId}/members/${userId}`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
}

const params = (id: string, userId: string) => Promise.resolve({ id, userId });

afterEach(() => jest.clearAllMocks());

describe('PATCH /api/teams/[id]/members/[userId]', () => {
  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(makeRequest('2', '9', { action: 'approve' }), { params: params('2', '9') });
    expect(res.status).toBe(401);
  });

  it('retorna 400 para action inválida', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockOwnerSession);
    const res = await PATCH(makeRequest('2', '9', { action: 'ban' }), { params: params('2', '9') });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando equipe não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockOwnerSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(makeRequest('99', '9', { action: 'approve' }), { params: params('99', '9') });
    expect(res.status).toBe(404);
  });

  it('retorna 403 para membro comum tentando aprovar', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockMemberSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership);
    const res = await PATCH(makeRequest('2', '9', { action: 'approve' }), { params: params('2', '9') });
    expect(res.status).toBe(403);
  });

  it('retorna 404 quando solicitação de membership não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockOwnerSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teamMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockOwnerMembership)
      .mockResolvedValueOnce(null);
    const res = await PATCH(makeRequest('2', '99', { action: 'approve' }), { params: params('2', '99') });
    expect(res.status).toBe(404);
  });

  it('retorna 409 quando membership já está approved', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockOwnerSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teamMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockOwnerMembership)
      .mockResolvedValueOnce(mockApprovedTarget);
    const res = await PATCH(makeRequest('2', '9', { action: 'approve' }), { params: params('2', '9') });
    expect(res.status).toBe(409);
  });

  it('owner aprova solicitação pendente com sucesso', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockOwnerSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teamMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockOwnerMembership)
      .mockResolvedValueOnce(mockPendingTarget);
    (prisma.teamMember.update as jest.Mock).mockResolvedValue({
      id: 99, teamId: 2, userId: 9, role: 'member', status: 'approved',
    });

    const res = await PATCH(makeRequest('2', '9', { action: 'approve' }), { params: params('2', '9') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('approved');
  });

  it('admin rejeita solicitação pendente com sucesso', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockMemberSession);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teamMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockAdminMembership)
      .mockResolvedValueOnce(mockPendingTarget);
    (prisma.teamMember.update as jest.Mock).mockResolvedValue({
      id: 99, teamId: 2, userId: 9, role: 'member', status: 'rejected',
    });

    const res = await PATCH(makeRequest('2', '9', { action: 'reject' }), { params: params('2', '9') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('rejected');
  });
});
