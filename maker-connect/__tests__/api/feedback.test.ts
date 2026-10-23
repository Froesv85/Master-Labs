import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    feedbackThread: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    feedbackMessage: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const mockGetSession = jest.fn();
jest.mock('@/lib/auth', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

jest.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS: { feedbackByUser: { name: 'feedback-user', limit: 30, windowSeconds: 3600 } },
  checkRateLimit: jest.fn(),
  tooManyRequests: jest.requireActual('@/lib/rate-limit').tooManyRequests,
}));

const mockGetAdminSession = jest.fn();
jest.mock('@/lib/admin', () => ({
  getAdminSession: (...args: unknown[]) => mockGetAdminSession(...args),
}));

import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { GET as listMine, POST as createThread } from '@/app/api/feedback/route';
import { GET as getThread, PATCH as patchThread } from '@/app/api/feedback/[id]/route';
import { POST as postMessage } from '@/app/api/feedback/[id]/messages/route';
import { GET as adminList } from '@/app/api/admin/feedback/route';
import { buildSubject, sanitizePagePath } from '@/lib/feedback';

const maker = { userId: 10, email: 'maker@example.com', name: 'Maker' };
const admin = { userId: 1, email: 'froesv@gmail.com', name: 'Admin' };

function asUser(session: typeof maker, role: 'user' | 'admin') {
  mockGetSession.mockResolvedValue(session);
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role });
}

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  jest.clearAllMocks();
  (checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  (prisma.$transaction as jest.Mock).mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
});

describe('lib/feedback', () => {
  it('usa o começo da mensagem como assunto quando ele não vem', () => {
    expect(buildSubject('', 'O filtro de\n categoria   não funciona')).toBe('O filtro de categoria não funciona');
    expect(buildSubject(undefined, 'x'.repeat(300))).toHaveLength(160);
  });

  it('só aceita caminho interno e descarta query string', () => {
    expect(sanitizePagePath('/projects/12?token=abc#x')).toBe('/projects/12');
    expect(sanitizePagePath('https://evil.example')).toBeNull();
    expect(sanitizePagePath('//evil.example')).toBeNull();
    expect(sanitizePagePath(42)).toBeNull();
  });
});

describe('POST /api/feedback', () => {
  it('retorna 401 sem sessão', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await createThread(jsonRequest('/api/feedback', 'POST', { content: 'oi' }));
    expect(res.status).toBe(401);
  });

  it('rejeita mensagem vazia e categoria inválida', async () => {
    asUser(maker, 'user');
    expect((await createThread(jsonRequest('/api/feedback', 'POST', { content: '   ' }))).status).toBe(400);
    expect((await createThread(jsonRequest('/api/feedback', 'POST', { content: 'oi', category: 'spam' }))).status).toBe(400);
    expect(prisma.feedbackThread.create).not.toHaveBeenCalled();
  });

  it('rejeita mensagem acima do limite de tamanho', async () => {
    asUser(maker, 'user');
    const res = await createThread(jsonRequest('/api/feedback', 'POST', { content: 'a'.repeat(4001) }));
    expect(res.status).toBe(400);
  });

  it('cria a conversa com a primeira mensagem do usuário', async () => {
    asUser(maker, 'user');
    (prisma.feedbackThread.create as jest.Mock).mockResolvedValue({ id: 5 });

    const res = await createThread(
      jsonRequest('/api/feedback', 'POST', { category: 'bug', content: 'PDF sai sem logo', pagePath: '/projects/3?x=1' })
    );

    expect(res.status).toBe(201);
    const { data } = (prisma.feedbackThread.create as jest.Mock).mock.calls[0][0];
    expect(data).toMatchObject({
      userId: 10,
      category: 'bug',
      subject: 'PDF sai sem logo',
      pagePath: '/projects/3',
      messages: { create: { authorId: 10, fromAdmin: false, content: 'PDF sai sem logo' } },
    });
  });

  it('retorna 429 quando o limite de envio estoura', async () => {
    asUser(maker, 'user');
    (checkRateLimit as jest.Mock).mockResolvedValue({ allowed: false, retryAfterSeconds: 120 });
    const res = await createThread(jsonRequest('/api/feedback', 'POST', { content: 'oi' }));
    expect(res.status).toBe(429);
    expect(prisma.feedbackThread.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/feedback', () => {
  it('lista só as conversas do próprio usuário', async () => {
    asUser(maker, 'user');
    (prisma.feedbackThread.findMany as jest.Mock).mockResolvedValue([]);
    const res = await listMine();
    expect(res.status).toBe(200);
    expect((prisma.feedbackThread.findMany as jest.Mock).mock.calls[0][0].where).toEqual({ userId: 10 });
  });
});

describe('GET /api/feedback/[id]', () => {
  const thread = { id: 5, userId: 10, adminUnread: true, userUnread: true, messages: [] };

  it('esconde a conversa de outro usuário com 404', async () => {
    asUser({ ...maker, userId: 99 }, 'user');
    (prisma.feedbackThread.findUnique as jest.Mock).mockResolvedValue(thread);
    const res = await getThread(jsonRequest('/api/feedback/5', 'GET'), params('5'));
    expect(res.status).toBe(404);
  });

  it('dono abre a conversa e ela fica lida para ele', async () => {
    asUser(maker, 'user');
    (prisma.feedbackThread.findUnique as jest.Mock).mockResolvedValue(thread);
    const res = await getThread(jsonRequest('/api/feedback/5', 'GET'), params('5'));
    expect(res.status).toBe(200);
    expect(prisma.feedbackThread.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { userUnread: false } });
  });

  it('admin abre a conversa de qualquer usuário, vê o e-mail e ela fica lida para a administração', async () => {
    asUser(admin, 'admin');
    (prisma.feedbackThread.findUnique as jest.Mock).mockResolvedValue(thread);
    const res = await getThread(jsonRequest('/api/feedback/5', 'GET'), params('5'));
    expect(res.status).toBe(200);
    const select = (prisma.feedbackThread.findUnique as jest.Mock).mock.calls[0][0].select;
    expect(select.user.select.email).toBe(true);
    expect(prisma.feedbackThread.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { adminUnread: false } });
  });

  it('usuário comum não recebe e-mail de ninguém', async () => {
    asUser(maker, 'user');
    (prisma.feedbackThread.findUnique as jest.Mock).mockResolvedValue(thread);
    await getThread(jsonRequest('/api/feedback/5', 'GET'), params('5'));
    const select = (prisma.feedbackThread.findUnique as jest.Mock).mock.calls[0][0].select;
    expect(select.user.select.email).toBe(false);
  });
});

