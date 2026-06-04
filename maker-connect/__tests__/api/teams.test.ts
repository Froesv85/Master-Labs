import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    team: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/teams/route';

const mockTeam = {
  id: 1,
  name: 'Robô Warriors',
  description: 'Equipe de robótica competitiva',
  isPublic: true,
  ownerId: 1,
  owner: { id: 1, name: 'Alice Maker' },
  members: [{ user: { id: 1, name: 'Alice Maker' } }],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/teams', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna lista de equipes públicas com status 200', async () => {
    (prisma.team.findMany as jest.Mock).mockResolvedValue([mockTeam]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].name).toBe('Robô Warriors');
  });

  it('consulta apenas equipes públicas', async () => {
    (prisma.team.findMany as jest.Mock).mockResolvedValue([]);

    await GET();
    expect(prisma.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublic: true } })
    );
  });
});

describe('POST /api/teams', () => {
  afterEach(() => jest.clearAllMocks());

  it('cria equipe e retorna 201', async () => {
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
  });

  it('retorna 400 quando nome está vazio', async () => {
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
