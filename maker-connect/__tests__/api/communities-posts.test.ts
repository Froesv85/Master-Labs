import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: { findUnique: jest.fn() },
    communityMember: { findUnique: jest.fn() },
    communityPost: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { POST, GET } from '@/app/api/communities/[id]/posts/route';

const CLOUD_ID = '398f0136-eaf3-4f11-aac5-33cd1b8ce4ee';

const mockSession = { userId: 7, email: 'maker@test.com', name: 'Maker Dev' };
const mockPublicCommunity = { id: 1, isPublic: true };
const mockPrivateCommunity = { id: 2, isPublic: false };
const mockMembership = { id: 99 };
const mockPost = {
  id: 1,
  communityId: 1,
  title: 'Meu primeiro post',
  content: 'Conteúdo do post com mais de dez caracteres.',
  replies: 0,
  views: 0,
  createdAt: new Date('2026-04-28'),
  author: { id: 7, name: 'Maker Dev' },
};

function makePostRequest(communityId: string, body: unknown) {
  return new NextRequest(`http://localhost:3000/api/communities/${communityId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(communityId: string, qs = '') {
  return new NextRequest(
    new URL(`http://localhost:3000/api/communities/${communityId}/posts${qs}`)
  );
}

const params = (id: string) => Promise.resolve({ id });

afterEach(() => jest.clearAllMocks());

// ─── POST ────────────────────────────────────────────────────────────────────

describe('POST /api/communities/[id]/posts', () => {
  it('retorna 401 sem sessão', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makePostRequest('1', { title: 'Hi', content: 'conteudo valido aqui' }), {
      params: params('1'),
    });
    expect(res.status).toBe(401);
  });

  it('retorna 400 para communityId inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const res = await POST(
      makePostRequest('abc', { title: 'Título', content: 'conteudo valido aqui' }),
      { params: params('abc') }
    );
    expect(res.status).toBe(400);
  });

  it('retorna 400 para body JSON inválido', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const req = new NextRequest('http://localhost:3000/api/communities/1/posts', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req, { params: params('1') });
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando title tem menos de 3 caracteres', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const res = await POST(
      makePostRequest('1', { title: 'ab', content: 'conteudo valido aqui' }),
      { params: params('1') }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/title/i);
  });

  it('retorna 400 quando content tem menos de 10 caracteres', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    const res = await POST(
      makePostRequest('1', { title: 'Título válido', content: 'curto' }),
      { params: params('1') }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/content/i);
  });

  it('retorna 404 quando comunidade não existe', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(
      makePostRequest('1', { title: 'Título válido', content: 'conteudo valido aqui' }),
      { params: params('1') }
    );
    expect(res.status).toBe(404);
  });

  it('retorna 403 para não-membro em comunidade privada', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPrivateCommunity);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(
      makePostRequest('2', { title: 'Título válido', content: 'conteudo valido aqui' }),
      { params: params('2') }
    );
    expect(res.status).toBe(403);
  });

  it('cria post em comunidade pública sem verificar membership', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (prisma.communityPost.create as jest.Mock).mockResolvedValue(mockPost);

    const res = await POST(
      makePostRequest('1', { title: 'Meu primeiro post', content: 'Conteúdo do post com mais de dez caracteres.' }),
      { params: params('1') }
    );

    expect(res.status).toBe(201);
    expect(prisma.communityMember.findUnique).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.data.id).toBe(1);
    expect(body.data.title).toBe('Meu primeiro post');
    expect(body.data.author.name).toBe('Maker Dev');
  });

  it('cria post quando usuário é membro de comunidade privada', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPrivateCommunity);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMembership);
    (prisma.communityPost.create as jest.Mock).mockResolvedValue({ ...mockPost, communityId: 2 });

    const res = await POST(
      makePostRequest('2', { title: 'Post privado', content: 'Conteúdo exclusivo para membros.' }),
      { params: params('2') }
    );

    expect(res.status).toBe(201);
  });

  it('salva authorId da sessão e não do body', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (prisma.communityPost.create as jest.Mock).mockResolvedValue(mockPost);

    await POST(
      makePostRequest('1', { title: 'Post seguro', content: 'Conteúdo não adulterável pelo usuário.' }),
      { params: params('1') }
    );

    expect(prisma.communityPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: mockSession.userId }),
      })
    );
  });
});

// ─── GET ─────────────────────────────────────────────────────────────────────

describe('GET /api/communities/[id]/posts', () => {
  it('retorna 400 para communityId inválido', async () => {
    const res = await GET(makeGetRequest('xyz'), { params: params('xyz') });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando comunidade não existe', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest('99'), { params: params('99') });
    expect(res.status).toBe(404);
  });

  it('retorna 401 para não-autenticado em comunidade privada', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPrivateCommunity);
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest('2'), { params: params('2') });
    expect(res.status).toBe(401);
  });

  it('retorna 403 para não-membro em comunidade privada', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPrivateCommunity);
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest('2'), { params: params('2') });
    expect(res.status).toBe(403);
  });

  it('retorna posts com paginação padrão em comunidade pública', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (prisma.communityPost.findMany as jest.Mock).mockResolvedValue([mockPost]);
    (prisma.communityPost.count as jest.Mock).mockResolvedValue(1);

    const res = await GET(makeGetRequest('1'), { params: params('1') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(body.hasMore).toBe(false);
  });

  it('aplica paginação correta via query params', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (prisma.communityPost.findMany as jest.Mock).mockResolvedValue([mockPost]);
    (prisma.communityPost.count as jest.Mock).mockResolvedValue(25);

    const res = await GET(makeGetRequest('1', '?page=2&limit=10'), { params: params('1') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.limit).toBe(10);
    expect(body.hasMore).toBe(true);

    expect(prisma.communityPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });

  it('limita o máximo de items por página a 50', async () => {
    (prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPublicCommunity);
    (prisma.communityPost.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.communityPost.count as jest.Mock).mockResolvedValue(0);

    await GET(makeGetRequest('1', '?limit=999'), { params: params('1') });

    expect(prisma.communityPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });
});
