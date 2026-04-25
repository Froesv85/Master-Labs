import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    robot: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/robots/[id]/route';

const mockRobot = {
  id: 1,
  name: 'TitanBot',
  description: 'Robô de combate peso médio',
  category: 'combat',
  ownerId: 1,
  owner: { id: 1, name: 'Bob Builder' },
  eloScore: 1250,
  wins: 10,
  losses: 2,
  draws: 1,
  awards: [],
  matches: [],
  participations: [],
};

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/robots/[id]', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna robô com status 200', async () => {
    (prisma.robot.findUnique as jest.Mock).mockResolvedValue(mockRobot);

    const res = await GET(makeRequest('http://localhost:3000/api/robots/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('TitanBot');
  });

  it('retorna 404 quando robô não existe', async () => {
    (prisma.robot.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest('http://localhost:3000/api/robots/99'), {
      params: Promise.resolve({ id: '99' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it('retorna 400 para id inválido', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/robots/abc'), {
      params: Promise.resolve({ id: 'abc' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });
});
