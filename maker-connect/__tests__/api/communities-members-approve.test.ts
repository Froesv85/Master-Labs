import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: { findUnique: jest.fn() },
    communityMember: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PATCH } from '@/app/api/communities/[id]/members/[userId]/route';

const mockFounderSession = { userId: 1, email: 'founder@test.com', name: 'Founder' };
const mockMemberSession = { userId: 5, email: 'member@test.com', name: 'Member' };

const mockCommunity = { id: 2 };
const mockFounderMembership = { role: 'founder' };
const mockModeratorMembership = { role: 'moderator' };
const mockMemberMembership = { role: 'member' };
const mockPendingTarget = { id: 99, status: 'pending' };
const mockApprovedTarget = { id: 100, status: 'approved' };

function makeRequest(communityId: string, userId: string, body: unknown) {
  return new NextRequest(
    `http://localhost:3000/api/communities/${communityId}/members/${userId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

const params = (id: string, userId: string) => Promise.resolve({ id, userId });

afterEach(() => jest.clearAllMocks());

describe('PATCH /api/communities/[id]/members/[userId]', () => {
  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(makeRequest('2', '9', { action: 'approve' }), {
      params: params('2', '9'),
    });
    expect(res.status).toBe(401);
  });

  it('retorna 400 para communityId inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockFounderSession);
    const res = await PATCH(makeRequest('abc', '9', { action: 'approve' }), {
      params: params('abc', '9'),
    });
    expect(res.status).toBe(400);
  });

  it('retorna 400 para userId inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockFounderSession);
    const res = await PATCH(makeRequest('2', 'xyz', { action: 'approve' }), {
      params: params('2', 'xyz'),
    });
    expect(res.status).toBe(400);
  });

  it('retorna 400 para body JSON inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockFounderSession);
    const req = new NextRequest('http://localhost:3000/api/communities/2/members/9', {
      method: 'PATCH',
      body: 'not-json',
    });
    const res = await PATCH(req, { params: params('2', '9') });
    expect(res.status).toBe(400);
  });

  it('retorna 400 para action inválida', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockFounderSession);
    const res = await PATCH(makeRequest('2', '9', { action: 'ban' }), {
      params: params('2', '9'),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/approve.*reject/i);
  });

  it('retorna 404 quando comunidade não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockFounderSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(makeRequest('99', '9', { action: 'approve' }), {
      params: params('99', '9'),
    });
    expect(res.status).toBe(404);
  });

  it('retorna 403 para membro comum tentando aprovar', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockMemberSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership);
    const res = await PATCH(makeRequest('2', '9', { action: 'approve' }), {
      params: params('2', '9'),
    });
    expect(res.status).toBe(403);
  });

  it('retorna 403 para quem não é membro da comunidade', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockMemberSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(makeRequest('2', '9', { action: 'approve' }), {
      params: params('2', '9'),
    });
    expect(res.status).toBe(403);
  });

  it('retorna 404 quando solicitação de membership não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockFounderSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity);
    (prisma.communityMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockFounderMembership) // caller
      .mockResolvedValueOnce(null); // target
    const res = await PATCH(makeRequest('2', '99', { action: 'approve' }), {
      params: params('2', '99'),
    });
    expect(res.status).toBe(404);
  });

  it('retorna 409 quando membership já está approved', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockFounderSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity);
    (prisma.communityMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockFounderMembership)
      .mockResolvedValueOnce(mockApprovedTarget);
    const res = await PATCH(makeRequest('2', '9', { action: 'approve' }), {
      params: params('2', '9'),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/approved/i);
  });

  it('founder aprova solicitação pendente com sucesso', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockFounderSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity);
    (prisma.communityMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockFounderMembership)
      .mockResolvedValueOnce(mockPendingTarget);
    (prisma.communityMember.update as jest.Mock).mockResolvedValue({
      id: 99,
      communityId: 2,
      userId: 9,
      role: 'member',
      status: 'approved',
    });

    const res = await PATCH(makeRequest('2', '9', { action: 'approve' }), {
      params: params('2', '9'),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('approved');
    expect(prisma.communityMember.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'approved' } })
    );
  });

  it('moderador rejeita solicitação pendente com sucesso', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockMemberSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity);
    (prisma.communityMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockModeratorMembership)
      .mockResolvedValueOnce(mockPendingTarget);
    (prisma.communityMember.update as jest.Mock).mockResolvedValue({
      id: 99,
      communityId: 2,
      userId: 9,
      role: 'member',
      status: 'rejected',
    });

    const res = await PATCH(makeRequest('2', '9', { action: 'reject' }), {
      params: params('2', '9'),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('rejected');
    expect(prisma.communityMember.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'rejected' } })
    );
  });
});
