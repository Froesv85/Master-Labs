import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockGetSession = jest.fn();
jest.mock('@/lib/auth', () => ({
  getSession: mockGetSession,
}));

import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/projects/[id]/fork/route';

const mockProject = {
  id: 1,
  title: 'RoboSumo v2',
  description: 'Robô de sumô',
  category: 'Robotics',
  content: null,
};
const mockSession = { userId: 10, email: 'maker@example.com', name: 'Maker' };
const mockFork = {
  id: 2,
  title: 'RoboSumo v2 (Fork)',
  parentId: 1,
  creatorId: 10,
  category: 'Robotics',
  createdAt: new Date(),
};

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), { method: 'POST' });
}

describe('POST /api/projects/[id]/fork', () => {
  afterEach(() => jest.clearAllMocks());

  it('cria fork e retorna 201', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.project.create as jest.Mock).mockResolvedValue(mockFork);

    const res = await POST(makeRequest('http://localhost:3000/api/projects/1/fork'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.title).toBe('RoboSumo v2 (Fork)');
    expect(body.data.parentId).toBe(1);
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ creatorId: 10 }) })
    );
  });

  it('retorna 404 quando projeto original não existe', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(makeRequest('http://localhost:3000/api/projects/99/fork'), {
      params: Promise.resolve({ id: '99' }),
    });
    expect(res.status).toBe(404);
  });

  it('retorna 401 quando não autenticado', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await POST(makeRequest('http://localhost:3000/api/projects/1/fork'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(401);
    expect(prisma.project.findUnique).not.toHaveBeenCalled();
  });

  it('retorna 400 para id inválido', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/projects/abc/fork'), {
      params: Promise.resolve({ id: 'abc' }),
    });
    expect(res.status).toBe(400);
  });
});
