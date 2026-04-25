import { NextRequest } from 'next/server';

// ── Mock Prisma ────────────────────────────────────────────────────────────────
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/projects/route';

const mockProject = {
  id: 1,
  title: 'RoboSumo v2',
  description: 'Robô de sumô com sensor ultrassônico',
  category: 'Robotics' as const,
  creatorId: 1,
  creator: { id: 1, name: 'Alice Maker' },
  parentId: null,
  createdAt: new Date('2026-04-20T10:00:00Z'),
  updatedAt: new Date('2026-04-20T10:00:00Z'),
  _count: { votes: 5 },
};

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// ── GET /api/projects ──────────────────────────────────────────────────────────

describe('GET /api/projects', () => {
  beforeEach(() => {
    (prisma.project.count as jest.Mock).mockResolvedValue(1);
    (prisma.project.findMany as jest.Mock).mockResolvedValue([mockProject]);
  });

  afterEach(() => jest.clearAllMocks());

  it('retorna lista de projetos com paginação padrão', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/projects'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('RoboSumo v2');
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.total).toBe(1);
  });

  it('mapeia Printing3D para category=3D_Printing na query', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/projects?category=3D_Printing'));
    expect(res.status).toBe(200);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ category: 'Printing3D' }) })
    );
  });

  it('retorna 400 para categoria inválida', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/projects?category=INVALID'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid category/i);
  });

  it('retorna 400 para sort inválido', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/projects?sort=random'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid sort/i);
  });

  it('retorna 400 para page=0', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/projects?page=0'));
    expect(res.status).toBe(400);
  });

  it('limita pageSize ao máximo de 50', async () => {
    await GET(makeRequest('http://localhost:3000/api/projects?pageSize=999'));
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });
});

// ── POST /api/projects ─────────────────────────────────────────────────────────

describe('POST /api/projects', () => {
  afterEach(() => jest.clearAllMocks());

  it('cria projeto e retorna 201', async () => {
    (prisma.project.create as jest.Mock).mockResolvedValue({
      id: 2,
      title: 'Braço Robótico',
      category: 'Robotics',
      createdAt: new Date(),
    });

    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Braço Robótico', category: 'Robotics' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('Braço Robótico');
  });

  it('retorna 400 quando título está vazio', async () => {
    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ', category: 'Robotics' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/título/i);
  });

  it('retorna 400 para categoria inválida no POST', async () => {
    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Projeto X', category: 'DESCONHECIDA' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
