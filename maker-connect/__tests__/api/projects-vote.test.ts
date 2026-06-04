import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    projectVote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/projects/[id]/vote/route';

const mockProject = { id: 1 };
const mockUser = { id: 10 };

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), { method: 'POST' });
}

describe('POST /api/projects/[id]/vote', () => {
  afterEach(() => jest.clearAllMocks());

  it('registra novo voto e retorna 200 com alreadyVoted=false', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.projectVote.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.projectVote.create as jest.Mock).mockResolvedValue({});
    (prisma.projectVote.count as jest.Mock).mockResolvedValue(3);

    const res = await POST(makeRequest('http://localhost:3000/api/projects/1/vote'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.votes).toBe(3);
    expect(body.data.alreadyVoted).toBe(false);
  });

  it('não cria duplicata quando voto já existe', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.projectVote.findUnique as jest.Mock).mockResolvedValue({ id: 5 });
    (prisma.projectVote.count as jest.Mock).mockResolvedValue(4);

    const res = await POST(makeRequest('http://localhost:3000/api/projects/1/vote'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.alreadyVoted).toBe(true);
    expect(prisma.projectVote.create).not.toHaveBeenCalled();
  });

  it('retorna 404 quando projeto não existe', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await POST(makeRequest('http://localhost:3000/api/projects/99/vote'), {
      params: Promise.resolve({ id: '99' }),
    });
    expect(res.status).toBe(404);
  });

  it('retorna 400 quando usuário padrão não existe', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(makeRequest('http://localhost:3000/api/projects/1/vote'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(400);
  });

  it('retorna 400 para id inválido', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/projects/abc/vote'), {
      params: Promise.resolve({ id: 'abc' }),
    });
    expect(res.status).toBe(400);
  });
});
