import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/communities/[id]/route';

const mockCommunity = {
  id: 1,
  name: 'Makers de Robótica SP',
  description: 'Comunidade de robótica do estado de SP',
  category: 'Robotics',
  isPublic: true,
  creatorId: 1,
  creator: { id: 1, name: 'Alice Maker' },
  members: [],
  posts: [],
};

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/communities/[id]', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna comunidade com status 200', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity);

    const res = await GET(makeRequest('http://localhost:3000/api/communities/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Makers de Robótica SP');
  });

  it('retorna 404 quando comunidade não existe', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest('http://localhost:3000/api/communities/99'), {
      params: Promise.resolve({ id: '99' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it('retorna 400 para id inválido', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/communities/xyz'), {
      params: Promise.resolve({ id: 'xyz' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });
});
