import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    team: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/teams/[id]/route';

const mockTeam = {
  id: 1,
  name: 'Robô Warriors',
  isPublic: true,
  owner: { id: 1, name: 'Alice Maker' },
  members: [],
};

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/teams/[id]', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna equipe com status 200', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);

    const res = await GET(makeRequest('http://localhost:3000/api/teams/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Robô Warriors');
  });

  it('retorna 404 quando equipe não existe', async () => {
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest('http://localhost:3000/api/teams/99'), {
      params: Promise.resolve({ id: '99' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it('retorna 400 para id inválido', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/teams/abc'), {
      params: Promise.resolve({ id: 'abc' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });
});
