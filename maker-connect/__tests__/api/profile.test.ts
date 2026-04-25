import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET, PATCH } from '@/app/api/profile/route';

const mockProfileUser = {
  id: 1,
  name: 'Alice Maker',
  email: 'alice@example.com',
  language: 'pt',
  projects: [
    {
      id: 1,
      title: 'RoboSumo v2',
      description: 'Robô de sumô',
      category: 'Robotics',
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { votes: 5 },
    },
  ],
};

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/profile', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna perfil pelo e-mail padrão com status 200', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProfileUser);

    const res = await GET(makeRequest('http://localhost:3000/api/profile'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.maker.name).toBe('Alice Maker');
    expect(body.data.stats.projects).toBe(1);
    expect(body.data.stats.totalVotes).toBe(5);
  });

  it('retorna perfil por userId com status 200', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProfileUser);

    const res = await GET(makeRequest('http://localhost:3000/api/profile?userId=1'));
    expect(res.status).toBe(200);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
  });

  it('retorna 400 para userId inválido', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/profile?userId=abc'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });

  it('retorna 404 quando usuário não existe', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest('http://localhost:3000/api/profile?email=nao@existe.com'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });
});

describe('PATCH /api/profile', () => {
  afterEach(() => jest.clearAllMocks());

  it('atualiza idioma e retorna 200', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockProfileUser, language: 'en' });

    const req = makeRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, language: 'en' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.language).toBe('en');
  });

  it('retorna 400 quando userId ou language estão ausentes', async () => {
    const req = makeRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1 }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing/i);
  });
});
