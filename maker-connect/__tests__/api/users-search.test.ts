import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET } from '@/app/api/users/search/route';

const mockSession = { userId: 1, email: 'me@test.com', name: 'Me' };

function makeRequest(qs: string) {
  return new NextRequest(new URL(`http://localhost:3000/api/users/search${qs}`));
}

afterEach(() => jest.clearAllMocks());

describe('GET /api/users/search', () => {
  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest('?q=alice'));
    expect(res.status).toBe(401);
  });

  it('retorna lista vazia para query curta', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const res = await GET(makeRequest('?q=a'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('busca por nome ou email', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 2, name: 'Alice Maker', email: 'alice@test.com' },
    ]);
    const res = await GET(makeRequest('?q=alice'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Alice Maker');
  });
});
