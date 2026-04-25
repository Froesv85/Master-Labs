import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/communities/route';

const mockCommunity = {
  id: 1,
  name: 'Makers de Robótica SP',
  description: 'Comunidade de robótica do estado de SP',
  category: 'Robotics',
  isPublic: true,
  creatorId: 1,
  creator: { id: 1, name: 'Alice Maker' },
  _count: { members: 42, posts: 8 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/communities', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna lista de comunidades públicas', async () => {
    (prisma.community.findMany as jest.Mock).mockResolvedValue([mockCommunity]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].name).toBe('Makers de Robótica SP');
  });

  it('consulta apenas comunidades públicas', async () => {
    (prisma.community.findMany as jest.Mock).mockResolvedValue([]);

    await GET();
    expect(prisma.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublic: true } })
    );
  });
});

describe('POST /api/communities', () => {
  afterEach(() => jest.clearAllMocks());

  it('cria comunidade e retorna 201', async () => {
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
  });

  it('retorna 400 quando nome está vazio', async () => {
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
