import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    teamMember: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, PATCH } from '@/app/api/users/[id]/route';

const mockUser = {
  id: 1,
  name: 'Alice Maker',
  email: 'alice@example.com',
  profile: null,
  badges: [],
  robots: [],
  projects: [],
  sharedProjects: [],
  ownedTeams: [],
  teamMemberships: [],
  communities: [],
  following: [],
  followers: [],
};

beforeEach(() => {
  (getSession as jest.Mock).mockResolvedValue({ userId: 1, email: 'alice@example.com', name: 'Alice Maker' });
  (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([]);
});

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/users/[id]', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna usuário com status 200', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await GET(makeRequest('http://localhost:3000/api/users/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Alice Maker');
  });

  it('retorna 404 quando usuário não existe', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest('http://localhost:3000/api/users/99'), {
      params: Promise.resolve({ id: '99' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it('retorna 400 para id inválido', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/users/abc'), {
      params: Promise.resolve({ id: 'abc' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });
});

describe('PATCH /api/users/[id]', () => {
  afterEach(() => jest.clearAllMocks());

  it('atualiza usuário e retorna 200', async () => {
    const updated = { ...mockUser, name: 'Alice Updated', profile: null };
    (prisma.$transaction as jest.Mock).mockResolvedValue([updated]);

    const req = makeRequest('http://localhost:3000/api/users/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Updated' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Alice Updated');
  });

  it('retorna 400 para id inválido no PATCH', async () => {
    const req = makeRequest('http://localhost:3000/api/users/abc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc' }) });
    expect(res.status).toBe(400);
  });
});

describe('privacidade e permissões em /api/users/[id]', () => {
  afterEach(() => jest.clearAllMocks());

  it('GET sem sessão responde 401', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest('http://localhost:3000/api/users/1'), { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });

  it('GET nunca seleciona senha nem IDs de OAuth', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    await GET(makeRequest('http://localhost:3000/api/users/1'), { params: Promise.resolve({ id: '1' }) });
    const { select } = (prisma.user.findUnique as jest.Mock).mock.calls[0][0];
    expect(select.password).toBeUndefined();
    expect(select.googleId).toBeUndefined();
    expect(select.githubId).toBeUndefined();
    expect(select.role).toBeUndefined();
  });

  it('GET do perfil de outra pessoa esconde o e-mail', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 2, email: 'bob@example.com', name: 'Bob' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const res = await GET(makeRequest('http://localhost:3000/api/users/1'), { params: Promise.resolve({ id: '1' }) });
    const body = await res.json();
    expect(body.email).toBeNull();
  });

  it('PATCH sem sessão responde 401', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/users/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('PATCH no perfil de outra pessoa responde 403', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 2, email: 'bob@example.com', name: 'Bob' });
    const req = makeRequest('http://localhost:3000/api/users/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(403);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
