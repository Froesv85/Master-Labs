import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    communityPost: { deleteMany: jest.fn() },
    communityMember: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, DELETE } from '@/app/api/communities/[id]/route';

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

describe('DELETE /api/communities/[id]', () => {
  afterEach(() => jest.clearAllMocks());

  function makeDeleteRequest(url: string) {
    return new NextRequest(new URL(url, 'http://localhost:3000'), { method: 'DELETE' });
  }

  it('retorna 401 quando não autenticado', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/communities/1'), { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando quem pede não é o fundador', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 2 });
    (prisma.community.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/communities/1'), { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(403);
  });

  it('retorna 404 quando a comunidade não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/communities/99'), { params: Promise.resolve({ id: '99' }) });
    expect(res.status).toBe(404);
  });

  it('exclui a comunidade quando o fundador solicita, removendo posts e membros', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.community.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/communities/1'), { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    expect(prisma.communityPost.deleteMany).toHaveBeenCalledWith({ where: { communityId: 1 } });
    expect(prisma.communityMember.deleteMany).toHaveBeenCalledWith({ where: { communityId: 1 } });
    expect(prisma.community.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
