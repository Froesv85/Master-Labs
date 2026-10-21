import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    teamMember: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
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
      tags: [{ tag: 'Robotics' }],
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { votes: 5 },
    },
  ],
};

beforeEach(() => {
  (getSession as jest.Mock).mockResolvedValue({ userId: 1, email: 'alice@example.com', name: 'Alice Maker' });
  (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([]);
});

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/profile', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna o perfil da sessão quando não há parâmetro', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProfileUser);

    const res = await GET(makeRequest('http://localhost:3000/api/profile'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.maker.name).toBe('Alice Maker');
    expect(body.data.stats.projects).toBe(1);
    expect(body.data.stats.totalVotes).toBe(5);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
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

    const res = await GET(makeRequest('http://localhost:3000/api/profile?userId=99'));
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

  it('retorna 400 quando language está ausente', async () => {
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

describe('privacidade e permissões em /api/profile', () => {
  afterEach(() => jest.clearAllMocks());

  it('GET sem sessão responde 401', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest('http://localhost:3000/api/profile'));
    expect(res.status).toBe(401);
  });

  it('GET por e-mail de outra pessoa responde 404 sem consultar o banco', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/profile?email=bob@example.com'));
    expect(res.status).toBe(404);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('GET do perfil de outra pessoa esconde e-mail e filtra projetos pela visibilidade', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockProfileUser, id: 2 });
    const res = await GET(makeRequest('http://localhost:3000/api/profile?userId=2'));
    const body = await res.json();
    expect(body.data.maker.email).toBeNull();
    const { select } = (prisma.user.findUnique as jest.Mock).mock.calls[0][0];
    expect(select.projects.where).toBeDefined();
  });

  it('PATCH ignora o userId do corpo e altera só a conta da sessão', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockProfileUser, language: 'en' });
    const req = makeRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 2, language: 'en' }),
    });
    await PATCH(req);
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
  });

  it('PATCH sem sessão responde 401', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'en' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
