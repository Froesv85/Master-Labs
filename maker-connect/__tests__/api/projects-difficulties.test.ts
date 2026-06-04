import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: jest.fn() },
    projectDifficulty: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/projects/[id]/difficulties/route';

const mockDifficulty = {
  id: 1,
  description: 'Calibração dos sensores ultrassônicos',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/projects/[id]/difficulties', () => {
  afterEach(() => jest.clearAllMocks());

  it('retorna lista de dificuldades com status 200', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.projectDifficulty.findMany as jest.Mock).mockResolvedValue([mockDifficulty]);

    const res = await GET(makeRequest('http://localhost:3000/api/projects/1/difficulties'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].description).toBe('Calibração dos sensores ultrassônicos');
  });

  it('retorna 404 quando projeto não existe', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest('http://localhost:3000/api/projects/99/difficulties'), {
      params: Promise.resolve({ id: '99' }),
    });
    expect(res.status).toBe(404);
  });

  it('retorna 400 para id inválido', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/projects/abc/difficulties'), {
      params: Promise.resolve({ id: 'abc' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/projects/[id]/difficulties', () => {
  afterEach(() => jest.clearAllMocks());

  it('cria dificuldade e retorna 201', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.projectDifficulty.create as jest.Mock).mockResolvedValue(mockDifficulty);

    const req = makeRequest('http://localhost:3000/api/projects/1/difficulties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Calibração dos sensores ultrassônicos' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.description).toBe('Calibração dos sensores ultrassônicos');
  });

  it('retorna 400 quando descrição está vazia', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

    const req = makeRequest('http://localhost:3000/api/projects/1/difficulties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: '   ' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/description/i);
  });

  it('retorna 404 quando projeto não existe no POST', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    const req = makeRequest('http://localhost:3000/api/projects/99/difficulties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Algo difícil' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: '99' }) });
    expect(res.status).toBe(404);
  });

  it('retorna 400 para id inválido no POST', async () => {
    const req = makeRequest('http://localhost:3000/api/projects/abc/difficulties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Algo' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'abc' }) });
    expect(res.status).toBe(400);
  });
});
