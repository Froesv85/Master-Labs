import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    team: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, POST } from '@/app/api/teams/route';

const mockSession = { userId: 7, email: 'maker@test.com', name: 'Alice Maker' };

const mockTeam = {
  id: 1,
  name: 'Robô Warriors',
  description: 'Equipe de robótica competitiva',
  isPublic: true,
  ownerId: 7,
  owner: { id: 7, name: 'Alice Maker' },
  members: [{ user: { id: 7, name: 'Alice Maker' } }],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/teams', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna lista de equipes com status 200', async () => {
    (prisma.team.findMany as jest.Mock).mockResolvedValue([mockTeam]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].name).toBe('Robô Warriors');
  });

  it('não filtra por visibilidade — lista públicas e privadas', async () => {
    (prisma.team.findMany as jest.Mock).mockResolvedValue([]);

    await GET();
    const callArgs = (prisma.team.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs?.where).toBeUndefined();
  });
});

describe('POST /api/teams', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna 401 quando não autenticado', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    const req = makeRequest('http://localhost:3000/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Robô Warriors' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('cria equipe usando o dono da sessão e retorna 201', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.create as jest.Mock).mockResolvedValue(mockTeam);

    const req = makeRequest('http://localhost:3000/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Robô Warriors' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Robô Warriors');
    expect(prisma.team.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: mockSession.userId }),
      })
    );
  });

  it('retorna 400 quando nome está vazio', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);

    const req = makeRequest('http://localhost:3000/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/nome/i);
  });

  it('retorna 500 quando Prisma lança exceção', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.team.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = makeRequest('http://localhost:3000/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Equipe X' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
