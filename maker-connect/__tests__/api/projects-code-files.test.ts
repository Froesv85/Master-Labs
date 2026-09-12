import { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: jest.fn() },
    projectCodeFile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, POST } from '@/app/api/projects/[id]/code-files/route';
import { PATCH, DELETE } from '@/app/api/projects/[id]/code-files/[fileId]/route';

const mockSession = { userId: 1 };
const mockFile = { id: 7, projectId: 1, filename: 'main.ino', content: 'void setup(){}' };

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

const params = Promise.resolve({ id: '1' });
const fileParams = Promise.resolve({ id: '1', fileId: '7' });

afterEach(() => jest.clearAllMocks());

describe('GET /api/projects/[id]/code-files', () => {
  it('retorna 404 quando o projeto nao existe', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest('http://localhost:3000/api/projects/1/code-files'), { params });
    expect(res.status).toBe(404);
  });

  it('lista os arquivos do projeto', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.projectCodeFile.findMany as jest.Mock).mockResolvedValue([mockFile]);
    const res = await GET(makeRequest('http://localhost:3000/api/projects/1/code-files'), { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data).toEqual([mockFile]);
  });
});

describe('POST /api/projects/[id]/code-files', () => {
  it('retorna 401 quando nao autenticado', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/projects/1/code-files', { method: 'POST', body: '{}' });
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando o usuario nao e dono', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 2 });
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    const req = makeRequest('http://localhost:3000/api/projects/1/code-files', {
      method: 'POST',
      body: JSON.stringify({ filename: 'main.ino' }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(403);
  });

  it('retorna 400 quando filename esta ausente', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    const req = makeRequest('http://localhost:3000/api/projects/1/code-files', { method: 'POST', body: '{}' });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  it('cria o arquivo e retorna 201', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    (prisma.projectCodeFile.create as jest.Mock).mockResolvedValue(mockFile);

    const req = makeRequest('http://localhost:3000/api/projects/1/code-files', {
      method: 'POST',
      body: JSON.stringify({ filename: 'main.ino', content: 'void setup(){}' }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(201);
  });
});

describe('PATCH /api/projects/[id]/code-files/[fileId]', () => {
  it('retorna 404 quando o arquivo pertence a outro projeto', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    (prisma.projectCodeFile.findUnique as jest.Mock).mockResolvedValue({ ...mockFile, projectId: 999 });

    const req = makeRequest('http://localhost:3000/api/projects/1/code-files/7', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'x' }),
    });
    const res = await PATCH(req, { params: fileParams });
    expect(res.status).toBe(404);
  });

  it('atualiza o conteudo do arquivo', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    (prisma.projectCodeFile.findUnique as jest.Mock).mockResolvedValue(mockFile);
    (prisma.projectCodeFile.update as jest.Mock).mockResolvedValue({ ...mockFile, content: 'novo codigo' });

    const req = makeRequest('http://localhost:3000/api/projects/1/code-files/7', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'novo codigo' }),
    });
    const res = await PATCH(req, { params: fileParams });
    expect(res.status).toBe(200);
    expect(prisma.projectCodeFile.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { content: 'novo codigo' },
    });
  });
});

describe('DELETE /api/projects/[id]/code-files/[fileId]', () => {
  it('retorna 403 quando o usuario nao e dono', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 2 });
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });

    const res = await DELETE(makeRequest('http://localhost:3000/api/projects/1/code-files/7', { method: 'DELETE' }), {
      params: fileParams,
    });
    expect(res.status).toBe(403);
  });

  it('exclui o arquivo quando o dono solicita', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    (prisma.projectCodeFile.findUnique as jest.Mock).mockResolvedValue(mockFile);
    (prisma.projectCodeFile.delete as jest.Mock).mockResolvedValue(mockFile);

    const res = await DELETE(makeRequest('http://localhost:3000/api/projects/1/code-files/7', { method: 'DELETE' }), {
      params: fileParams,
    });
    expect(res.status).toBe(200);
    expect(prisma.projectCodeFile.delete).toHaveBeenCalledWith({ where: { id: 7 } });
  });
});
