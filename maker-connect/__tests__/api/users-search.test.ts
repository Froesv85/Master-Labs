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

describe('privacidade na busca de usuários', () => {
  afterEach(() => jest.clearAllMocks());

  it('busca parcial não devolve e-mails e só procura e-mail por igualdade', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 2, name: 'Alice Maker', email: 'alice@test.com' }]);
    const res = await GET(makeRequest('?q=@test'));
    const body = await res.json();
    expect(body.data[0].email).toBeNull();
    const { where } = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
    expect(where.OR).toContainEqual({ email: '@test' });
    expect(JSON.stringify(where)).not.toContain('"email":{"contains"');
  });

  it('devolve o e-mail só para quem digitou o endereço exato', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 2, name: null, email: 'alice@test.com' }]);
    const res = await GET(makeRequest('?q=Alice@Test.com'));
    const body = await res.json();
    expect(body.data[0].email).toBe('alice@test.com');
  });
});
