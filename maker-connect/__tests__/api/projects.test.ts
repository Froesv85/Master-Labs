import { NextRequest } from 'next/server';

// ── Mock Prisma ────────────────────────────────────────────────────────────────
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    teamMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn().mockResolvedValue({ userId: 1 }),
}));

jest.mock('@/lib/project-media', () => ({
  uploadProjectImage: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, POST } from '@/app/api/projects/route';

const mockProject = {
  id: 1,
  title: 'RoboSumo v2',
  description: 'Robô de sumô com sensor ultrassônico',
  tags: [{ tag: 'Robotics' as const }],
  visibility: 'public',
  teamId: null,
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
    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('retorna lista de projetos com paginação padrão', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/projects'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('RoboSumo v2');
    expect(body.data[0].tags).toEqual(['Robotics']);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.total).toBe(1);
  });

  it('mapeia Printing3D para tag=3D_Printing na query', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/projects?tag=3D_Printing'));
    expect(res.status).toBe(200);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([{ tags: { some: { tag: 'Printing3D' } } }]),
        }),
      })
    );
  });

  it('retorna 400 para tag inválida', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/projects?tag=INVALID'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid tag/i);
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

  it('retorna 401 quando não autenticado', async () => {
    (getSession as jest.Mock).mockResolvedValueOnce(null);
    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Projeto X', tags: ['Robotics'] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('cria projeto e retorna 201', async () => {
    (prisma.project.create as jest.Mock).mockResolvedValue({
      id: 2,
      title: 'Braço Robótico',
      visibility: 'public',
      teamId: null,
      createdAt: new Date(),
      tags: [{ tag: 'Robotics' }],
    });

    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Braço Robótico', tags: ['Robotics'] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('Braço Robótico');
    expect(body.tags).toEqual(['Robotics']);
  });

  it('retorna 400 quando título está vazio', async () => {
    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ', tags: ['Robotics'] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/título/i);
  });

  it('retorna 400 quando nenhuma tag é selecionada', async () => {
    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Projeto X', tags: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 para tag inválida no POST', async () => {
    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Projeto X', tags: ['DESCONHECIDA'] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('cria projeto privado de equipe quando o usuário é membro aprovado', async () => {
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ status: 'approved' });
    (prisma.project.create as jest.Mock).mockResolvedValue({
      id: 3, title: 'Projeto da Equipe', visibility: 'private_team', teamId: 7, createdAt: new Date(),
      tags: [{ tag: 'Robotics' }],
    });

    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Projeto da Equipe', tags: ['Robotics'], visibility: 'private_team', teamId: 7 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ visibility: 'private_team', teamId: 7 }) })
    );
  });

  it('retorna 403 ao criar projeto privado de equipe sem ser membro aprovado', async () => {
    (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(null);

    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Projeto da Equipe', tags: ['Robotics'], visibility: 'private_team', teamId: 7 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('retorna 400 ao criar projeto privado de equipe sem informar teamId', async () => {
    const req = makeRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Projeto da Equipe', tags: ['Robotics'], visibility: 'private_team' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