describe('POST /api/feedback/[id]/messages', () => {
  it('resposta do admin marca a conversa como respondida e não lida pelo usuário', async () => {
    asUser(admin, 'admin');
    (prisma.feedbackThread.findUnique as jest.Mock).mockResolvedValue({ id: 5, userId: 10 });
    (prisma.feedbackMessage.create as jest.Mock).mockResolvedValue({ id: 1 });

    const res = await postMessage(jsonRequest('/api/feedback/5/messages', 'POST', { content: 'Corrigido!' }), params('5'));

    expect(res.status).toBe(201);
    expect((prisma.feedbackMessage.create as jest.Mock).mock.calls[0][0].data).toMatchObject({ fromAdmin: true, authorId: 1 });
    expect((prisma.feedbackThread.update as jest.Mock).mock.calls[0][0].data).toMatchObject({
      status: 'answered',
      userUnread: true,
      adminUnread: false,
    });
  });

  it('mensagem do usuário reabre a conversa para a administração', async () => {
    asUser(maker, 'user');
    (prisma.feedbackThread.findUnique as jest.Mock).mockResolvedValue({ id: 5, userId: 10 });
    (prisma.feedbackMessage.create as jest.Mock).mockResolvedValue({ id: 2 });

    await postMessage(jsonRequest('/api/feedback/5/messages', 'POST', { content: 'Ainda acontece' }), params('5'));

    expect((prisma.feedbackMessage.create as jest.Mock).mock.calls[0][0].data.fromAdmin).toBe(false);
    expect((prisma.feedbackThread.update as jest.Mock).mock.calls[0][0].data).toMatchObject({
      status: 'open',
      adminUnread: true,
    });
  });

  it('usuário não escreve na conversa de outro', async () => {
    asUser({ ...maker, userId: 99 }, 'user');
    (prisma.feedbackThread.findUnique as jest.Mock).mockResolvedValue({ id: 5, userId: 10 });
    const res = await postMessage(jsonRequest('/api/feedback/5/messages', 'POST', { content: 'oi' }), params('5'));
    expect(res.status).toBe(404);
    expect(prisma.feedbackMessage.create).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/feedback/[id]', () => {
  it('só admin muda o status', async () => {
    asUser(maker, 'user');
    const res = await patchThread(jsonRequest('/api/feedback/5', 'PATCH', { status: 'closed' }), params('5'));
    expect(res.status).toBe(403);
  });

  it('admin encerra a conversa', async () => {
    asUser(admin, 'admin');
    (prisma.feedbackThread.findUnique as jest.Mock).mockResolvedValue({ id: 5 });
    (prisma.feedbackThread.update as jest.Mock).mockResolvedValue({ id: 5, status: 'closed' });
    const res = await patchThread(jsonRequest('/api/feedback/5', 'PATCH', { status: 'closed' }), params('5'));
    expect(res.status).toBe(200);
    expect((prisma.feedbackThread.update as jest.Mock).mock.calls[0][0].data).toEqual({ status: 'closed' });
  });

  it('rejeita status inválido', async () => {
    asUser(admin, 'admin');
    const res = await patchThread(jsonRequest('/api/feedback/5', 'PATCH', { status: 'deleted' }), params('5'));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/feedback', () => {
  it('retorna 403 para quem não é admin', async () => {
    mockGetAdminSession.mockResolvedValue(null);
    const res = await adminList(jsonRequest('/api/admin/feedback', 'GET'));
    expect(res.status).toBe(403);
  });

  it('lista todas as conversas com filtros e contagem de não lidas', async () => {
    mockGetAdminSession.mockResolvedValue(admin);
    (prisma.feedbackThread.findMany as jest.Mock).mockResolvedValue([{ id: 5 }]);
    (prisma.feedbackThread.count as jest.Mock).mockResolvedValueOnce(1).mockResolvedValueOnce(3);

    const res = await adminList(jsonRequest('/api/admin/feedback?status=open&category=bug&unread=1&page=2', 'GET'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta).toEqual({ page: 2, pageSize: 30, total: 1, unread: 3 });
    const query = (prisma.feedbackThread.findMany as jest.Mock).mock.calls[0][0];
    expect(query.where).toEqual({ status: 'open', category: 'bug', adminUnread: true });
    expect(query.skip).toBe(30);
  });
});
