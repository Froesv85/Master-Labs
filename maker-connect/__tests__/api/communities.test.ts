import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, POST } from '@/app/api/communities/route';

const mockSession = { userId: 7, email: 'maker@test.com', name: 'Alice Maker' };

const mockCommunity = {
  id: 1,
  name: 'Makers de Robótica SP',
  description: 'Comunidade de robótica do estado de SP',
  category: 'Robotics',
  isPublic: true,
  creatorId: 7,
  creator: { id: 7, name: 'Alice Maker' },
  _count: { members: 42, posts: 8 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/communities', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna lista de comunidades', async () => {
    (prisma.community.findMany as jest.Mock).mockResolvedValue([mockCommunity]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].name).toBe('Makers de Robótica SP');
  });

  it('não filtra por visibilidade — lista públicas e privadas', async () => {
    (prisma.community.findMany as jest.Mock).mockResolvedValue([]);

    await GET();
    const callArgs = (prisma.community.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs?.where).toBeUndefined();
  });
});

describe('POST /api/communities', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna 401 quando não autenticado', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    const req = makeRequest('http://localhost:3000/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Makers de Robótica SP', category: 'Robotics' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('cria comunidade usando o criador da sessão e retorna 201', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.create as jest.Mock).mockResolvedValue(mockCommunity);

    const req = makeRequest('http://localhost:3000/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Makers de Robótica SP', category: 'Robotics' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Makers de Robótica SP');
    expect(prisma.community.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ creatorId: mockSession.userId }),
      })
    );
  });

  it('retorna 400 quando nome está vazio', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);

    const req = makeRequest('http://localhost:3000/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', category: 'Robotics' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/nome/i);
  });

  it('retorna 400 para categoria inválida', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);

    const req = makeRequest('http://localhost:3000/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Comunidade X', category: 'INEXISTENTE' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/categoria/i);
  });
});
