import { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: jest.fn() },
    projectDossier: { findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn() },
    projectExtractionLog: { findFirst: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, PATCH, POST } from '@/app/api/projects/[id]/dossier/route';

const mockSession = { userId: 1 };

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

const params = Promise.resolve({ id: '1' });

const rawDossier = {
  id: 5,
  projectId: 1,
  technicalRequirements: JSON.stringify([{ id: 'TR-1', name: 'WiFi', detail: '', priority: 'high' }]),
  suggestedBOM: JSON.stringify([{ item: 'ESP32', quantity: '1', notes: '' }]),
  assemblySteps: JSON.stringify([{ step: 1, title: 'Montar', detail: '' }]),
  sourceExtractionLogId: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
};

afterEach(() => jest.clearAllMocks());

describe('GET /api/projects/[id]/dossier', () => {
  it('retorna 404 quando o projeto nao existe', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest('http://localhost:3000/api/projects/1/dossier'), { params });
    expect(res.status).toBe(404);
  });

  it('retorna o dossie existente com os campos JSON parseados', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.projectDossier.findUnique as jest.Mock).mockResolvedValue(rawDossier);

    const res = await GET(makeRequest('http://localhost:3000/api/projects/1/dossier'), { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.technicalRequirements).toEqual([{ id: 'TR-1', name: 'WiFi', detail: '', priority: 'high' }]);
    expect(body.data.assemblySteps).toEqual([{ step: 1, title: 'Montar', detail: '' }]);
  });

  it('semeia um dossie novo a partir da ultima extracao concluida quando nao existe ainda', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.projectDossier.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.projectExtractionLog.findFirst as jest.Mock).mockResolvedValue({
      id: 10,
      output: JSON.stringify({ technicalRequirements: [{ name: 'X' }], suggestedBOM: [], assemblySteps: [] }),
    });
    (prisma.projectDossier.create as jest.Mock).mockResolvedValue(rawDossier);

    const res = await GET(makeRequest('http://localhost:3000/api/projects/1/dossier'), { params });
    expect(res.status).toBe(200);
    expect(prisma.projectDossier.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ projectId: 1, sourceExtractionLogId: 10 }) })
    );
  });

  it('retorna data null quando nao existe dossie nem extracao concluida', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.projectDossier.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.projectExtractionLog.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest('http://localhost:3000/api/projects/1/dossier'), { params });
    const body = await res.json();
    expect(body.data).toBeNull();
  });
});

describe('PATCH /api/projects/[id]/dossier', () => {
  it('retorna 401 quando nao autenticado', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const req = makeRequest('http://localhost:3000/api/projects/1/dossier', { method: 'PATCH', body: '{}' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando o usuario nao e o dono do projeto', async () => {
    (getSession as jest.Mock).mockResolvedValue({ userId: 2 });
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    const req = makeRequest('http://localhost:3000/api/projects/1/dossier', { method: 'PATCH', body: '{}' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(403);
  });

  it('atualiza o dossie quando o dono edita', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    (prisma.projectDossier.upsert as jest.Mock).mockResolvedValue(rawDossier);

    const req = makeRequest('http://localhost:3000/api/projects/1/dossier', {
      method: 'PATCH',
      body: JSON.stringify({ technicalRequirements: [{ id: 'TR-1', name: 'Novo', detail: '', priority: 'low' }] }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
    expect(prisma.projectDossier.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 1 },
        update: expect.objectContaining({ technicalRequirements: expect.any(String) }),
      })
    );
  });
});

describe('POST /api/projects/[id]/dossier (resync)', () => {
  it('retorna 400 sem { resync: true }', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });

    const req = makeRequest('http://localhost:3000/api/projects/1/dossier', { method: 'POST', body: '{}' });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando nao ha extracao concluida pra ressincronizar', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    (prisma.projectExtractionLog.findFirst as jest.Mock).mockResolvedValue(null);

    const req = makeRequest('http://localhost:3000/api/projects/1/dossier', {
      method: 'POST',
      body: JSON.stringify({ resync: true }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(404);
  });

  it('ressincroniza sobrescrevendo o dossie a partir da ultima extracao', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ creatorId: 1 });
    (prisma.projectExtractionLog.findFirst as jest.Mock).mockResolvedValue({
      id: 11,
      output: JSON.stringify({ technicalRequirements: [], suggestedBOM: [], assemblySteps: [] }),
    });
    (prisma.projectDossier.upsert as jest.Mock).mockResolvedValue({ ...rawDossier, sourceExtractionLogId: 11 });

    const req = makeRequest('http://localhost:3000/api/projects/1/dossier', {
      method: 'POST',
      body: JSON.stringify({ resync: true }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    expect(prisma.projectDossier.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ sourceExtractionLogId: 11 }) })
    );
  });
});
